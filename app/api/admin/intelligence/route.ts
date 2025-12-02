import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import IntelligenceJob from '@/models/IntelligenceJob';
import Deal from '@/models/Deal';
import { runIntelligenceJob } from '@/lib/ai/intelligenceRunner';
import { calculateDealScore, formatDealAmount, getStageLabel } from '@/lib/scoring/dealScorer';
import { getLatestCompletedJob, createHistorySnapshot } from '@/lib/ai/changeDetection';
import mongoose from 'mongoose';

/**
 * POST /api/admin/intelligence - Create a new intelligence job
 * Body:
 *   - entityType: 'contact' | 'company' | 'deal'
 *   - entityId: HubSpot ID
 *   - entityName: Display name
 *   - isRerun?: boolean - If true, links to previous job and copies history
 * Returns immediately with jobId, job runs in background
 */
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId, entityName, isRerun } = body;

    if (!entityType || !entityId || !entityName) {
      return NextResponse.json(
        { error: 'entityType, entityId, and entityName are required' },
        { status: 400 }
      );
    }

    if (!['contact', 'company', 'deal'].includes(entityType)) {
      return NextResponse.json(
        { error: 'entityType must be contact, company, or deal' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get HubSpot API key
    const hubspotApiKey = 
      process.env.HUBSPOT_API_KEY || 
      process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
      process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!hubspotApiKey) {
      return NextResponse.json(
        { error: 'HubSpot API key not configured' },
        { status: 500 }
      );
    }

    // Check for previous completed job for this entity
    const previousJob = await getLatestCompletedJob(IntelligenceJob, entityType, entityId);
    
    // Determine version number
    let version = 1;
    let history: any[] = [];
    let previousJobId = undefined;
    
    if (previousJob) {
      version = (previousJob.version || 1) + 1;
      previousJobId = previousJob._id;
      
      // Build history from previous job's history + the previous job itself
      history = [...(previousJob.history || [])];
      
      // Add the previous job as a history entry
      const previousSnapshot = createHistorySnapshot(previousJob as any);
      history.push(previousSnapshot);
      
      // Keep only the last 20 history entries to prevent unbounded growth
      if (history.length > 20) {
        history = history.slice(-20);
      }
    }

    // Create job record with history tracking
    const job = new IntelligenceJob({
      entityType,
      entityId,
      entityName,
      status: 'pending',
      userId: user.userId,
      startedAt: new Date(),
      version,
      previousJobId,
      analysisId: new mongoose.Types.ObjectId().toString(),
      history,
    });

    await job.save();

    // Start background execution (fire and forget)
    runIntelligenceJob({
      jobId: job._id.toString(),
      entityType,
      entityId,
      entityName,
      hubspotApiKey,
      userId: user.userId,
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job._id.toString(),
        entityType: job.entityType,
        entityId: job.entityId,
        entityName: job.entityName,
        status: job.status,
        startedAt: job.startedAt,
        version: job.version,
        isRerun: version > 1,
        previousJobId: previousJobId?.toString(),
        historyCount: history.length,
      },
    });
  } catch (error: any) {
    console.error('Error creating intelligence job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create intelligence job' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/intelligence - List intelligence jobs
 * Query params:
 * - status: filter by status (pending, running, complete, error, cancelled)
 * - entityType: filter by entity type (contact, company, deal)
 * - entityId: filter by specific entity ID
 * - limit: max results (default: 50)
 * - sort: sort order (default: -startedAt for newest first)
 * - latestOnly: if true, only return the latest job per entity (for de-duplication)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[INTELLIGENCE API] GET /api/admin/intelligence - Starting request');
  
  try {
    const user = verifyAuth(request);
    if (!user) {
      console.log('[INTELLIGENCE API] ❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[INTELLIGENCE API] ✅ Authenticated user:', user.userId);

    console.log('[INTELLIGENCE API] Connecting to database...');
    try {
      await connectDB();
      console.log('[INTELLIGENCE API] ✅ Database connected');
    } catch (dbError: any) {
      console.error('[INTELLIGENCE API] ❌ Database connection failed:', dbError.message);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: dbError.message,
          details: 'Unable to connect to MongoDB. Please check your database connection.',
        },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType') as 'contact' | 'company' | 'deal' | null;
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sort = searchParams.get('sort') || '-startedAt';
    const latestOnly = searchParams.get('latestOnly') === 'true';
    
    console.log('[INTELLIGENCE API] Query params:', { status, entityType, entityId, limit, sort, latestOnly });

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (entityType) {
      query.entityType = entityType;
    }
    if (entityId) {
      query.entityId = entityId;
    }

    // Build sort object
    const sortObj: any = {};
    if (sort.startsWith('-')) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    let jobs;
    
    console.log('[INTELLIGENCE API] Querying jobs...');
    const queryStartTime = Date.now();
    const QUERY_TIMEOUT_MS = 15000; // 15 second timeout for queries
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timeout: exceeded ${QUERY_TIMEOUT_MS}ms. MongoDB Atlas may be experiencing connectivity issues.`));
        }, QUERY_TIMEOUT_MS);
      });
      
      // Only select fields needed for the list view (exclude large fields like history, logs, result details)
      const listProjection = {
        _id: 1,
        entityType: 1,
        entityId: 1,
        entityName: 1,
        status: 1,
        error: 1,
        startedAt: 1,
        completedAt: 1,
        stats: 1,
        version: 1,
        previousJobId: 1,
        changeDetection: 1,
        // Only include summary data from result, not full analysis
        'result.engagementScore': 1,
        'result.healthScore': 1,
        'result.dealScore': 1,
        'result.executiveSummary': 1,
      };
      
      // Race the query against the timeout
      if (latestOnly) {
        // Use aggregation to get only the latest job per entity
        const pipeline: any[] = [
          { $match: query },
          { $sort: { startedAt: -1 } },
          {
            $group: {
              _id: { entityType: '$entityType', entityId: '$entityId' },
              doc: { $first: '$$ROOT' },
            },
          },
          { $replaceRoot: { newRoot: '$doc' } },
          { $project: listProjection },
          { $sort: sortObj },
          { $limit: limit },
        ];
        
        jobs = await Promise.race([
          IntelligenceJob.aggregate(pipeline),
          timeoutPromise
        ]) as any[];
      } else {
        jobs = await Promise.race([
          IntelligenceJob.find(query)
            .select(listProjection)
            .sort(sortObj)
            .limit(limit)
            .lean(),
          timeoutPromise
        ]) as any[];
      }
      
      const queryDuration = Date.now() - queryStartTime;
      console.log(`[INTELLIGENCE API] ✅ Found ${jobs.length} jobs in ${queryDuration}ms`);
    } catch (queryError: any) {
      const queryDuration = Date.now() - queryStartTime;
      console.error(`[INTELLIGENCE API] ❌ Query failed after ${queryDuration}ms:`, queryError.message);
      throw queryError;
    }

    // Fetch deal data for deal-type jobs to include deal details
    // Limit to first 20 deals to prevent timeout on large datasets
    const dealIds = jobs
      .filter(j => j.entityType === 'deal' && j.entityId)
      .slice(0, 20) // Limit to prevent timeout
      .map(j => j.entityId)
      .filter((id): id is string => Boolean(id));
    
    let dealsByHubspotId: Record<string, any> = {};
    if (dealIds.length > 0) {
      try {
        // Add timeout and limit to prevent hanging
        const deals = await Promise.race([
          Deal.find({ hubspotId: { $in: dealIds } }).limit(20).lean(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Deal query timeout')), 5000)
          )
        ]) as any[];
        
        dealsByHubspotId = deals.reduce((acc, deal) => {
          if (deal && deal.hubspotId) {
            acc[deal.hubspotId] = deal;
          }
          return acc;
        }, {} as Record<string, any>);
      } catch (dealError: any) {
        console.error('Error fetching deals (continuing without deal data):', dealError.message);
        // Continue without deal data if fetch fails or times out
      }
    }

    // Map jobs with error handling for each job
    const mappedJobs = jobs.map(job => {
      try {
        // Base job data
        const jobData: any = {
          _id: job._id?.toString() || '',
          id: job._id?.toString() || '',
          entityType: job.entityType || 'deal',
          entityId: job.entityId || '',
          entityName: job.entityName || 'Unknown',
          status: job.status || 'pending',
          result: job.result || null,
          error: job.error || null,
          startedAt: job.startedAt || new Date(),
          completedAt: job.completedAt || null,
          stats: job.stats || null,
          // logs not included in list view for performance
          version: job.version || 1,
          // history not fetched in list view for performance
          hasHistory: Boolean(job.previousJobId),
          changeDetection: job.changeDetection || null,
        };
        
        // Add deal-specific data for deal jobs
        if (job.entityType === 'deal' && job.entityId) {
          const deal = dealsByHubspotId[job.entityId];
          if (deal) {
            try {
              // Calculate deal score with error handling
              // Ensure all required fields have defaults
              const dealData = {
                dealId: deal.hubspotId || job.entityId || '',
                dealname: deal.dealname || job.entityName || 'Unknown Deal',
                amount: deal.amount || '0',
                dealstage: deal.dealstage || '',
                pipeline: deal.pipeline || '',
                closedate: deal.closedate || undefined,
                dealtype: deal.dealtype || undefined,
                isClosed: Boolean(deal.isClosed),
                isWon: Boolean(deal.isWon),
                isLost: Boolean(deal.isLost),
                companyIds: Array.isArray(deal.companyIds) ? deal.companyIds : [],
                contactIds: Array.isArray(deal.contactIds) ? deal.contactIds : [],
                properties: deal.properties && typeof deal.properties === 'object' ? deal.properties : {},
                updatedAt: deal.updatedAt || deal.lastSyncedAt || new Date(),
              };
              
              const dealScore = calculateDealScore(dealData);
              
              jobData.dealDetails = {
                dealstage: deal.dealstage || '',
                stageLabel: getStageLabel(deal.dealstage || ''),
                amount: deal.amount || '0',
                amountFormatted: formatDealAmount(deal.amount),
                pipeline: deal.pipeline || '',
                closedate: deal.closedate || null,
                dealtype: deal.dealtype || null,
                isClosed: Boolean(deal.isClosed),
                isWon: Boolean(deal.isWon),
                isLost: Boolean(deal.isLost),
                dealScore,
              };
            } catch (scoreError: any) {
              console.error(`Error calculating deal score for deal ${job.entityId}:`, scoreError);
              // Continue without deal score if calculation fails
              jobData.dealDetails = {
                dealstage: deal.dealstage || '',
                stageLabel: getStageLabel(deal.dealstage || ''),
                amount: deal.amount || '0',
                amountFormatted: formatDealAmount(deal.amount),
                pipeline: deal.pipeline || '',
                closedate: deal.closedate || null,
                dealtype: deal.dealtype || null,
                isClosed: Boolean(deal.isClosed),
                isWon: Boolean(deal.isWon),
                isLost: Boolean(deal.isLost),
              };
            }
          }
        }
        
        return jobData;
      } catch (jobError: any) {
        console.error(`Error processing job ${job._id}:`, jobError);
        // Return minimal job data if processing fails
        return {
          _id: job._id?.toString() || '',
          id: job._id?.toString() || '',
          entityType: job.entityType || 'deal',
          entityId: job.entityId || '',
          entityName: job.entityName || 'Unknown',
          status: job.status || 'error',
          error: `Failed to process job: ${jobError.message}`,
          startedAt: job.startedAt || new Date(),
        };
      }
    });

    const totalDuration = Date.now() - startTime;
    console.log(`[INTELLIGENCE API] ✅ Request completed in ${totalDuration}ms`);
    
    return NextResponse.json({
      jobs: mappedJobs,
      count: mappedJobs.length,
    });
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`[INTELLIGENCE API] ❌ Error after ${totalDuration}ms:`, error.message);
    console.error('[INTELLIGENCE API] Full error:', error);
    
    // Check if it's a MongoDB connection or timeout error
    if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED') || error.name === 'MongooseServerSelectionError' || error.name === 'MongoNetworkTimeoutError') {
      return NextResponse.json(
        { 
          error: error.message,
          message: 'MongoDB Atlas connection timeout. Please check: 1) Your IP is whitelisted in Atlas Network Access, 2) Atlas cluster status at status.cloud.mongodb.com',
          details: `Network timeout to MongoDB. If this persists, verify your MongoDB Atlas Network Access settings allow connections from your current IP address.`,
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch intelligence jobs',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/intelligence - Cancel all running and pending intelligence jobs
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find all running and pending jobs
    const runningJobs = await IntelligenceJob.find({
      status: { $in: ['running', 'pending'] }
    });

    const jobIds = runningJobs.map(job => job._id.toString());
    const count = runningJobs.length;

    // Cancel all of them
    const result = await IntelligenceJob.updateMany(
      { status: { $in: ['running', 'pending'] } },
      { 
        $set: { 
          status: 'cancelled',
          completedAt: new Date(),
        }
      }
    );

    return NextResponse.json({
      success: true,
      cancelled: result.modifiedCount,
      total: count,
      jobIds: jobIds,
    });
  } catch (error: any) {
    console.error('Error cancelling intelligence jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel intelligence jobs' },
      { status: 500 }
    );
  }
}

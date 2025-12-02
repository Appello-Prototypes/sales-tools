import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import IntelligenceJob from '@/models/IntelligenceJob';
import { runIntelligenceJobWithRetry } from '@/lib/ai/intelligenceRunner';
import { getLatestCompletedJob, createHistorySnapshot } from '@/lib/ai/changeDetection';
import mongoose from 'mongoose';

interface JobToRerun {
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  entityName: string;
}

interface BatchRerunRequest {
  jobs: JobToRerun[];
  // Optional retry configuration
  maxRetries?: number;
  initialDelayMs?: number;
}

/**
 * POST /api/admin/intelligence/batch-rerun
 * Re-run one or more intelligence jobs with built-in retry logic
 * 
 * Body:
 *   - jobs: Array of { entityType, entityId, entityName }
 *   - maxRetries?: number (default: 3)
 *   - initialDelayMs?: number (default: 30000 = 30 seconds)
 * 
 * The jobs will be queued and run with exponential backoff on rate limit errors
 */
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BatchRerunRequest = await request.json();
    const { jobs: jobsToRerun, maxRetries = 3, initialDelayMs = 30000 } = body;

    if (!jobsToRerun || !Array.isArray(jobsToRerun) || jobsToRerun.length === 0) {
      return NextResponse.json(
        { error: 'jobs array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (jobsToRerun.length > 50) {
      return NextResponse.json(
        { error: 'Maximum batch size is 50 jobs' },
        { status: 400 }
      );
    }

    // Validate all jobs
    for (const job of jobsToRerun) {
      if (!job.entityType || !job.entityId || !job.entityName) {
        return NextResponse.json(
          { error: 'Each job must have entityType, entityId, and entityName' },
          { status: 400 }
        );
      }
      if (!['contact', 'company', 'deal'].includes(job.entityType)) {
        return NextResponse.json(
          { error: 'entityType must be contact, company, or deal' },
          { status: 400 }
        );
      }
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

    const createdJobs: Array<{
      id: string;
      entityType: string;
      entityId: string;
      entityName: string;
      status: string;
      version: number;
    }> = [];

    // Create job records for each entity
    for (const jobRequest of jobsToRerun) {
      const { entityType, entityId, entityName } = jobRequest;

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
        
        // Keep only the last 20 history entries
        if (history.length > 20) {
          history = history.slice(-20);
        }
      }

      // Create job record with retry configuration
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
        retryConfig: {
          maxRetries,
          initialDelayMs,
          currentRetry: 0,
        },
      });

      await job.save();

      createdJobs.push({
        id: job._id.toString(),
        entityType: job.entityType,
        entityId: job.entityId,
        entityName: job.entityName,
        status: job.status,
        version: job.version,
      });

      // Start background execution with retry support
      runIntelligenceJobWithRetry({
        jobId: job._id.toString(),
        entityType,
        entityId,
        entityName,
        hubspotApiKey,
        userId: user.userId,
        maxRetries,
        initialDelayMs,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${createdJobs.length} job(s) for re-run with retry support`,
      jobs: createdJobs,
      retryConfig: {
        maxRetries,
        initialDelayMs,
      },
    });
  } catch (error: any) {
    console.error('Error batch re-running intelligence jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to batch re-run intelligence jobs' },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import IntelligenceJob from '@/models/IntelligenceJob';
import { runIntelligenceJob } from '@/lib/ai/intelligenceRunner';
import { getLatestCompletedJob, createHistorySnapshot } from '@/lib/ai/changeDetection';
import mongoose from 'mongoose';

interface BatchJobInput {
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  entityName: string;
}

/**
 * POST /api/admin/intelligence/batch - Create multiple intelligence jobs at once
 * Body: { jobs: [{ entityType, entityId, entityName }, ...] }
 * 
 * This endpoint automatically handles re-run logic:
 * - If a previous completed job exists for an entity, the new job will be linked to it
 * - History is preserved and the version number is incremented
 */
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobs } = body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: 'jobs array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate all jobs
    for (const job of jobs) {
      if (!job.entityType || !job.entityId || !job.entityName) {
        return NextResponse.json(
          { error: 'Each job must have entityType, entityId, and entityName' },
          { status: 400 }
        );
      }
      if (!['contact', 'company', 'deal'].includes(job.entityType)) {
        return NextResponse.json(
          { error: `Invalid entityType: ${job.entityType}. Must be contact, company, or deal` },
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

    // Get entity keys for querying previous jobs
    const entityKeys = jobs.map((j: BatchJobInput) => ({
      entityType: j.entityType,
      entityId: j.entityId,
    }));

    // Fetch all previous completed jobs for these entities in one query
    const previousJobs = await IntelligenceJob.find({
      $or: entityKeys.map(k => ({
        entityType: k.entityType,
        entityId: k.entityId,
        status: 'complete',
      })),
    })
      .sort({ completedAt: -1 })
      .lean();

    // Create a map of previous jobs by entity key
    const previousJobsMap = new Map<string, any>();
    for (const pj of previousJobs) {
      const key = `${pj.entityType}:${pj.entityId}`;
      // Only keep the first (most recent) job for each entity
      if (!previousJobsMap.has(key)) {
        previousJobsMap.set(key, pj);
      }
    }

    // Create all job records with history tracking
    const jobDocs = jobs.map((job: BatchJobInput) => {
      const key = `${job.entityType}:${job.entityId}`;
      const previousJob = previousJobsMap.get(key);
      
      let version = 1;
      let history: any[] = [];
      let previousJobId = undefined;
      
      if (previousJob) {
        version = (previousJob.version || 1) + 1;
        previousJobId = previousJob._id;
        
        // Build history
        history = [...(previousJob.history || [])];
        const previousSnapshot = createHistorySnapshot(previousJob);
        history.push(previousSnapshot);
        
        // Keep only the last 20 history entries
        if (history.length > 20) {
          history = history.slice(-20);
        }
      }
      
      return {
        entityType: job.entityType,
        entityId: job.entityId,
        entityName: job.entityName,
        status: 'pending' as const,
        userId: user.userId,
        startedAt: new Date(),
        version,
        previousJobId,
        analysisId: new mongoose.Types.ObjectId().toString(),
        history,
      };
    });

    const createdJobs = await IntelligenceJob.insertMany(jobDocs);

    // Start background execution for all jobs
    for (const jobDoc of createdJobs) {
      const jobData = jobs.find(
        (j: BatchJobInput) => j.entityId === jobDoc.entityId && j.entityType === jobDoc.entityType
      );
      
      if (jobData) {
        runIntelligenceJob({
          jobId: jobDoc._id.toString(),
          entityType: jobDoc.entityType,
          entityId: jobDoc.entityId,
          entityName: jobDoc.entityName,
          hubspotApiKey,
          userId: user.userId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      jobs: createdJobs.map(job => ({
        id: job._id.toString(),
        entityType: job.entityType,
        entityId: job.entityId,
        entityName: job.entityName,
        status: job.status,
        startedAt: job.startedAt,
        version: job.version,
        isRerun: (job.version || 1) > 1,
        historyCount: (job.history || []).length,
      })),
      count: createdJobs.length,
      reruns: createdJobs.filter(j => (j.version || 1) > 1).length,
    });
  } catch (error: any) {
    console.error('Error creating batch intelligence jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create batch intelligence jobs' },
      { status: 500 }
    );
  }
}

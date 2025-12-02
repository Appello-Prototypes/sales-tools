import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import IntelligenceJob from '@/models/IntelligenceJob';

/**
 * GET /api/admin/intelligence/[jobId] - Get a specific intelligence job
 * Includes full history and change detection data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    await connectDB();

    const job = await IntelligenceJob.findById(jobId).lean();

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get previous job if exists for comparison
    let previousJob = null;
    if (job.previousJobId) {
      previousJob = await IntelligenceJob.findById(job.previousJobId)
        .select('result completedAt version analysisId')
        .lean();
    }

    return NextResponse.json({
      job: {
        _id: job._id.toString(),
        id: job._id.toString(),
        entityType: job.entityType,
        entityId: job.entityId,
        entityName: job.entityName,
        status: job.status,
        result: job.result,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        stats: job.stats,
        logs: job.logs,
        userId: job.userId,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        // History tracking
        version: job.version || 1,
        analysisId: job.analysisId,
        previousJobId: job.previousJobId?.toString(),
        history: (job.history || []).map((h: any) => ({
          analysisId: h.analysisId,
          result: h.result,
          stats: h.stats,
          completedAt: h.completedAt,
          userId: h.userId,
          changes: h.changes,
        })),
        historyCount: (job.history || []).length,
        changeDetection: job.changeDetection,
        // Previous job summary for quick comparison
        previousJobSummary: previousJob ? {
          id: previousJob._id.toString(),
          version: previousJob.version || 1,
          completedAt: previousJob.completedAt,
          analysisId: previousJob.analysisId,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching intelligence job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch intelligence job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/intelligence/[jobId] - Cancel a running intelligence job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    await connectDB();

    const job = await IntelligenceJob.findById(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Only cancel if job is pending or running
    if (job.status === 'pending' || job.status === 'running') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      await job.save();
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job._id.toString(),
        status: job.status,
      },
    });
  } catch (error: any) {
    console.error('Error cancelling intelligence job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel intelligence job' },
      { status: 500 }
    );
  }
}

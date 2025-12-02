#!/usr/bin/env tsx
/**
 * Emergency script to cancel all running intelligence jobs
 * Run with: npx tsx scripts/cancel-all-jobs.ts
 */

import connectDB from '../lib/mongodb';
import IntelligenceJob from '../models/IntelligenceJob';

async function cancelAllRunningJobs() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Finding all running and pending jobs...');
    const runningJobs = await IntelligenceJob.find({
      status: { $in: ['running', 'pending'] }
    });
    
    console.log(`Found ${runningJobs.length} jobs to cancel:`);
    runningJobs.forEach(job => {
      console.log(`  - ${job._id}: ${job.entityType}/${job.entityId} (${job.entityName}) - ${job.status}`);
    });
    
    if (runningJobs.length === 0) {
      console.log('No running jobs found. Exiting.');
      process.exit(0);
    }
    
    console.log('\nCancelling all jobs...');
    const result = await IntelligenceJob.updateMany(
      { status: { $in: ['running', 'pending'] } },
      { 
        $set: { 
          status: 'cancelled',
          completedAt: new Date(),
        }
      }
    );
    
    console.log(`\n✅ Successfully cancelled ${result.modifiedCount} job(s)`);
    console.log('\nJobs have been marked as cancelled. They will stop on their next progress check.');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error cancelling jobs:', error);
    process.exit(1);
  }
}

cancelAllRunningJobs();


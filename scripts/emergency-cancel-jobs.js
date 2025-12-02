#!/usr/bin/env node
/**
 * Emergency script to cancel all running jobs via MongoDB directly
 * Run with: node scripts/emergency-cancel-jobs.js
 * 
 * This bypasses the API and directly updates MongoDB
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cancelAllJobs() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const IntelligenceJob = mongoose.model('IntelligenceJob', new mongoose.Schema({}, { strict: false }));

    console.log('🔍 Finding all running and pending jobs...');
    const runningJobs = await IntelligenceJob.find({
      status: { $in: ['running', 'pending'] }
    }).lean();

    console.log(`Found ${runningJobs.length} job(s) to cancel:\n`);
    runningJobs.forEach((job, idx) => {
      const started = job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Unknown';
      const duration = job.startedAt 
        ? Math.round((Date.now() - new Date(job.startedAt).getTime()) / 1000 / 60) + ' minutes'
        : 'Unknown';
      console.log(`  ${idx + 1}. ${job._id}`);
      console.log(`     Type: ${job.entityType} | ID: ${job.entityId} | Name: ${job.entityName || 'N/A'}`);
      console.log(`     Status: ${job.status} | Started: ${started} (${duration} ago)\n`);
    });

    if (runningJobs.length === 0) {
      console.log('✅ No running jobs found. Exiting.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('🛑 Cancelling all jobs...');
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
    console.log('\n📝 Jobs have been marked as cancelled in the database.');
    console.log('   They will stop executing on their next progress check (usually within seconds).');
    console.log('   This prevents further Anthropic API token usage.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

cancelAllJobs();



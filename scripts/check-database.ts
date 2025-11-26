import mongoose from 'mongoose';
import Assessment from '../models/Assessment';

// Load environment variables - Next.js style
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appello-assessment';

async function checkDatabase() {
  console.log('🔍 Database Diagnostic Check\n');
  console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}\n`);

  try {
    // Connect to database
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('   ✅ Connected successfully\n');

    // Check total count
    console.log('2. Checking total assessments count...');
    const totalCount = await Assessment.countDocuments({});
    console.log(`   Total assessments in database: ${totalCount}\n`);

    if (totalCount === 0) {
      console.log('   ⚠️  No assessments found in database!\n');
      console.log('   Possible reasons:');
      console.log('   - No assessments have been submitted yet');
      console.log('   - Assessments are in a different database/collection');
      console.log('   - Database connection is pointing to wrong database\n');
    } else {
      // Get sample assessments
      console.log('3. Fetching sample assessments...');
      const sampleAssessments: any = await (Assessment as any).find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      
      console.log(`   Found ${sampleAssessments.length} sample assessments:\n`);
      sampleAssessments.forEach((assessment, index) => {
        console.log(`   ${index + 1}. Submission ID: ${assessment.submissionId}`);
        console.log(`      Status: ${assessment.status}`);
        console.log(`      Company: ${assessment.companyName || 'N/A'}`);
        console.log(`      Score: ${assessment.opportunityScore || 'N/A'}`);
        console.log(`      Priority: ${assessment.opportunityPriority || 'N/A'}`);
        console.log(`      Created: ${assessment.createdAt}`);
        console.log('');
      });

      // Test the exact query used by the API
      console.log('4. Testing API query (no filters)...');
      const apiQuery = {};
      const apiResults = await Assessment.find(apiQuery)
        .sort('-createdAt')
        .skip(0)
        .limit(50)
        .lean();
      console.log(`   ✅ Query returned ${apiResults.length} assessments\n`);

      // Test with status filter
      console.log('5. Testing API query with status="completed"...');
      const completedQuery = { status: 'completed' };
      const completedResults = await Assessment.find(completedQuery)
        .sort('-createdAt')
        .skip(0)
        .limit(50)
        .lean();
      console.log(`   ✅ Query returned ${completedResults.length} completed assessments\n`);

      // Check for any assessments with different statuses
      console.log('6. Checking status distribution...');
      const statusCounts = await Assessment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      console.log('   Status breakdown:');
      statusCounts.forEach(({ _id, count }) => {
        console.log(`      ${_id || '(null)'}: ${count}`);
      });
      console.log('');
    }

    // Check collection name
    console.log('7. Checking collection details...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const assessmentCollection = collections.find(c => c.name === 'assessments');
    if (assessmentCollection) {
      console.log('   ✅ Collection "assessments" exists');
      const stats = await mongoose.connection.db.collection('assessments').stats();
      console.log(`   Collection size: ${stats.size} bytes`);
      console.log(`   Document count: ${stats.count}`);
    } else {
      console.log('   ⚠️  Collection "assessments" not found!');
      console.log('   Available collections:', collections.map(c => c.name).join(', '));
    }
    console.log('');

    console.log('✅ Diagnostic complete\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkDatabase();


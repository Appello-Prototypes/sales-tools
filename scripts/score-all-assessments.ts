import mongoose from 'mongoose';
import Assessment from '../models/Assessment';
import { calculateOpportunityScore } from '../lib/scoring/opportunityScorer';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appello-assessment';

async function scoreAllAssessments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const assessments = await Assessment.find({ status: 'completed' });
    console.log(`\nFound ${assessments.length} completed assessments to score...\n`);

    for (const assessment of assessments) {
      const data = {
        section1: assessment.section1,
        section2: assessment.section2,
        section3: assessment.section3,
        section4: assessment.section4,
        section5: assessment.section5,
      };
      
      const score = calculateOpportunityScore(data);
      
      assessment.opportunityScore = score.totalScore;
      assessment.opportunityGrade = score.grade;
      assessment.opportunityPriority = score.priority;
      
      await assessment.save();
      
      console.log(`✓ Scored: ${assessment.companyName || 'Unnamed'}`);
      console.log(`  Score: ${score.totalScore}/100 (${score.grade}) - ${score.priority} Priority`);
    }

    console.log(`\n✅ Successfully scored ${assessments.length} assessments!\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error scoring assessments:', error);
    process.exit(1);
  }
}

scoreAllAssessments();


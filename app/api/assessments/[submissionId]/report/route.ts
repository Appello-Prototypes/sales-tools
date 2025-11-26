import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';
import { calculateROI } from '@/lib/roi/roiCalculator';
import { calculateOpportunityScore } from '@/lib/scoring/opportunityScorer';
import { generateCustomerReport } from '@/lib/reports/reportGenerator';
import { enhanceReportWithAI } from '@/lib/ai/reportGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    await connectDB();
    
    const { submissionId } = await params;
    
    const assessment = await Assessment.findOne({ submissionId }).lean();
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    if (assessment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Assessment not completed' },
        { status: 400 }
      );
    }
    
    // If customer report already exists, return it immediately
    if ((assessment as any).customerReport && (assessment as any).customerReportGeneratedAt) {
      // Calculate ROI and score for the response (needed for display)
      const data = {
        submissionId: assessment.submissionId,
        companyName: assessment.companyName,
        section1: assessment.section1,
        section2: assessment.section2,
        section3: assessment.section3,
        section4: assessment.section4,
        section5: assessment.section5,
      };
      const roi = calculateROI(data);
      const score = await calculateOpportunityScore(data);
      
      return NextResponse.json({
        report: (assessment as any).customerReport,
        roi,
        score,
        auditTrail: assessment.auditTrail || undefined,
      });
    }
    
    // Convert to AssessmentData format
    const data = {
      submissionId: assessment.submissionId,
      companyName: assessment.companyName,
      section1: assessment.section1,
      section2: assessment.section2,
      section3: assessment.section3,
      section4: assessment.section4,
      section5: assessment.section5,
    };
    
    // Calculate ROI
    const roi = calculateROI(data);
    
    // Calculate Opportunity Score
    const score = await calculateOpportunityScore(data);
    
    // Generate Customer Report
    const baseReport = generateCustomerReport(data, roi, score);
    
    // Enhance with AI (async, non-blocking)
    let enhancedReport = baseReport;
    let auditTrail = null;
    try {
      const result = await enhanceReportWithAI(baseReport, data);
      enhancedReport = result.report;
      auditTrail = result.auditTrail;
      
      // Save report and audit trail to database
      await Assessment.updateOne(
        { submissionId },
        { 
          $set: { 
            customerReport: enhancedReport,
            customerReportGeneratedAt: new Date(),
            auditTrail: auditTrail || assessment.auditTrail
          } 
        }
      );
    } catch (error) {
      console.error('AI enhancement failed, using base report:', error);
      // Continue with base report if AI fails
      // Still save it
      await Assessment.updateOne(
        { submissionId },
        { 
          $set: { 
            customerReport: baseReport,
            customerReportGeneratedAt: new Date()
          } 
        }
      );
    }
    
    return NextResponse.json({
      report: enhancedReport,
      roi,
      score,
      auditTrail: auditTrail || assessment.auditTrail || undefined,
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    );
  }
}


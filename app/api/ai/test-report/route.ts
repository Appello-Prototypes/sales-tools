/**
 * Test AI Report Generation
 * 
 * Tests the AI-enhanced report generation with sample data
 * GET /api/ai/test-report
 */

import { NextResponse } from 'next/server';
import { generateCustomerReport } from '@/lib/reports/reportGenerator';
import { enhanceReportWithAI } from '@/lib/ai/reportGenerator';
import { calculateROI } from '@/lib/roi/roiCalculator';
import { calculateOpportunityScore } from '@/lib/scoring/opportunityScorer';

// Sample assessment data for testing
const sampleAssessmentData = {
  submissionId: 'test-123',
  companyName: 'Test HVAC Contractor',
  section1: {
    trade: 'HVAC',
    fieldWorkers: '20-49',
    role: 'Owner',
  },
  section2: {
    painPoints: [
      'Time tracking and payroll processing',
      'Job profitability tracking',
      'Material ordering and inventory',
      'Change order documentation',
      'Scheduling conflicts',
    ],
    magicWand: 'Automate all administrative tasks',
    urgency: 8,
  },
  section3: {
    currentSoftware: ['QuickBooks', 'Excel'],
    timesheetMethod: 'Paper forms',
  },
  section4: {
    demoFocus: ['Time tracking', 'Job costing', 'Material management'],
  },
  section5: {
    timeline: 'Within 3 months',
    evaluatingAlternatives: true,
  },
};

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Calculate base report
    const roi = calculateROI(sampleAssessmentData);
    const score = calculateOpportunityScore(sampleAssessmentData);
    const baseReport = generateCustomerReport(sampleAssessmentData, roi, score);
    
    // Enhance with AI
    const enhancedReport = await enhanceReportWithAI(baseReport, sampleAssessmentData);
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      baseReport: {
        trade: baseReport.trade,
        fieldWorkers: baseReport.fieldWorkers,
        topPainPoints: baseReport.topPainPoints,
        annualSavings: baseReport.annualSavings,
        roiPercentage: baseReport.roiPercentage,
      },
      aiEnhanced: {
        industryBenchmarks: enhancedReport.industryBenchmarks,
        peerComparison: enhancedReport.peerComparison,
        successStories: enhancedReport.successStories,
        personalizedInsights: enhancedReport.personalizedInsights,
        nextSteps: enhancedReport.nextSteps,
      },
      hasAIEnhancements: !!(
        enhancedReport.industryBenchmarks ||
        enhancedReport.peerComparison ||
        enhancedReport.successStories ||
        enhancedReport.personalizedInsights
      ),
    }, { status: 200 });
  } catch (error: any) {
    console.error('AI Report Test Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


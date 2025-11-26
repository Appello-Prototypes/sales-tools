import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';
import { verifyAuth } from '@/lib/auth';
import { calculateROI } from '@/lib/roi/roiCalculator';
import { calculateOpportunityScore } from '@/lib/scoring/opportunityScorer';
import { generateCustomerReport } from '@/lib/reports/reportGenerator';
import { analyzeAppelloFeatures } from '@/lib/analysis/featureAnalysis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { submissionId } = await params;
    
    const assessment: any = await (Assessment as any).findOne({ submissionId }).lean();
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    // Use saved reports if available, otherwise calculate
    let roi, score, report, featureAnalysis;
    
    if ((assessment as any).customerReport && (assessment as any).adminReport) {
      // Use saved reports
      report = (assessment as any).customerReport;
      // Calculate ROI and score for display (they're in the reports)
      const data = {
        section1: (assessment as any).section1,
        section2: (assessment as any).section2,
        section3: (assessment as any).section3,
        section4: (assessment as any).section4,
        section5: (assessment as any).section5,
      };
      roi = calculateROI(data);
      score = await calculateOpportunityScore(data);
      featureAnalysis = analyzeAppelloFeatures(data);
    } else {
      // Fallback: calculate if reports not saved yet
      const data = {
        section1: (assessment as any).section1,
        section2: (assessment as any).section2,
        section3: (assessment as any).section3,
        section4: (assessment as any).section4,
        section5: (assessment as any).section5,
      };
      
      roi = calculateROI(data);
      score = await calculateOpportunityScore(data);
      report = generateCustomerReport(data, roi, score);
      featureAnalysis = analyzeAppelloFeatures(data);
    }
    
    return NextResponse.json({
      assessment: {
        ...assessment,
        // Ensure debugLog and auditTrail are included
        debugLog: (assessment as any).debugLog || null,
        auditTrail: (assessment as any).auditTrail || null,
        adminReport: (assessment as any).adminReport || null,
        customerReport: (assessment as any).customerReport || null,
        customerReportGeneratedAt: (assessment as any).customerReportGeneratedAt || null,
      },
      roi,
      score,
      report,
      featureAnalysis,
    });
  } catch (error: any) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { submissionId } = await params;
    const body = await request.json();
    
    const assessment: any = await (Assessment as any).findOne({ submissionId });
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    // Update allowed fields
    if (body.assignedTo !== undefined) {
      assessment.assignedTo = body.assignedTo;
    }
    if (body.notes !== undefined) {
      assessment.notes = body.notes;
    }
    if (body.flagged !== undefined) {
      assessment.flagged = body.flagged;
    }
    
    await assessment.save();
    
    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error: any) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment', details: error.message },
      { status: 500 }
    );
  }
}


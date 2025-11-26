import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';
import { calculateROI } from '@/lib/roi/roiCalculator';
import { generateCustomerReport } from '@/lib/reports/reportGenerator';
import { enhanceReportWithAI } from '@/lib/ai/reportGenerator';
import { researchCompany } from '@/lib/ai/researchService';
import { generateAdminReport } from '@/lib/reports/adminReportGenerator';
import { deriveCustomerReport, deriveAdminReport } from '@/lib/reports/reportDerivation';
import { createDebugLog, logSubmission, logScoring, logROI, logReport, logAI, finalizeDebugLog, logError } from '@/lib/debug/assessmentLogger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    await connectDB();
    
    const { submissionId } = await params;
    const body = await request.json();
    
    // Create debug log
    const debugLog = createDebugLog(submissionId);
    logSubmission(submissionId, 'Assessment submission started', { submissionId });
    
    const assessment: any = await (Assessment as any).findOne({ submissionId });
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    // Update contact information
    if (body.name) {
      assessment.name = body.name;
    }
    if (body.email) {
      assessment.email = body.email;
    }
    
    // Update all sections
    if (body.section1) {
      assessment.section1 = { ...assessment.section1, ...body.section1 };
    }
    if (body.section2) {
      assessment.section2 = { ...assessment.section2, ...body.section2 };
    }
    if (body.section3) {
      assessment.section3 = { ...assessment.section3, ...body.section3 };
    }
    if (body.section4) {
      assessment.section4 = { ...assessment.section4, ...body.section4 };
    }
    if (body.section5) {
      assessment.section5 = { ...assessment.section5, ...body.section5 };
    }
    
    // Calculate time to complete
    const completedAt = new Date();
    const timeToComplete = Math.floor(
      (completedAt.getTime() - assessment.startedAt.getTime()) / 1000
    );
    
    assessment.completedAt = completedAt;
    assessment.timeToComplete = timeToComplete;
    assessment.status = 'completed';
    assessment.currentStep = 5;
    
    await assessment.save();
    
    // Calculate and store opportunity score
    const { calculateOpportunityScore } = await import('@/lib/scoring/opportunityScorer');
    const data = {
      section1: assessment.section1,
      section2: assessment.section2,
      section3: assessment.section3,
      section4: assessment.section4,
      section5: assessment.section5,
    };
    
    logScoring(submissionId, 'Calculating opportunity score', data);
    const score = await calculateOpportunityScore(data);
    logScoring(submissionId, 'Opportunity score calculated', {
      total: score.totalScore,
      grade: score.grade,
      priority: score.priority,
      breakdown: score.breakdown,
    });
    
    // Store score in assessment
    assessment.opportunityScore = score.totalScore;
    assessment.opportunityGrade = score.grade;
    assessment.opportunityPriority = score.priority;
    await assessment.save();
    logSubmission(submissionId, 'Opportunity score saved to database');
    
    // Generate reports immediately (customer + admin)
    let auditTrail = null;
    let reportGenerated = false;
    let adminReport = null;
    
    try {
      logReport(submissionId, 'Starting comprehensive report generation');
      
      // Calculate ROI
      logROI(submissionId, 'Calculating ROI', { fieldWorkers: data.section1?.fieldWorkers, painPoints: data.section2?.painPoints?.length });
      const roi = calculateROI(data);
      logROI(submissionId, 'ROI calculated', {
        totalAnnualCost: roi.totalAnnualCost,
        totalAnnualSavings: roi.totalAnnualSavings,
        roiPercentage: roi.roiPercentage,
        paybackMonths: roi.paybackMonths,
      });
      
      // Step 1: Conduct comprehensive company research
      logAI(submissionId, 'Starting comprehensive company research', {
        companyName: assessment.companyName || assessment.name,
        email: assessment.email,
        website: assessment.website,
        trade: data.section1?.trade,
      });
      
      // Create audit trail for research (will be merged with customer report audit trail)
      const { createAuditTrail } = await import('@/lib/ai/auditTrail');
      const researchAuditTrail = createAuditTrail();
      
      const companyResearch = await researchCompany(
        {
          companyName: (assessment as any).companyName || (assessment as any).name,
          website: (assessment as any).website,
          email: (assessment as any).email,
          submissionId: (assessment as any).submissionId,
          ...data,
        } as any,
        researchAuditTrail
      );
      
      // Merge research audit trail into main audit trail
      if (auditTrail && researchAuditTrail) {
        (auditTrail as any).actions.push(...(researchAuditTrail as any).actions);
        (auditTrail as any).totalActions += (researchAuditTrail as any).totalActions;
        (auditTrail as any).totalClaudeQueries += (researchAuditTrail as any).totalClaudeQueries;
        (auditTrail as any).totalAtlasQueries += (researchAuditTrail as any).totalAtlasQueries;
        (auditTrail as any).totalFirecrawlActions += (researchAuditTrail as any).totalFirecrawlActions;
        (auditTrail as any).totalErrors += (researchAuditTrail as any).totalErrors;
      }
      
      logAI(submissionId, 'Company research completed', {
        websiteFound: !!companyResearch.website,
        competitorsFound: companyResearch.competitors?.length || 0,
        atlasResults: companyResearch.atlasIntelligence?.similarCustomers?.length || 0,
      });
      
      // Step 2: Generate Customer Report (optimized for customer)
      logReport(submissionId, 'Generating customer-facing report');
      const baseReport = generateCustomerReport(data, roi, score);
      logReport(submissionId, 'Base customer report generated', { trade: baseReport.trade, topPainPoints: baseReport.topPainPoints.length });
      
      // Enhance customer report with AI
      logAI(submissionId, 'Enhancing customer report with AI', { similarCustomersQuery: `${baseReport.trade}, ${baseReport.fieldWorkers}` });
      const customerReportResult = await enhanceReportWithAI(baseReport, data, auditTrail || researchAuditTrail, companyResearch);
      const enhancedCustomerReport = customerReportResult.report;
      auditTrail = customerReportResult.auditTrail;
      logAI(submissionId, 'Customer report AI enhancement completed', {
        auditTrailEntries: auditTrail?.reportGeneration?.entries?.length || 0,
        claudeQueries: auditTrail?.summary?.totalClaudeQueries || 0,
        atlasQueries: auditTrail?.summary?.totalAtlasQueries || 0,
      });
      
      // Step 3: Generate Admin/Sales Intelligence Report
      logReport(submissionId, 'Generating admin/sales intelligence report');
      adminReport = generateAdminReport(data, score, roi, companyResearch);
      logReport(submissionId, 'Admin report generated', {
        competitors: adminReport.competitiveIntelligence.competitors.length,
        nextSteps: adminReport.salesIntelligence.nextSteps.length,
      });
      
      // Generate derivation transparency
      const customerDerivation = deriveCustomerReport(enhancedCustomerReport, roi, score, auditTrail);
      const adminDerivation = deriveAdminReport(adminReport, companyResearch, auditTrail);
      
      // Attach derivations to reports
      (enhancedCustomerReport as any)._derivation = customerDerivation;
      (adminReport as any)._derivation = adminDerivation;
      
      // Finalize debug log before saving
      finalizeDebugLog(submissionId);
      
      // Save everything to database
      assessment.auditTrail = auditTrail;
      assessment.debugLog = debugLog; // Save finalized debug log
      assessment.adminReport = adminReport;
      assessment.customerReport = enhancedCustomerReport; // Save customer report
      assessment.customerReportGeneratedAt = new Date();
      await assessment.save();
      logReport(submissionId, 'All reports, audit trail, debug logs, and derivations saved to database');
      
      reportGenerated = true;
      logSubmission(submissionId, 'Comprehensive reports generated successfully');
    } catch (error: any) {
      logError(submissionId, 'report', 'Error generating reports', error);
      // Finalize debug log even on error
      finalizeDebugLog(submissionId);
      // Save debug log even if reports failed
      assessment.debugLog = debugLog;
      await assessment.save();
      // Continue even if report generation fails - assessment is still saved
    }
    
    return NextResponse.json({
      success: true,
      assessmentId: assessment._id.toString(),
      submittedAt: completedAt.toISOString(),
      reportUrl: `/assessment/report/${submissionId}`,
      score: {
        total: score.totalScore,
        grade: score.grade,
        priority: score.priority,
      },
      reportGenerated,
      auditTrailGenerated: !!auditTrail,
    });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assessment', details: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';
import { verifyAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { calculateOpportunityScore } from '@/lib/scoring/opportunityScorer';
import { calculateROI } from '@/lib/roi/roiCalculator';
import { generateCustomerReport } from '@/lib/reports/reportGenerator';
import { enhanceReportWithAI } from '@/lib/ai/reportGenerator';
import { researchCompany } from '@/lib/ai/researchService';
import { generateAdminReport } from '@/lib/reports/adminReportGenerator';
import { createDebugLog, logSubmission, logScoring, logROI, logReport, logAI, finalizeDebugLog, logError } from '@/lib/debug/assessmentLogger';
import { generateFakeAssessment } from '../fakeData';

/**
 * Stream logs for test assessment creation
 * Uses Server-Sent Events (SSE) for real-time log streaming
 */
export async function POST(request: NextRequest) {
  const user = verifyAuth(request);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendLog = (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => {
        const logEntry = {
          type,
          message,
          timestamp: new Date().toISOString(),
          data,
        };
        const chunk = `data: ${JSON.stringify(logEntry)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      try {
        sendLog('step', '🚀 Starting test assessment creation...');
        
        await connectDB();
        sendLog('success', '✅ Connected to database');

        // Generate fake assessment data
        sendLog('step', '📝 Generating fake assessment data...');
        const fakeData = generateFakeAssessment();
        sendLog('success', '✅ Assessment data generated', {
          name: fakeData.name,
          email: fakeData.email,
          trade: fakeData.section1.trade,
          fieldWorkers: fakeData.section1.fieldWorkers,
        });

        // Create new assessment
        sendLog('step', '💾 Creating assessment record...');
        const submissionId = uuidv4();
        const startedAt = new Date();
        
        const assessment = new Assessment({
          submissionId,
          name: fakeData.name,
          email: fakeData.email,
          startedAt,
          status: 'in_progress',
          currentStep: 1,
          section1: {},
          section2: {},
          section3: {},
          section4: {},
          section5: {},
        });
        
        await assessment.save();
        sendLog('success', '✅ Assessment record created', { submissionId });

        // Update all sections
        sendLog('step', '📋 Populating assessment sections...');
        assessment.companyName = fakeData.companyName;
        assessment.website = fakeData.website;
        assessment.section1 = fakeData.section1;
        assessment.section2 = fakeData.section2;
        assessment.section3 = fakeData.section3;
        assessment.section4 = fakeData.section4;
        assessment.section5 = fakeData.section5;
        
        const completedAt = new Date();
        const timeToComplete = Math.floor(Math.random() * 180) + 120;
        
        assessment.completedAt = completedAt;
        assessment.timeToComplete = timeToComplete;
        assessment.status = 'completed';
        assessment.currentStep = 5;
        
        await assessment.save();
        sendLog('success', '✅ Assessment sections populated and marked as completed');

        // Calculate opportunity score
        sendLog('step', '📊 Calculating opportunity score...');
        const data = {
          companyName: assessment.companyName,
          website: assessment.website,
          section1: assessment.section1,
          section2: assessment.section2,
          section3: assessment.section3,
          section4: assessment.section4,
          section5: assessment.section5,
        };
        const score = await calculateOpportunityScore(data);
        
        assessment.opportunityScore = score.totalScore;
        assessment.opportunityGrade = score.grade;
        assessment.opportunityPriority = score.priority;
        await assessment.save();
        sendLog('success', '✅ Opportunity score calculated', {
          score: score.totalScore,
          grade: score.grade,
          priority: score.priority,
        });

        // Generate comprehensive reports
        sendLog('step', '📄 Starting comprehensive report generation...');
        const debugLog = createDebugLog(submissionId);
        let auditTrail = null;
        let adminReport = null;
        let reportGenerated = false;
        
        try {
          logReport(submissionId, 'Starting comprehensive report generation');
          
          // Calculate ROI
          sendLog('step', '💰 Calculating ROI...');
          logROI(submissionId, 'Calculating ROI', { 
            fieldWorkers: data.section1?.fieldWorkers, 
            painPoints: data.section2?.painPoints?.length 
          });
          const roi = calculateROI(data);
          sendLog('success', '✅ ROI calculated', {
            annualSavings: roi.annualSavings,
            paybackPeriod: roi.paybackPeriod,
            fiveYearROI: roi.fiveYearROI,
          });
          
          // Step 1: Conduct comprehensive company research
          sendLog('step', '🔍 Starting comprehensive company research...');
          logAI(submissionId, 'Starting comprehensive company research', {
            companyName: assessment.companyName || assessment.name,
            email: assessment.email,
            trade: data.section1?.trade,
          });
          
          const { createAuditTrail } = await import('@/lib/ai/auditTrail');
          const researchAuditTrail = createAuditTrail();
          
          sendLog('info', '🌐 Researching company website...');
          const companyResearch = await researchCompany({
            ...data,
            companyName: assessment.companyName || data.companyName,
            website: assessment.website || data.website,
          }, researchAuditTrail, sendLog);
          
          sendLog('success', '✅ Company research completed', {
            websiteFound: !!companyResearch.website,
            competitorsFound: companyResearch.competitors?.length || 0,
            atlasResults: companyResearch.atlasIntelligence?.similarCustomers?.length || 0,
          });
          
          logAI(submissionId, 'Company research completed', {
            websiteFound: !!companyResearch.website,
            competitorsFound: companyResearch.competitors?.length || 0,
            atlasResults: companyResearch.atlasIntelligence?.similarCustomers?.length || 0,
          });
          
          // Step 2: Generate Customer Report
          sendLog('step', '📝 Generating customer-facing report...');
          logReport(submissionId, 'Generating customer-facing report');
          const baseReport = generateCustomerReport(data, roi, score);
          sendLog('success', '✅ Base customer report generated');
          
          // Enhance customer report with AI
          sendLog('step', '🤖 Enhancing customer report with AI...');
          logAI(submissionId, 'Enhancing customer report with AI');
          sendLog('info', '   → Step 1/5: Querying Claude API for industry benchmarks...');
          sendLog('info', '   → Step 2/5: Generating peer comparisons...');
          sendLog('info', '   → Step 3/5: Creating success stories...');
          sendLog('info', '   → Step 4/5: Generating personalized insights...');
          sendLog('info', '   → Step 5/5: Creating next steps recommendations...');
          sendLog('info', '   → This may take 30-60 seconds as we query multiple AI endpoints...');
          const customerReportResult = await enhanceReportWithAI(baseReport, data);
          auditTrail = customerReportResult.auditTrail;
          sendLog('success', '✅ Customer report enhanced with AI insights');
          
          // Merge research audit trail
          if (auditTrail && researchAuditTrail) {
            // Merge entries from research audit trail
            if (researchAuditTrail.reportGeneration?.entries) {
              auditTrail.reportGeneration.entries.push(...researchAuditTrail.reportGeneration.entries);
            }
            // Merge summary counts
            if (researchAuditTrail.summary) {
              auditTrail.summary.totalClaudeQueries += researchAuditTrail.summary.totalClaudeQueries || 0;
              auditTrail.summary.totalAtlasQueries += researchAuditTrail.summary.totalAtlasQueries || 0;
              auditTrail.summary.totalFirecrawlActions += researchAuditTrail.summary.totalFirecrawlActions || 0;
              auditTrail.summary.errors += researchAuditTrail.summary.errors || 0;
              // Merge token usage
              if (researchAuditTrail.summary.totalTokensUsed && auditTrail.summary.totalTokensUsed) {
                auditTrail.summary.totalTokensUsed.input += researchAuditTrail.summary.totalTokensUsed.input || 0;
                auditTrail.summary.totalTokensUsed.output += researchAuditTrail.summary.totalTokensUsed.output || 0;
                auditTrail.summary.totalTokensUsed.thinking += researchAuditTrail.summary.totalTokensUsed.thinking || 0;
              }
            }
          }
          
          // Step 3: Generate Admin/Sales Intelligence Report
          sendLog('step', '📊 Generating admin/sales intelligence report...');
          logReport(submissionId, 'Generating admin/sales intelligence report');
          adminReport = generateAdminReport(data, score, roi, companyResearch);
          
          sendLog('success', '✅ Admin report generated', {
            competitors: adminReport.competitiveIntelligence.competitors.length,
            nextSteps: adminReport.salesIntelligence.nextSteps.length,
          });
          
          logReport(submissionId, 'Admin report generated', {
            competitors: adminReport.competitiveIntelligence.competitors.length,
            nextSteps: adminReport.salesIntelligence.nextSteps.length,
          });
          
          // Finalize audit trail
          const { finalizeAuditTrail } = await import('@/lib/ai/auditTrail');
          if (auditTrail) {
            finalizeAuditTrail(auditTrail);
          }
          
          // Save everything to database
          sendLog('step', '💾 Saving reports to database...');
          assessment.auditTrail = auditTrail;
          assessment.debugLog = debugLog;
          assessment.adminReport = adminReport;
          assessment.customerReport = customerReportResult.report;
          assessment.customerReportGeneratedAt = new Date();
          await assessment.save();
          
          finalizeDebugLog(submissionId);
          reportGenerated = true;
          
          sendLog('success', '✅ All reports saved successfully');
          
        } catch (error: any) {
          logError(submissionId, 'report', 'Error generating reports', error);
          sendLog('error', '❌ Error generating reports', { error: error.message });
        }
        
        // Send final result
        sendLog('step', '🎉 Test assessment creation complete!');
        const finalResult = {
          success: true,
          submissionId,
          assessmentId: assessment._id.toString(),
          submittedAt: completedAt.toISOString(),
          reportUrl: `/assessment/report/${submissionId}`,
          adminUrl: `/admin/assessments/${submissionId}`,
          score: {
            total: score.totalScore,
            grade: score.grade,
            priority: score.priority,
          },
          data: {
            name: fakeData.name,
            email: fakeData.email,
            trade: fakeData.section1.trade,
            fieldWorkers: fakeData.section1.fieldWorkers,
            role: fakeData.section1.role,
          },
          reportGenerated,
          auditTrailGenerated: !!auditTrail,
          adminReportGenerated: !!adminReport,
          adminReportUrl: adminReport ? `/admin/reports/${submissionId}` : undefined,
        };
        
        sendLog('success', '✅ COMPLETE', finalResult);
        
      } catch (error: any) {
        sendLog('error', '❌ Fatal error', { error: error.message, stack: error.stack });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


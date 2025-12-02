/**
 * Intelligence Runner - Background execution of intelligence jobs
 * 
 * Runs intelligence agents in the background, updating MongoDB job records
 * as progress is made. Designed to be called from API routes that return
 * immediately after creating the job.
 */

import connectDB from '@/lib/mongodb';
import IntelligenceJob from '@/models/IntelligenceJob';
import Deal from '@/models/Deal';
import { runContactIntelligenceAgent, AgentProgress, ContactContext } from '@/lib/ai/contactIntelligenceAgent';
import { runCompanyIntelligenceAgent, CompanyContext } from '@/lib/ai/companyIntelligenceAgent';
import { calculateDealScore, DealScore, DealData } from '@/lib/scoring/dealScorer';
import { detectChanges } from '@/lib/ai/changeDetection';

export interface RunIntelligenceJobParams {
  jobId: string;
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  entityName: string;
  hubspotApiKey: string;
  userId?: string;
}

export interface RunIntelligenceJobWithRetryParams extends RunIntelligenceJobParams {
  maxRetries?: number;
  initialDelayMs?: number;
}

/**
 * Check if an error is a rate limit error (Anthropic API overload)
 */
function isRateLimitError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorString = String(error).toLowerCase();
  
  return (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('rate_limit') ||
    errorMessage.includes('overloaded') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('429') ||
    errorMessage.includes('capacity') ||
    errorString.includes('rate limit') ||
    errorString.includes('overloaded') ||
    error?.status === 429 ||
    error?.statusCode === 429
  );
}

/**
 * Wait for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to detect and save changes after job completion
 */
async function detectAndSaveChanges(jobId: string): Promise<void> {
  await connectDB();
  
  const job = await IntelligenceJob.findById(jobId);
  if (!job || job.status !== 'complete') return;
  
  // If there's a previous job, detect changes
  if (job.previousJobId) {
    const previousJob = await IntelligenceJob.findById(job.previousJobId).lean();
    if (previousJob?.result) {
      const changes = detectChanges(job.result, previousJob.result);
      job.changeDetection = changes;
      await job.save();
    }
  }
}

/**
 * Run a contact intelligence job in the background
 */
async function runContactJob(
  jobId: string,
  contactId: string,
  entityName: string,
  hubspotApiKey: string,
  userId?: string
) {
  await connectDB();
  
  const job = await IntelligenceJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  // Check if already cancelled
  if (job.status === 'cancelled') {
    return; // Job was cancelled, don't proceed
  }
  
  // Update status to running
  job.status = 'running';
  job.startedAt = new Date();
  await job.save();
  
  try {
    // Fetch contact from HubSpot
    const contactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=companies`;
    const contactResponse = await fetch(contactUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!contactResponse.ok) {
      throw new Error(`Failed to fetch contact: ${contactResponse.status}`);
    }

    const contactData = await contactResponse.json();
    const contact = contactData.properties || {};
    const firstName = contact.firstname || '';
    const lastName = contact.lastname || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Contact';
    const companyId = contactData.associations?.companies?.results?.[0]?.id;
    let companyName = '';
    
    if (companyId) {
      try {
        const companyResponse = await fetch(
          `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`,
          {
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          companyName = companyData.properties?.name || '';
        }
      } catch (e) {
        // Keep empty company name
      }
    }

    const contactContext: ContactContext = {
      contactId,
      firstName,
      lastName,
      fullName,
      email: contact.email,
      jobTitle: contact.jobtitle,
      phone: contact.phone,
      companyId,
      companyName,
      ownerId: contact.hubspot_owner_id,
      properties: contact
    };

    // Progress callback that updates MongoDB
    const sendProgress = async (progress: AgentProgress) => {
      await connectDB();
      const updatedJob = await IntelligenceJob.findById(jobId);
      if (!updatedJob) return;
      
      // Check if job was cancelled
      if (updatedJob.status === 'cancelled') {
        throw new Error('Job was cancelled');
      }
      
      // Convert progress to log entry
      const logEntry = {
        step: progress.type === 'thinking' ? 'agent-thinking' :
              progress.type === 'tool_call' ? `tool-call-${progress.data.tool}` :
              progress.type === 'tool_result' ? `tool-result-${progress.data.tool}` :
              progress.type === 'response' ? 'agent-response' :
              progress.type === 'error' ? 'agent-error' :
              progress.type === 'complete' ? 'agent-complete' : 'progress',
        message: progress.data.message || `${progress.type}: ${progress.data.tool || ''}`,
        status: progress.type === 'error' ? 'error' :
                progress.type === 'complete' ? 'complete' :
                progress.type === 'tool_result' ? 'complete' :
                progress.type === 'thinking' ? 'info' : 'loading',
        data: progress.data,
        timestamp: progress.timestamp,
      };
      
      updatedJob.logs.push(logEntry);
      await updatedJob.save();
    };

    const result = await runContactIntelligenceAgent(
      contactContext,
      hubspotApiKey,
      sendProgress,
      Infinity
    );

    // Update job with result
    await connectDB();
    const completedJob = await IntelligenceJob.findById(jobId);
    if (!completedJob) return;

    if (result.success && result.intelligence) {
      completedJob.status = 'complete';
      completedJob.result = {
        intelligence: result.intelligence,
        engagementScore: result.intelligence.engagementScore,
        insights: result.intelligence.insights,
        recommendedActions: result.intelligence.recommendedActions,
        riskFactors: result.intelligence.riskFactors,
        opportunitySignals: result.intelligence.opportunitySignals,
      };
      completedJob.stats = {
        iterations: result.iterations,
        toolCalls: result.toolCalls,
        duration: completedJob.startedAt ? Date.now() - completedJob.startedAt.getTime() : undefined,
      };
    } else {
      completedJob.status = 'error';
      completedJob.error = result.error || 'Agent failed to complete analysis';
      completedJob.stats = {
        iterations: result.iterations,
        toolCalls: result.toolCalls,
      };
    }
    
    completedJob.completedAt = new Date();
    await completedJob.save();
    
    // Detect changes from previous analysis
    await detectAndSaveChanges(jobId);
    
  } catch (error: any) {
    await connectDB();
    const errorJob = await IntelligenceJob.findById(jobId);
    if (errorJob) {
      errorJob.status = 'error';
      errorJob.error = error.message || 'Failed to run intelligence job';
      errorJob.completedAt = new Date();
      await errorJob.save();
    }
    throw error;
  }
}

/**
 * Run a company intelligence job in the background
 */
async function runCompanyJob(
  jobId: string,
  companyId: string,
  entityName: string,
  hubspotApiKey: string,
  userId?: string
) {
  await connectDB();
  
  const job = await IntelligenceJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  // Check if already cancelled
  if (job.status === 'cancelled') {
    return; // Job was cancelled, don't proceed
  }
  
  job.status = 'running';
  job.startedAt = new Date();
  await job.save();
  
  try {
    // Fetch company from HubSpot
    const companyUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`;
    const companyResponse = await fetch(companyUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!companyResponse.ok) {
      throw new Error(`Failed to fetch company: ${companyResponse.status}`);
    }

    const companyData = await companyResponse.json();
    const company = companyData.properties || {};

    const companyContext: CompanyContext = {
      companyId,
      name: company.name || entityName,
      domain: company.domain,
      website: company.website || company.domain,
      phone: company.phone,
      industry: company.industry,
      employees: company.numberofemployees?.toString(),
      address: company.address,
      city: company.city,
      state: company.state,
      zip: company.zip,
      ownerId: company.hubspot_owner_id,
      properties: company
    };

    // Progress callback with cancellation check
    const sendProgress = async (progress: AgentProgress) => {
      await connectDB();
      const updatedJob = await IntelligenceJob.findById(jobId);
      if (!updatedJob) return;
      
      // Check if job was cancelled
      if (updatedJob.status === 'cancelled') {
        throw new Error('Job was cancelled');
      }
      
      const logEntry = {
        step: progress.type === 'thinking' ? 'agent-thinking' :
              progress.type === 'tool_call' ? `tool-call-${progress.data.tool}` :
              progress.type === 'tool_result' ? `tool-result-${progress.data.tool}` :
              progress.type === 'response' ? 'agent-response' :
              progress.type === 'error' ? 'agent-error' :
              progress.type === 'complete' ? 'agent-complete' : 'progress',
        message: progress.data.message || `${progress.type}: ${progress.data.tool || ''}`,
        status: progress.type === 'error' ? 'error' :
                progress.type === 'complete' ? 'complete' :
                progress.type === 'tool_result' ? 'complete' :
                progress.type === 'thinking' ? 'info' : 'loading',
        data: progress.data,
        timestamp: progress.timestamp,
      };
      
      updatedJob.logs.push(logEntry);
      await updatedJob.save();
    };

    const result = await runCompanyIntelligenceAgent(
      companyContext,
      hubspotApiKey,
      sendProgress,
      Infinity
    );

    await connectDB();
    const completedJob = await IntelligenceJob.findById(jobId);
    if (!completedJob) return;

    if (result.success && result.intelligence) {
      completedJob.status = 'complete';
      completedJob.result = {
        intelligence: result.intelligence,
        healthScore: result.intelligence.healthScore,
        insights: result.intelligence.insights,
        recommendedActions: result.intelligence.recommendedActions,
        riskFactors: result.intelligence.riskFactors,
        opportunitySignals: result.intelligence.opportunitySignals,
      };
      completedJob.stats = {
        iterations: result.iterations,
        toolCalls: result.toolCalls,
        duration: completedJob.startedAt ? Date.now() - completedJob.startedAt.getTime() : undefined,
      };
    } else {
      completedJob.status = 'error';
      completedJob.error = result.error || 'Agent failed to complete analysis';
      completedJob.stats = {
        iterations: result.iterations,
        toolCalls: result.toolCalls,
      };
    }
    
    completedJob.completedAt = new Date();
    await completedJob.save();
    
    // Detect changes from previous analysis
    await detectAndSaveChanges(jobId);
    
  } catch (error: any) {
    await connectDB();
    const errorJob = await IntelligenceJob.findById(jobId);
    if (errorJob) {
      errorJob.status = 'error';
      errorJob.error = error.message || 'Failed to run intelligence job';
      errorJob.completedAt = new Date();
      await errorJob.save();
    }
    throw error;
  }
}

/**
 * Run a deal intelligence job in the background
 */
async function runDealJob(
  jobId: string,
  dealId: string,
  entityName: string,
  hubspotApiKey: string,
  userId?: string
) {
  await connectDB();
  
  const job = await IntelligenceJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  // Check if already cancelled
  if (job.status === 'cancelled') {
    return; // Job was cancelled, don't proceed
  }
  
  job.status = 'running';
  job.startedAt = new Date();
  await job.save();
  
  try {
    // Fetch deal from HubSpot
    const dealUrl = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`;
    const dealResponse = await fetch(dealUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!dealResponse.ok) {
      throw new Error(`Failed to fetch deal: ${dealResponse.status}`);
    }

    const dealData = await dealResponse.json();
    const deal = dealData.properties || {};

    // Progress callback with cancellation check
    const sendProgress = async (progress: AgentProgress) => {
      await connectDB();
      const updatedJob = await IntelligenceJob.findById(jobId);
      if (!updatedJob) return;
      
      // Check if job was cancelled
      if (updatedJob.status === 'cancelled') {
        throw new Error('Job was cancelled');
      }
      
      const logEntry = {
        step: progress.type === 'thinking' ? 'agent-thinking' :
              progress.type === 'tool_call' ? `tool-call-${progress.data.tool}` :
              progress.type === 'tool_result' ? `tool-result-${progress.data.tool}` :
              progress.type === 'response' ? 'agent-response' :
              progress.type === 'error' ? 'agent-error' :
              progress.type === 'complete' ? 'agent-complete' : 'progress',
        message: progress.data.message || `${progress.type}: ${progress.data.tool || ''}`,
        status: progress.type === 'error' ? 'error' :
                progress.type === 'complete' ? 'complete' :
                progress.type === 'tool_result' ? 'complete' :
                progress.type === 'thinking' ? 'info' : 'loading',
        data: progress.data,
        timestamp: progress.timestamp,
      };
      
      updatedJob.logs.push(logEntry);
      await updatedJob.save();
    };

    // Import and use deal intelligence agent
    const { runDealIntelligenceAgent, DealContext } = await import('@/lib/ai/dealIntelligenceAgent');
    
    const dealContext: DealContext = {
      dealId,
      dealName: deal.dealname || entityName,
      amount: parseFloat(deal.amount) || 0,
      stage: deal.dealstage || '',
      stageLabel: deal.dealstage,
      pipeline: deal.pipeline || '',
      pipelineLabel: deal.pipeline,
      closeDate: deal.closedate,
      dealType: deal.dealtype,
      companyId: deal.associatedcompanyid,
      ownerId: deal.hubspot_owner_id,
      properties: deal
    };
    
    const result = await runDealIntelligenceAgent(
      dealContext,
      hubspotApiKey,
      sendProgress,
      Infinity
    );

    await connectDB();
    const completedJob = await IntelligenceJob.findById(jobId);
    if (!completedJob) return;

    // Fetch deal from MongoDB for scoring
    let dealScoreData: DealScore | undefined;
    try {
      const mongoDbDeal = await Deal.findOne({ hubspotId: dealId }).lean();
      if (mongoDbDeal) {
        const dealDataForScoring: DealData = {
          dealId: mongoDbDeal.hubspotId,
          dealname: mongoDbDeal.dealname,
          amount: mongoDbDeal.amount,
          dealstage: mongoDbDeal.dealstage,
          pipeline: mongoDbDeal.pipeline,
          closedate: mongoDbDeal.closedate,
          dealtype: mongoDbDeal.dealtype,
          isClosed: mongoDbDeal.isClosed,
          isWon: mongoDbDeal.isWon,
          isLost: mongoDbDeal.isLost,
          companyIds: mongoDbDeal.companyIds,
          contactIds: mongoDbDeal.contactIds,
          properties: mongoDbDeal.properties,
          updatedAt: mongoDbDeal.updatedAt,
        };
        dealScoreData = calculateDealScore(dealDataForScoring);
      }
    } catch (scoreError) {
      console.error('Error calculating deal score:', scoreError);
    }

    if (result.success && result.intelligence) {
      completedJob.status = 'complete';
      completedJob.result = {
        intelligence: {
          ...result.intelligence,
          // Include calculated deal score if AI didn't provide one
          healthScore: result.intelligence.healthScore || dealScoreData?.totalScore,
        },
        dealScore: dealScoreData?.totalScore || result.intelligence.dealScore,
        dealScoreData: dealScoreData, // Full scoring breakdown
        insights: result.intelligence.insights,
        recommendedActions: [
          ...(result.intelligence.recommendedActions || []),
          ...(dealScoreData?.recommendations || []),
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        riskFactors: result.intelligence.riskFactors,
        opportunitySignals: result.intelligence.opportunitySignals,
        // New enhanced fields
        stakeholders: result.intelligence.stakeholders,
        timeline: result.intelligence.timeline,
        dealStageAnalysis: result.intelligence.dealStageAnalysis,
        executiveSummary: result.intelligence.executiveSummary,
      };
      completedJob.stats = {
        iterations: result.iterations,
        toolCalls: result.toolCalls,
        duration: completedJob.startedAt ? Date.now() - completedJob.startedAt.getTime() : undefined,
      };
    } else {
      completedJob.status = 'error';
      completedJob.error = result.error || 'Agent failed to complete analysis';
      completedJob.stats = {
        iterations: result.iterations,
        toolCalls: result.toolCalls,
      };
    }
    
    completedJob.completedAt = new Date();
    await completedJob.save();
    
    // Detect changes from previous analysis
    await detectAndSaveChanges(jobId);
    
  } catch (error: any) {
    await connectDB();
    const errorJob = await IntelligenceJob.findById(jobId);
    if (errorJob) {
      errorJob.status = 'error';
      errorJob.error = error.message || 'Failed to run intelligence job';
      errorJob.completedAt = new Date();
      await errorJob.save();
    }
    throw error;
  }
}

/**
 * Main entry point for running intelligence jobs
 */
export async function runIntelligenceJob(params: RunIntelligenceJobParams): Promise<void> {
  const { jobId, entityType, entityId, entityName, hubspotApiKey, userId } = params;
  
  // Don't await - let it run in background
  (async () => {
    try {
      if (entityType === 'contact') {
        await runContactJob(jobId, entityId, entityName, hubspotApiKey, userId);
      } else if (entityType === 'company') {
        await runCompanyJob(jobId, entityId, entityName, hubspotApiKey, userId);
      } else if (entityType === 'deal') {
        await runDealJob(jobId, entityId, entityName, hubspotApiKey, userId);
      } else {
        throw new Error(`Unknown entity type: ${entityType}`);
      }
    } catch (error: any) {
      console.error(`Error running intelligence job ${jobId}:`, error);
      // Error handling is done in individual functions
    }
  })();
}

/**
 * Run an intelligence job with automatic retry on rate limit errors
 * Uses exponential backoff to handle Anthropic API rate limits
 */
export async function runIntelligenceJobWithRetry(params: RunIntelligenceJobWithRetryParams): Promise<void> {
  const { 
    jobId, 
    entityType, 
    entityId, 
    entityName, 
    hubspotApiKey, 
    userId,
    maxRetries = 3,
    initialDelayMs = 30000 // 30 seconds default
  } = params;
  
  // Don't await - let it run in background
  (async () => {
    let currentRetry = 0;
    let lastError: any = null;
    
    while (currentRetry <= maxRetries) {
      try {
        // Update job status to indicate retry attempt if applicable
        if (currentRetry > 0) {
          await connectDB();
          const job = await IntelligenceJob.findById(jobId);
          if (job) {
            job.logs = job.logs || [];
            job.logs.push({
              step: 'retry-attempt',
              message: `Retry attempt ${currentRetry}/${maxRetries} after rate limit error`,
              status: 'info',
              data: { 
                retryAttempt: currentRetry, 
                maxRetries,
                previousError: lastError?.message || 'Unknown error',
              },
              timestamp: new Date(),
            });
            await job.save();
          }
        }
        
        // Run the appropriate job type
        if (entityType === 'contact') {
          await runContactJob(jobId, entityId, entityName, hubspotApiKey, userId);
        } else if (entityType === 'company') {
          await runCompanyJob(jobId, entityId, entityName, hubspotApiKey, userId);
        } else if (entityType === 'deal') {
          await runDealJob(jobId, entityId, entityName, hubspotApiKey, userId);
        } else {
          throw new Error(`Unknown entity type: ${entityType}`);
        }
        
        // If we get here, job completed successfully
        return;
        
      } catch (error: any) {
        lastError = error;
        console.error(`Error running intelligence job ${jobId} (attempt ${currentRetry + 1}/${maxRetries + 1}):`, error);
        
        // Check if this is a rate limit error and we have retries left
        if (isRateLimitError(error) && currentRetry < maxRetries) {
          currentRetry++;
          
          // Calculate delay with exponential backoff (30s, 60s, 120s, ...)
          const delayMs = initialDelayMs * Math.pow(2, currentRetry - 1);
          
          console.log(`Rate limit detected for job ${jobId}. Waiting ${delayMs / 1000}s before retry ${currentRetry}/${maxRetries}`);
          
          // Update job with retry status
          await connectDB();
          const job = await IntelligenceJob.findById(jobId);
          if (job) {
            // Reset status back to pending for retry
            job.status = 'pending';
            job.error = undefined;
            job.logs = job.logs || [];
            job.logs.push({
              step: 'rate-limit-wait',
              message: `Rate limit encountered. Waiting ${delayMs / 1000} seconds before retry ${currentRetry}/${maxRetries}`,
              status: 'warning',
              data: { 
                delayMs, 
                retryAttempt: currentRetry,
                maxRetries,
                errorMessage: error.message,
              },
              timestamp: new Date(),
            });
            await job.save();
          }
          
          // Wait before retrying
          await sleep(delayMs);
          
        } else {
          // Not a rate limit error or out of retries - let the error handling in individual functions handle it
          // The job's error status should already be set by the individual job functions
          
          // Add final error log if we exhausted retries
          if (currentRetry >= maxRetries && isRateLimitError(error)) {
            await connectDB();
            const job = await IntelligenceJob.findById(jobId);
            if (job) {
              job.status = 'error';
              job.error = `Rate limit error after ${maxRetries} retries: ${error.message}`;
              job.logs = job.logs || [];
              job.logs.push({
                step: 'retry-exhausted',
                message: `All ${maxRetries} retry attempts exhausted. Job failed due to rate limiting.`,
                status: 'error',
                data: { 
                  totalAttempts: currentRetry + 1,
                  errorMessage: error.message,
                },
                timestamp: new Date(),
              });
              job.completedAt = new Date();
              await job.save();
            }
          }
          
          return;
        }
      }
    }
  })();
}


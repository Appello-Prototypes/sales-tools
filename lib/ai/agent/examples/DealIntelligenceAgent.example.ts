/**
 * Example: Deal Intelligence Agent using the reusable framework
 * 
 * This shows how the existing dealIntelligenceAgent.ts could be
 * refactored to use the new AgentEngine framework.
 */

import {
  AgentEngine,
  createAtlasTool,
  loadHubspotTools,
  createStreamingResponse,
  formatAgentProgress,
  type AgentTool,
} from '../index';
import { NextRequest } from 'next/server';

// ============================================================================
// 1. Define the output schema
// ============================================================================

interface DealIntelligence {
  healthScore: number;
  insights: string[];
  recommendedActions: string[];
  riskFactors: string[];
  opportunitySignals: string[];
  similarDealsAnalysis?: string;
  investigationSummary?: string;
}

// ============================================================================
// 2. Define the system prompt
// ============================================================================

const DEAL_INTELLIGENCE_PROMPT = `You are an expert sales intelligence analyst. Your job is to analyze deals and provide actionable insights to help sales teams close more deals.

## Your Goal
Thoroughly analyze the given deal and provide comprehensive intelligence including:
- Deal health assessment (likelihood to close)
- Key insights and observations
- Recommended next actions
- Risk factors to watch
- Opportunity signals
- Comparison to similar deals

## Available Tools

### 1. ATLAS Knowledge Base (query_atlas)
Query for similar deals, company history, industry insights, and best practices.

### 2. HubSpot CRM Tools (hubspot_*)
Access live CRM data - companies, contacts, deal history, associations.

## Your Approach
1. Investigate thoroughly - use multiple tools
2. Cross-reference ATLAS insights with live HubSpot data
3. Look for patterns and comparable deals
4. Call finish_analysis when ready

## Output Format
Provide structured JSON with healthScore, insights, recommendedActions, riskFactors, opportunitySignals.`;

// ============================================================================
// 3. Create the agent factory
// ============================================================================

export async function createDealIntelligenceAgent(): Promise<AgentEngine<{ dealId: string }, DealIntelligence>> {
  // Load tools dynamically
  const tools: AgentTool[] = [
    createAtlasTool(),
    ...(await loadHubspotTools()),
  ];

  return new AgentEngine<{ dealId: string }, DealIntelligence>({
    name: 'deal-intelligence',
    systemPrompt: DEAL_INTELLIGENCE_PROMPT,
    tools,
    maxIterations: 10,
    outputSchema: {
      type: 'object',
      properties: {
        healthScore: { type: 'number' },
        insights: { type: 'array', items: { type: 'string' } },
        recommendedActions: { type: 'array', items: { type: 'string' } },
        riskFactors: { type: 'array', items: { type: 'string' } },
        opportunitySignals: { type: 'array', items: { type: 'string' } },
      },
      required: ['healthScore', 'insights', 'recommendedActions'],
    },
  });
}

// ============================================================================
// 4. Create the API route handler (example)
// ============================================================================

export async function handleDealIntelligenceRequest(
  request: NextRequest,
  dealId: string,
  dealContext: {
    dealName: string;
    amount: number;
    stage: string;
    pipeline: string;
    companyId?: string;
  }
) {
  return createStreamingResponse(async (send) => {
    // 1. Create agent
    const agent = await createDealIntelligenceAgent();
    
    // 2. Build the user message
    const userMessage = `Analyze this deal:
- Deal ID: ${dealId}
- Deal Name: ${dealContext.dealName}
- Amount: $${dealContext.amount.toLocaleString()}
- Stage: ${dealContext.stage}
- Pipeline: ${dealContext.pipeline}
${dealContext.companyId ? `- Company ID: ${dealContext.companyId}` : ''}

Be thorough - investigate using multiple tools.`;

    // 3. Send initial progress
    send('progress', {
      step: 'agent-start',
      message: '🤖 Starting AI Intelligence Agent...',
      status: 'loading',
      data: {
        description: 'The AI agent will investigate this deal using multiple tools.'
      }
    });

    // 4. Run the agent
    const result = await agent.run(
      userMessage,
      { dealId },
      (progress) => send('progress', formatAgentProgress(progress))
    );

    // 5. Send result
    if (result.success && result.output) {
      send('complete', {
        dealId,
        dealName: dealContext.dealName,
        intelligence: result.output,
        agentStats: {
          iterations: result.iterations,
          toolCalls: result.toolCalls,
        },
      });
    } else {
      send('error', {
        message: result.error || 'Agent failed to complete analysis',
      });
    }
  });
}

// ============================================================================
// 5. Usage in a page component (example)
// ============================================================================

/*
// In your React component:

import { useAgentStream, AgentActivityLog } from '@/components/ai/AgentActivityLog';

function DealPage() {
  const { logs, isLoading, result, startStream } = useAgentStream({
    onComplete: (data) => console.log('Done!', data),
  });

  const analyzeDeal = (dealId: string) => {
    startStream(`/api/admin/hubspot/deals/${dealId}/intelligence`);
  };

  return (
    <div>
      <Button onClick={() => analyzeDeal('123')}>
        Analyze Deal
      </Button>
      
      {(isLoading || logs.length > 0) && (
        <AgentActivityLog
          logs={logs}
          isLoading={isLoading}
          title="Deal Analysis"
        />
      )}
      
      {result?.intelligence && (
        <IntelligenceCard data={result.intelligence} />
      )}
    </div>
  );
}
*/



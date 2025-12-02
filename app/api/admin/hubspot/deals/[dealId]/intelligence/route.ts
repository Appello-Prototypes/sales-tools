import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { runDealIntelligenceAgent, AgentProgress, DealContext } from '@/lib/ai/dealIntelligenceAgent';

// Helper to create SSE-formatted messages
function formatSSE(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  // Check if client wants streaming
  const wantsStream = request.headers.get('accept')?.includes('text/event-stream');
  
  if (wantsStream) {
    return handleStreamingRequest(request, params);
  }
  
  // Non-streaming fallback for backwards compatibility
  return handleNonStreamingRequest(request, params);
}

async function handleStreamingRequest(
  request: NextRequest,
  params: Promise<{ dealId: string }>
) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(formatSSE(event, data)));
      };
      
      try {
        const user = verifyAuth(request);
        if (!user) {
          send('error', { message: 'Unauthorized' });
          controller.close();
          return;
        }

        const { dealId } = await params;
        send('progress', { step: 'auth', message: '✓ Authentication verified', status: 'complete' });

        const hubspotApiKey = 
          process.env.HUBSPOT_API_KEY || 
          process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
          process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
          process.env.HUBSPOT_ACCESS_TOKEN;
        
        if (!hubspotApiKey) {
          send('error', { message: 'HubSpot API key not configured' });
          controller.close();
          return;
        }

        // Step 1: Fetch deal from HubSpot
        send('progress', { step: 'hubspot', message: 'Fetching deal details from HubSpot...', status: 'loading' });
        
        const dealUrl = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?associations=companies`;
        const dealResponse = await fetch(dealUrl, {
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!dealResponse.ok) {
          send('progress', { step: 'hubspot', message: `✗ HubSpot API error: ${dealResponse.status}`, status: 'error' });
          send('error', { message: 'Failed to fetch deal details' });
          controller.close();
          return;
        }

        const dealData = await dealResponse.json();
        const deal = dealData.properties || {};
        const dealName = deal.dealname || 'Unnamed Deal';
        const amount = parseFloat(deal.amount || '0');
        const stage = deal.dealstage || '';
        const pipeline = deal.pipeline || '';
        const companyId = dealData.associations?.companies?.results?.[0]?.id;
        
        send('progress', { 
          step: 'hubspot', 
          message: `✓ Deal loaded: "${dealName}" - $${amount.toLocaleString()}`, 
          status: 'complete',
          data: { dealName, amount, stage }
        });

        // Fetch pipeline/stage labels
        let stageLabel = stage;
        let pipelineLabel = pipeline;
        try {
          const pipelineResponse = await fetch(
            `https://api.hubapi.com/crm/v3/pipelines/deals/${pipeline}`,
            {
              headers: {
                'Authorization': `Bearer ${hubspotApiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (pipelineResponse.ok) {
            const pipelineData = await pipelineResponse.json();
            pipelineLabel = pipelineData.label || pipeline;
            const stageData = pipelineData.stages?.find((s: any) => s.id === stage);
            stageLabel = stageData?.label || stage;
          }
        } catch (e) {
          // Keep default values
        }

        // Step 2: Run the AI Agent
        send('progress', { 
          step: 'agent-start', 
          message: '🤖 Starting AI Intelligence Agent...', 
          status: 'loading',
          data: {
            description: 'The AI agent will now investigate this deal using multiple tools. Watch below for full transparency on every query and tool call.'
          }
        });

        const dealContext: DealContext = {
          dealId,
          dealName,
          amount,
          stage,
          stageLabel,
          pipeline,
          pipelineLabel,
          closeDate: deal.closedate,
          dealType: deal.dealtype,
          companyId,
          ownerId: deal.hubspot_owner_id,
          properties: deal
        };

        // Progress callback for the agent
        const sendAgentProgress = (progress: AgentProgress) => {
          const timestamp = progress.timestamp.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });
          
          switch (progress.type) {
            case 'thinking':
              send('progress', {
                step: 'agent-thinking',
                message: `🧠 ${progress.data.message}`,
                status: 'info',
                data: progress.data
              });
              break;
              
            case 'tool_call':
              send('progress', {
                step: `tool-call-${progress.data.tool}`,
                message: `🔧 Calling tool: ${progress.data.tool}`,
                status: 'loading',
                data: {
                  tool: progress.data.tool,
                  input: progress.data.input,
                  reasoning: progress.data.input?.reasoning
                }
              });
              break;
              
            case 'tool_result':
              send('progress', {
                step: `tool-result-${progress.data.tool}`,
                message: `✅ ${progress.data.tool} complete`,
                status: 'complete',
                data: {
                  tool: progress.data.tool,
                  query: progress.data.query,
                  reasoning: progress.data.reasoning,
                  result: progress.data.result,
                  resultCount: progress.data.resultCount,
                  duration: progress.data.duration
                }
              });
              break;
              
            case 'response':
              send('progress', {
                step: 'agent-response',
                message: `💭 Agent reasoning...`,
                status: 'info',
                data: {
                  text: progress.data.text,
                  fullText: progress.data.fullText
                }
              });
              break;
              
            case 'error':
              send('progress', {
                step: 'agent-error',
                message: `❌ ${progress.data.message}`,
                status: 'error',
                data: progress.data
              });
              break;
              
            case 'complete':
              send('progress', {
                step: 'agent-complete',
                message: `✅ Analysis complete (${progress.data.iterations} iterations, ${progress.data.toolCalls} tool calls)`,
                status: 'complete',
                data: progress.data
              });
              break;
          }
        };

        try {
          const result = await runDealIntelligenceAgent(
            dealContext,
            hubspotApiKey,
            sendAgentProgress,
            Infinity // no iteration limit - let agent complete its task
          );
          
          if (result.success && result.intelligence) {
            send('progress', { 
              step: 'complete', 
              message: '✓ Intelligence analysis complete!', 
              status: 'complete',
              data: {
                iterations: result.iterations,
                toolCalls: result.toolCalls
              }
            });

            // Send final result
            send('complete', {
              dealId,
              dealName,
              intelligence: result.intelligence,
              agentStats: {
                iterations: result.iterations,
                toolCalls: result.toolCalls
              },
              timestamp: new Date().toISOString(),
            });
          } else {
            send('error', { 
              message: result.error || 'Agent failed to complete analysis',
              agentStats: {
                iterations: result.iterations,
                toolCalls: result.toolCalls
              }
            });
          }
          
        } catch (error: any) {
          console.error('Error running deal intelligence agent:', error);
          send('progress', { step: 'agent', message: `✗ Agent error: ${error.message}`, status: 'error' });
          send('error', { message: error.message || 'Failed to generate intelligence' });
        }
        
        controller.close();
        
      } catch (error: any) {
        console.error('Error in deal intelligence stream:', error);
        controller.enqueue(encoder.encode(formatSSE('error', { message: error.message || 'Internal server error' })));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function handleNonStreamingRequest(
  request: NextRequest,
  params: Promise<{ dealId: string }>
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await params;

    const hubspotApiKey = 
      process.env.HUBSPOT_API_KEY || 
      process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
      process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!hubspotApiKey) {
      return NextResponse.json(
        { error: 'HubSpot API key not configured' },
        { status: 500 }
      );
    }

    // Fetch deal details from HubSpot
    const dealUrl = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?associations=companies`;
    const dealResponse = await fetch(dealUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!dealResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch deal details' },
        { status: dealResponse.status }
      );
    }

    const dealData = await dealResponse.json();
    const deal = dealData.properties || {};
    const dealName = deal.dealname || 'Unnamed Deal';
    const amount = parseFloat(deal.amount || '0');
    const stage = deal.dealstage || '';
    const pipeline = deal.pipeline || '';
    const companyId = dealData.associations?.companies?.results?.[0]?.id;

    const dealContext: DealContext = {
      dealId,
      dealName,
      amount,
      stage,
      pipeline,
      closeDate: deal.closedate,
      dealType: deal.dealtype,
      companyId,
      ownerId: deal.hubspot_owner_id,
      properties: deal
    };

    // Collect progress for non-streaming response
    const progressLog: any[] = [];
    const sendProgress = (progress: AgentProgress) => {
      progressLog.push({
        type: progress.type,
        timestamp: progress.timestamp.toISOString(),
        data: progress.data
      });
    };

    const result = await runDealIntelligenceAgent(
      dealContext,
      hubspotApiKey,
      sendProgress,
      10
    );

    if (result.success) {
      return NextResponse.json({
        dealId,
        dealName,
        intelligence: result.intelligence,
        agentStats: {
          iterations: result.iterations,
          toolCalls: result.toolCalls
        },
        progressLog,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to generate intelligence',
          agentStats: {
            iterations: result.iterations,
            toolCalls: result.toolCalls
          },
          progressLog
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in deal intelligence endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

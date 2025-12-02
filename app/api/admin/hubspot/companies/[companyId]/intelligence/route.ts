import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { runCompanyIntelligenceAgent, AgentProgress, CompanyContext } from '@/lib/ai/companyIntelligenceAgent';

// Helper to create SSE-formatted messages
function formatSSE(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
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
  params: Promise<{ companyId: string }>
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

        const { companyId } = await params;
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

        // Step 1: Fetch company from HubSpot
        send('progress', { step: 'hubspot', message: 'Fetching company details from HubSpot...', status: 'loading' });
        
        const companyUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`;
        const companyResponse = await fetch(companyUrl, {
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!companyResponse.ok) {
          send('progress', { step: 'hubspot', message: `✗ HubSpot API error: ${companyResponse.status}`, status: 'error' });
          send('error', { message: 'Failed to fetch company details' });
          controller.close();
          return;
        }

        const companyData = await companyResponse.json();
        const company = companyData.properties || {};
        const name = company.name || 'Unnamed Company';
        const domain = company.domain || '';
        const website = company.website || domain;
        const phone = company.phone || '';
        const industry = company.industry || '';
        const employees = company.numberofemployees || '';
        const address = company.address || '';
        const city = company.city || '';
        const state = company.state || '';
        const zip = company.zip || '';
        
        send('progress', { 
          step: 'hubspot', 
          message: `✓ Company loaded: "${name}"`, 
          status: 'complete',
          data: { name, industry, website }
        });

        // Step 2: Run the AI Agent
        send('progress', { 
          step: 'agent-start', 
          message: '🤖 Starting AI Intelligence Agent...', 
          status: 'loading',
          data: {
            description: 'The AI agent will now investigate this company using multiple tools. Watch below for full transparency on every query and tool call.'
          }
        });

        const companyContext: CompanyContext = {
          companyId,
          name,
          domain,
          website,
          phone,
          industry,
          employees,
          address,
          city,
          state,
          zip,
          ownerId: company.hubspot_owner_id,
          properties: company
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
          const result = await runCompanyIntelligenceAgent(
            companyContext,
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
              companyId,
              name,
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
          console.error('Error running company intelligence agent:', error);
          send('progress', { step: 'agent', message: `✗ Agent error: ${error.message}`, status: 'error' });
          send('error', { message: error.message || 'Failed to generate intelligence' });
        }
        
        controller.close();
        
      } catch (error: any) {
        console.error('Error in company intelligence stream:', error);
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
  params: Promise<{ companyId: string }>
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await params;

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

    // Fetch company details from HubSpot
    const companyUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`;
    const companyResponse = await fetch(companyUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!companyResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch company details' },
        { status: companyResponse.status }
      );
    }

    const companyData = await companyResponse.json();
    const company = companyData.properties || {};

    const companyContext: CompanyContext = {
      companyId,
      name: company.name || 'Unnamed Company',
      domain: company.domain,
      website: company.website || company.domain,
      phone: company.phone,
      industry: company.industry,
      employees: company.numberofemployees,
      address: company.address,
      city: company.city,
      state: company.state,
      zip: company.zip,
      ownerId: company.hubspot_owner_id,
      properties: company
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

    const result = await runCompanyIntelligenceAgent(
      companyContext,
      hubspotApiKey,
      sendProgress,
      10
    );

    if (result.success) {
      return NextResponse.json({
        companyId,
        name: companyContext.name,
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
    console.error('Error in company intelligence endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}



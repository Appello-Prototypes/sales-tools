import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { runContactIntelligenceAgent, AgentProgress, ContactContext } from '@/lib/ai/contactIntelligenceAgent';

// Helper to create SSE-formatted messages
function formatSSE(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
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
  params: Promise<{ contactId: string }>
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

        const { contactId } = await params;
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

        // Step 1: Fetch contact from HubSpot
        send('progress', { step: 'hubspot', message: 'Fetching contact details from HubSpot...', status: 'loading' });
        
        const contactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=companies`;
        const contactResponse = await fetch(contactUrl, {
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!contactResponse.ok) {
          send('progress', { step: 'hubspot', message: `✗ HubSpot API error: ${contactResponse.status}`, status: 'error' });
          send('error', { message: 'Failed to fetch contact details' });
          controller.close();
          return;
        }

        const contactData = await contactResponse.json();
        const contact = contactData.properties || {};
        const firstName = contact.firstname || '';
        const lastName = contact.lastname || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Contact';
        const email = contact.email || '';
        const jobTitle = contact.jobtitle || '';
        const phone = contact.phone || '';
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
        
        send('progress', { 
          step: 'hubspot', 
          message: `✓ Contact loaded: "${fullName}"`, 
          status: 'complete',
          data: { fullName, email, jobTitle }
        });

        // Step 2: Run the AI Agent
        send('progress', { 
          step: 'agent-start', 
          message: '🤖 Starting AI Intelligence Agent...', 
          status: 'loading',
          data: {
            description: 'The AI agent will now investigate this contact using multiple tools. Watch below for full transparency on every query and tool call.'
          }
        });

        const contactContext: ContactContext = {
          contactId,
          firstName,
          lastName,
          fullName,
          email,
          jobTitle,
          phone,
          companyId,
          companyName,
          ownerId: contact.hubspot_owner_id,
          properties: contact
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
          const result = await runContactIntelligenceAgent(
            contactContext,
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
              contactId,
              fullName,
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
          console.error('Error running contact intelligence agent:', error);
          send('progress', { step: 'agent', message: `✗ Agent error: ${error.message}`, status: 'error' });
          send('error', { message: error.message || 'Failed to generate intelligence' });
        }
        
        controller.close();
        
      } catch (error: any) {
        console.error('Error in contact intelligence stream:', error);
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
  params: Promise<{ contactId: string }>
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactId } = await params;

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

    // Fetch contact details from HubSpot
    const contactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=companies`;
    const contactResponse = await fetch(contactUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!contactResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch contact details' },
        { status: contactResponse.status }
      );
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

    // Collect progress for non-streaming response
    const progressLog: any[] = [];
    const sendProgress = (progress: AgentProgress) => {
      progressLog.push({
        type: progress.type,
        timestamp: progress.timestamp.toISOString(),
        data: progress.data
      });
    };

    const result = await runContactIntelligenceAgent(
      contactContext,
      hubspotApiKey,
      sendProgress,
      10
    );

    if (result.success) {
      return NextResponse.json({
        contactId,
        fullName,
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
    console.error('Error in contact intelligence endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}



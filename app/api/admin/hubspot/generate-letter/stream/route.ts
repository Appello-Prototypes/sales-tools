import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LetterSettings from '@/models/LetterSettings';
import LetterType from '@/models/LetterType';
import GeneratedLetter from '@/models/GeneratedLetter';
import { queryATLAS } from '@/lib/mcp/atlasClient';

interface ProgressUpdate {
  type: 'step' | 'info' | 'success' | 'error' | 'data' | 'complete';
  message: string;
  data?: any;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  const user = verifyAuth(request);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendProgress = (update: ProgressUpdate) => {
        const chunk = `data: ${JSON.stringify(update)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      try {
        await connectDB();
        const body = await request.json();
        const { 
          companyId, 
          companyData, 
          recipientName, 
          recipientTitle, 
          companySummary, 
          contacts, 
          deals,
          letterTypeId,
          researchSources = [],
          selectedExample,
          customInstructions,
          previousLetterId,
          isManualEntry,
        } = body;

        if (!companyId || !companyData) {
          sendProgress({
            type: 'error',
            message: 'Company ID and data are required',
            timestamp: new Date().toISOString(),
          });
          controller.close();
          return;
        }

        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
          sendProgress({
            type: 'error',
            message: 'Anthropic API key not configured',
            timestamp: new Date().toISOString(),
          });
          controller.close();
          return;
        }

        // Step 1: Loading company information from HubSpot (if not manual)
        if (!isManualEntry && companyId !== 'manual') {
          sendProgress({
            type: 'step',
            message: 'Loading company information from HubSpot...',
            timestamp: new Date().toISOString(),
          });

          try {
            const hubspotApiKey = 
              process.env.HUBSPOT_API_KEY || 
              process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
              process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
              process.env.HUBSPOT_ACCESS_TOKEN;

            if (hubspotApiKey) {
              // Fetch additional company details
              const companyUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=name,domain,industry,city,state,website,phone,numberofemployees`;
              const companyResponse = await fetch(companyUrl, {
                headers: {
                  'Authorization': `Bearer ${hubspotApiKey}`,
                  'Content-Type': 'application/json',
                },
              });

              if (companyResponse.ok) {
                const companyDataResponse = await companyResponse.json();
                sendProgress({
                  type: 'success',
                  message: `Loaded company: ${companyDataResponse.properties?.name || companyData.name}`,
                  data: { companyName: companyDataResponse.properties?.name || companyData.name },
                  timestamp: new Date().toISOString(),
                });
              } else {
                sendProgress({
                  type: 'info',
                  message: 'Using provided company information',
                  timestamp: new Date().toISOString(),
                });
              }
            }
          } catch (error: any) {
            sendProgress({
              type: 'info',
              message: `HubSpot API issue: ${error.message}. Using provided company information.`,
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          sendProgress({
            type: 'step',
            message: 'Using manually entered company information',
            timestamp: new Date().toISOString(),
          });
        }

        // Step 2: Fetch letter settings
        sendProgress({
          type: 'step',
          message: 'Loading letter configuration...',
          timestamp: new Date().toISOString(),
        });

        const settings: any = await (LetterSettings as any).findOne({ settingsType: 'default' });
        if (!settings) {
          sendProgress({
            type: 'error',
            message: 'Letter settings not configured',
            timestamp: new Date().toISOString(),
          });
          controller.close();
          return;
        }

        // Fetch letter type if provided
        let letterType: any = null;
        let systemPrompt = settings.systemPrompt;
        let userPromptTemplate = settings.userPromptTemplate;

        if (letterTypeId) {
          letterType = await (LetterType as any).findById(letterTypeId);
          if (letterType) {
            systemPrompt = letterType.systemPrompt || systemPrompt;
            userPromptTemplate = letterType.userPromptTemplate || userPromptTemplate;
            sendProgress({
              type: 'success',
              message: `Letter type: ${letterType.name}`,
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Step 3: Perform research
        let researchData = '';
        const atlasResults: any[] = [];
        let internetResearchNote = '';

        if (researchSources.length > 0) {
          const researchResults: string[] = [];

          if (researchSources.includes('atlas')) {
            sendProgress({
              type: 'step',
              message: '🔍 Querying ATLAS database for similar customers and case studies...',
              timestamp: new Date().toISOString(),
            });

            try {
              const atlasQueries = [
                `Find customers similar to ${companyData.name} in ${companyData.industry || 'their industry'}`,
                `Case studies for companies like ${companyData.name} solving operational challenges`,
                `Success stories for ${companyData.industry || 'similar'} companies`,
              ];

              sendProgress({
                type: 'info',
                message: `📋 Running ${atlasQueries.length} ATLAS queries...`,
                timestamp: new Date().toISOString(),
              });

              for (let i = 0; i < atlasQueries.length; i++) {
                const query = atlasQueries[i];
                try {
                  sendProgress({
                    type: 'info',
                    message: `🔎 [Query ${i + 1}/${atlasQueries.length}] "${query}"`,
                    data: { queryIndex: i + 1, totalQueries: atlasQueries.length, query },
                    timestamp: new Date().toISOString(),
                  });

                  // Log callback to send real-time MCP progress
                  const logCallback = (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => {
                    sendProgress({
                      type: type === 'warning' ? 'info' : type,
                      message: message,
                      data: data,
                      timestamp: new Date().toISOString(),
                    });
                  };

                  const atlasResult = await queryATLAS(query, undefined, logCallback);
                  
                  if (atlasResult?.results && atlasResult.results.length > 0) {
                    const resultsSlice = atlasResult.results.slice(0, 5);
                    atlasResults.push(...resultsSlice);
                    const resultsText = resultsSlice.map((r: any) => 
                      `- ${r.title || r.name || 'Result'}: ${r.description || r.summary || 'No description'}`
                    ).join('\n');
                    researchResults.push(`ATLAS Research Results:\n${resultsText}`);
                    
                    // Send individual result preview
                    sendProgress({
                      type: 'success',
                      message: `✅ Query ${i + 1}: Found ${atlasResult.results.length} results`,
                      data: { 
                        queryIndex: i + 1,
                        resultCount: atlasResult.results.length,
                        preview: resultsSlice.slice(0, 2).map((r: any) => ({
                          title: r.title || r.name || 'Result',
                          snippet: (r.description || r.summary || '').substring(0, 100) + '...'
                        }))
                      },
                      timestamp: new Date().toISOString(),
                    });
                  } else {
                    sendProgress({
                      type: 'info',
                      message: `ℹ️ Query ${i + 1}: No results found`,
                      data: { queryIndex: i + 1, resultCount: 0 },
                      timestamp: new Date().toISOString(),
                    });
                  }
                } catch (error: any) {
                  sendProgress({
                    type: 'error',
                    message: `❌ Query ${i + 1} error: ${error.message}`,
                    data: { queryIndex: i + 1, error: error.message },
                    timestamp: new Date().toISOString(),
                  });
                }
              }

              if (atlasResults.length > 0) {
                sendProgress({
                  type: 'data',
                  message: `📊 ATLAS Research Complete: ${atlasResults.length} total results collected`,
                  data: { 
                    type: 'atlas',
                    totalResults: atlasResults.length,
                    results: atlasResults.map((r: any) => ({
                      title: r.title || r.name || 'Result',
                      description: r.description || r.summary || 'No description',
                      source: r.source || 'ATLAS',
                      relevance: r.relevance || r.score || null
                    }))
                  },
                  timestamp: new Date().toISOString(),
                });
              } else {
                sendProgress({
                  type: 'info',
                  message: '⚠️ No ATLAS results found - letter will be generated without case study references',
                  timestamp: new Date().toISOString(),
                });
              }
            } catch (error: any) {
              sendProgress({
                type: 'error',
                message: `❌ ATLAS research error: ${error.message}`,
                data: { error: error.message, stack: error.stack?.substring(0, 200) },
                timestamp: new Date().toISOString(),
              });
            }
          }

          if (researchSources.includes('internet')) {
            sendProgress({
              type: 'step',
              message: '🌐 Preparing internet research instructions...',
              timestamp: new Date().toISOString(),
            });

            sendProgress({
              type: 'info',
              message: `🔍 Will search for: Recent news about ${companyData.name}`,
              timestamp: new Date().toISOString(),
            });

            sendProgress({
              type: 'info',
              message: `🔍 Will search for: ${companyData.industry || 'Industry'} trends and updates`,
              timestamp: new Date().toISOString(),
            });

            internetResearchNote = `Internet Research: Please include any recent news, company updates, or industry insights about ${companyData.name} that would be relevant to personalize this letter. Search for recent press releases, product announcements, leadership changes, or industry trends affecting ${companyData.industry || 'their industry'}.`;
            researchResults.push(internetResearchNote);
            
            sendProgress({
              type: 'success',
              message: '✅ Internet research context added to AI prompt',
              data: {
                type: 'web',
                instruction: 'AI will incorporate recent web information during generation'
              },
              timestamp: new Date().toISOString(),
            });
          }

          if (researchResults.length > 0) {
            researchData = '\n\nAdditional Research:\n' + researchResults.join('\n\n');
          }
        }

        // Step 4: Get selected example if provided
        let exampleText = '';
        if (selectedExample && selectedExample !== 'none' && settings.approvedSamples) {
          sendProgress({
            type: 'step',
            message: 'Loading reference example...',
            timestamp: new Date().toISOString(),
          });

          const example = settings.approvedSamples.find((s: any) => 
            s.name === selectedExample || s.name === selectedExample.replace('example-', '')
          );
          if (example) {
            exampleText = `\n\nReference Example (use as style guide, but personalize for this company):\n${example.content}`;
            sendProgress({
              type: 'success',
              message: `Loaded example: ${example.name || 'Reference Example'}`,
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Step 4b: Get previous letter if provided
        let previousLetterText = '';
        if (previousLetterId) {
          sendProgress({
            type: 'step',
            message: 'Loading previous letter reference...',
            timestamp: new Date().toISOString(),
          });

          try {
            const previousLetter: any = await (GeneratedLetter as any).findById(previousLetterId);
            if (previousLetter) {
              previousLetterText = `\n\nPrevious Letter Reference (use as style and tone guide, but personalize for ${companyData.name}):\nCompany: ${previousLetter.companyName}${previousLetter.recipientName ? `\nRecipient: ${previousLetter.recipientName}` : ''}\n\nLetter Content:\n${previousLetter.generatedText}`;
              sendProgress({
                type: 'success',
                message: `Loaded previous letter: ${previousLetter.companyName}`,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error: any) {
            sendProgress({
              type: 'info',
              message: `Could not load previous letter: ${error.message}`,
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Step 5: Build prompt
        sendProgress({
          type: 'step',
          message: 'Building personalized prompt with all gathered information...',
          timestamp: new Date().toISOString(),
        });

        let prompt = userPromptTemplate
          .replace(/\{\{companyName\}\}/g, companyData.name)
          .replace(/\{\{industry\}\}/g, companyData.industry || 'Not specified')
          .replace(/\{\{location\}\}/g, companyData.city ? `${companyData.city}, ${companyData.state || ''}` : 'Not specified')
          .replace(/\{\{website\}\}/g, companyData.website || companyData.domain || 'Not specified')
          .replace(/\{\{employees\}\}/g, companyData.employees || 'Not specified');

        if (recipientName) {
          prompt = prompt.replace(/\{\{#if recipientName\}\}/g, '');
          prompt = prompt.replace(/\{\{\/if\}\}/g, '');
          prompt = prompt.replace(/\{\{recipientName\}\}/g, recipientName);
          prompt = prompt.replace(/\{\{#if recipientTitle\}\}/g, recipientTitle ? '' : '');
          prompt = prompt.replace(/\{\{recipientTitle\}\}/g, recipientTitle || '');
        } else {
          prompt = prompt.replace(/\{\{#if recipientName\}\}[\s\S]*?\{\{\/if\}\}/g, '');
        }

        if (companySummary) {
          prompt = prompt.replace(/\{\{#if companySummary\}\}/g, '');
          prompt = prompt.replace(/\{\{companySummary\}\}/g, companySummary);
          prompt = prompt.replace(/\{\{\/if\}\}/g, '');
        } else {
          prompt = prompt.replace(/\{\{#if companySummary\}\}[\s\S]*?\{\{\/if\}\}/g, '');
        }

        if (contacts && contacts.length > 0) {
          const contactsText = contacts.map((c: any) => 
            `- ${c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim()} (${c.jobTitle || 'No title'}) - ${c.email || 'No email'}`
          ).join('\n');
          prompt = prompt.replace(/\{\{#if contacts\}\}/g, '');
          prompt = prompt.replace(/\{\{contacts\}\}/g, contactsText);
          prompt = prompt.replace(/\{\{\/if\}\}/g, '');
        } else {
          prompt = prompt.replace(/\{\{#if contacts\}\}[\s\S]*?\{\{\/if\}\}/g, '');
        }

        if (deals && deals.length > 0) {
          const dealsText = deals.map((d: any) => 
            `- ${d.name || 'Unnamed'} - Stage: ${d.stage || 'Unknown'} - Value: ${d.amount ? `$${d.amount}` : 'Not specified'}`
          ).join('\n');
          prompt = prompt.replace(/\{\{#if deals\}\}/g, '');
          prompt = prompt.replace(/\{\{deals\}\}/g, dealsText);
          prompt = prompt.replace(/\{\{\/if\}\}/g, '');
        } else {
          prompt = prompt.replace(/\{\{#if deals\}\}[\s\S]*?\{\{\/if\}\}/g, '');
        }

        prompt = prompt.replace(/\{\{[^}]+\}\}/g, '');

        if (researchData) {
          prompt += researchData;
        }
        if (exampleText) {
          prompt += exampleText;
        }
        if (previousLetterText) {
          prompt += previousLetterText;
        }
        if (customInstructions) {
          prompt += `\n\nCustom Instructions:\n${customInstructions}`;
        }

        sendProgress({
          type: 'success',
          message: 'Prompt prepared with all context',
          timestamp: new Date().toISOString(),
        });

        // Step 6: Generate letter with AI
        sendProgress({
          type: 'step',
          message: 'Generating personalized letter with AI...',
          timestamp: new Date().toISOString(),
        });

        sendProgress({
          type: 'info',
          message: 'AI is analyzing company information, research data, and crafting your personalized letter...',
          timestamp: new Date().toISOString(),
        });

        // Validate required fields before making API call
        if (!systemPrompt || !prompt) {
          sendProgress({
            type: 'error',
            message: 'Missing required prompt content',
            data: { 
              details: `System prompt: ${systemPrompt ? 'present' : 'missing'}, User prompt: ${prompt ? 'present' : 'missing'}` 
            },
            timestamp: new Date().toISOString(),
          });
          controller.close();
          return;
        }

        if (!settings.aiModel) {
          sendProgress({
            type: 'error',
            message: 'AI model not configured in settings',
            timestamp: new Date().toISOString(),
          });
          controller.close();
          return;
        }

        const requestBody = {
          model: settings.aiModel,
          max_tokens: settings.maxTokens || 4096,
          temperature: settings.temperature !== undefined ? settings.temperature : 0.7,
          system: systemPrompt,
          messages: [
            { role: 'user', content: prompt },
          ],
        };

        const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          let errorDetails;
          try {
            errorDetails = JSON.parse(errorText);
          } catch {
            errorDetails = errorText;
          }
          console.error('Anthropic API Error:', aiResponse.status, errorDetails);
          sendProgress({
            type: 'error',
            message: `Failed to generate letter: ${aiResponse.status}`,
            data: { 
              details: typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails),
              status: aiResponse.status,
            },
            timestamp: new Date().toISOString(),
          });
          controller.close();
          return;
        }

        const data = await aiResponse.json();
        const letter = data.content[0]?.text || '';

        sendProgress({
          type: 'success',
          message: 'Letter generated successfully!',
          timestamp: new Date().toISOString(),
        });

        // Step 7: Save to database
        sendProgress({
          type: 'step',
          message: 'Saving letter to database...',
          timestamp: new Date().toISOString(),
        });

        const newLetter = await (GeneratedLetter as any).create({
          companyId,
          companyName: companyData.name,
          companyDomain: companyData.domain,
          companyIndustry: companyData.industry,
          companyLocation: companyData.city ? `${companyData.city}, ${companyData.state || ''}` : undefined,
          recipientName,
          recipientTitle,
          generatedText: letter,
          originalPrompt: prompt,
          aiModel: settings.aiModel,
          createdBy: user.userId,
          updatedBy: user.userId,
          status: 'draft',
        });

        sendProgress({
          type: 'complete',
          message: '✅ Letter generation complete!',
          data: {
            letter,
            letterId: newLetter._id.toString(),
            companyId,
            companyName: companyData.name,
            generatedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });

      } catch (error: any) {
        console.error('Error generating letter:', error);
        sendProgress({
          type: 'error',
          message: `Error: ${error.message || 'Failed to generate letter'}`,
          timestamp: new Date().toISOString(),
        });
      } finally {
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


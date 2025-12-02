/**
 * Deal Intelligence Agent
 * 
 * An agentic approach where Claude decides what tools to call,
 * in what order, and how many times - until it has enough information
 * to provide comprehensive deal intelligence.
 * 
 * Tools are loaded dynamically from:
 * - ATLAS MCP (knowledge base)
 * - HubSpot MCP (CRM data and operations)
 * 
 * Full transparency: All tool calls, reasoning, and responses are streamed
 * for audit purposes.
 * 
 * Prompts are now configurable via IntelligencePromptConfig in MongoDB.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '@/lib/config';
import { queryATLAS } from '@/lib/mcp/atlasClient';
import { 
  getHubspotMcpTools, 
  callHubspotMcpTool,
  getHubspotMcpStatus 
} from '@/lib/mcp/hubspotMcpClient';
import connectDB from '@/lib/mongodb';
import { getIntelligencePromptConfig, IIntelligencePromptConfig } from '@/models/IntelligencePromptConfig';

// Core tools that are always available (not from MCP)
const CORE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'query_atlas',
    description: `Search the ATLAS knowledge base for relevant information. ATLAS contains historical data about:
- Previous deals and their outcomes (won/lost, deal sizes, timelines)
- Customer information and company profiles
- Industry insights and market data
- Sales patterns and best practices
- Competitor information

Use this tool to find similar deals, understand customer history, research industry context, or gather any relevant background information. You can call this multiple times with different queries to gather comprehensive intelligence.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query to send to ATLAS. Be specific and descriptive. Examples: "deals won in construction industry over $50k", "customer history for companies in Ontario", "common objections in enterprise sales"'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'finish_analysis',
    description: `Call this when you have gathered enough information and are ready to provide your final deal intelligence analysis. This signals that you are done investigating and ready to present your findings.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: {
          type: 'string',
          description: 'Brief summary of what you investigated and key findings'
        }
      },
      required: ['summary']
    }
  }
];

/**
 * Build the complete tool list by combining core tools with HubSpot MCP tools
 */
async function buildAgentTools(sendProgress: (progress: AgentProgress) => void): Promise<Anthropic.Tool[]> {
  const tools: Anthropic.Tool[] = [...CORE_TOOLS];
  
  // Try to load HubSpot MCP tools
  try {
    sendProgress({
      type: 'thinking',
      timestamp: new Date(),
      data: {
        message: 'Discovering available HubSpot MCP tools...'
      }
    });
    
    const hubspotStatus = await getHubspotMcpStatus();
    
    if (hubspotStatus.connected && hubspotStatus.tools) {
      const mcpTools = await getHubspotMcpTools();
      
      // Convert MCP tools to Anthropic format
      for (const mcpTool of mcpTools) {
        // Skip tools that might conflict or aren't useful for deal analysis
        const skipTools = ['hubspot-generate-feedback-link'];
        if (skipTools.includes(mcpTool.name)) continue;
        
        tools.push({
          name: `hubspot_${mcpTool.name.replace(/-/g, '_')}`,
          description: mcpTool.description || `HubSpot MCP tool: ${mcpTool.name}`,
          input_schema: mcpTool.inputSchema || {
            type: 'object' as const,
            properties: {},
            required: []
          }
        });
      }
      
      sendProgress({
        type: 'thinking',
        timestamp: new Date(),
        data: {
          message: `Loaded ${mcpTools.length} HubSpot MCP tools`,
          tools: mcpTools.map((t: any) => t.name)
        }
      });
    } else {
      sendProgress({
        type: 'thinking',
        timestamp: new Date(),
        data: {
          message: 'HubSpot MCP not available, using fallback tools',
          error: hubspotStatus.error
        }
      });
      
      // Add fallback HubSpot tools if MCP isn't available
      tools.push(...getFallbackHubspotTools());
    }
  } catch (error: any) {
    sendProgress({
      type: 'thinking',
      timestamp: new Date(),
      data: {
        message: `Failed to load HubSpot MCP tools: ${error.message}`,
        error: error.message
      }
    });
    
    // Add fallback tools
    tools.push(...getFallbackHubspotTools());
  }
  
  return tools;
}

/**
 * Fallback HubSpot tools when MCP isn't available
 */
function getFallbackHubspotTools(): Anthropic.Tool[] {
  return [
    {
      name: 'hubspot_search_objects',
      description: 'Search HubSpot for objects (deals, companies, contacts) with filters',
      input_schema: {
        type: 'object' as const,
        properties: {
          objectType: {
            type: 'string',
            description: 'Type of object to search: deals, companies, contacts'
          },
          query: {
            type: 'string', 
            description: 'Text search query'
          },
          filterGroups: {
            type: 'array',
            description: 'Filter groups for advanced filtering'
          },
          properties: {
            type: 'array',
            description: 'Properties to return'
          },
          limit: {
            type: 'number',
            description: 'Max results to return'
          }
        },
        required: ['objectType']
      }
    },
    {
      name: 'hubspot_list_associations',
      description: 'Get associations between HubSpot objects (e.g., contacts for a deal)',
      input_schema: {
        type: 'object' as const,
        properties: {
          objectType: {
            type: 'string',
            description: 'Source object type'
          },
          objectId: {
            type: 'string',
            description: 'Source object ID'
          },
          toObjectType: {
            type: 'string',
            description: 'Target object type to find associations for'
          }
        },
        required: ['objectType', 'objectId', 'toObjectType']
      }
    }
  ];
}

// Fallback system prompt if config not available
const DEFAULT_AGENT_SYSTEM_PROMPT = `You are an expert sales intelligence analyst. Your job is to analyze deals and provide actionable insights to help sales teams close more deals.

## Your Goal
Thoroughly analyze the given deal and provide comprehensive intelligence including:
- **Deal Stage Assessment** - Validate the deal stage using both HubSpot data and historical patterns from ATLAS
- **Internal Stakeholder Analysis** - Profile every contact involved in the deal
- **Deal health assessment** - Likelihood to close
- **Deal Timeline** - Key interactions and milestones over time
- **Key insights and observations**
- **Recommended next actions**
- **Risk factors to watch**
- **Opportunity signals**

## Critical: Internal Stakeholder Analysis
For EVERY deal, you MUST analyze the internal stakeholders. This is essential.

Use hubspot_list_associations to get all contacts associated with the deal, then for each contact:
1. Get their full profile (name, title, email, phone)
2. Understand their role in the decision (Economic Buyer, Technical Evaluator, End User, Champion, Blocker, etc.)
3. Query ATLAS for any historical interactions, expressed pain points, or preferences
4. Identify what they care about based on their title/role
5. Note any pain points they've expressed in past communications

Build a stakeholder map with:
- **Name & Title**: Who they are
- **Role in Decision**: Their influence on the purchase
- **Interests/Priorities**: What they care about most
- **Pain Points**: Problems they've expressed
- **Engagement Level**: How active/engaged they are
- **Sentiment**: Positive, neutral, or concerned
- **Key Notes**: Important things to remember

## Critical: Deal Stage Validation
Cross-reference the HubSpot deal stage with:
1. Activity patterns (are activities consistent with this stage?)
2. ATLAS historical data (similar deals at this stage - what did they look like?)
3. Stakeholder engagement (is engagement level appropriate for this stage?)

If there's a mismatch, flag it as "Inferred Stage" may differ from "HubSpot Stage".

## Critical: Deal Timeline
Build a chronological timeline of key events:
1. Use HubSpot to get deal creation date and stage changes
2. Query ATLAS for meeting notes, calls, emails
3. List key milestones and interactions in order

## Available Tools

### 1. ATLAS Knowledge Base (query_atlas)
ATLAS contains your organization's historical knowledge. Query it for:
- Similar deals and their outcomes
- Customer/company history  
- Industry insights
- Best practices for this type of deal
- Competitive intelligence
- **Historical interactions with contacts** (meeting notes, pain points expressed, preferences)
- **Communication history** for timeline

### 2. HubSpot CRM Tools (hubspot_*)
You have direct access to HubSpot CRM through MCP tools. These include:
- **hubspot_get_user_details** - Get current user/owner info
- **hubspot_list_objects** - List objects (deals, companies, contacts)
- **hubspot_search_objects** - Search with filters
- **hubspot_batch_read_objects** - Get multiple objects by ID
- **hubspot_list_associations** - Get relationships between objects (CRITICAL for getting contacts on deal)
- **hubspot_list_properties** - Discover available properties
- **hubspot_get_property** - Get details about a specific property

Use HubSpot tools to:
- Look up the company behind this deal
- **Get ALL contacts associated with the deal**
- Get detailed contact profiles for stakeholder analysis
- Search for similar deals (by amount, stage, etc.)
- Understand deal history and associations

## Your Approach
1. **Get deal associations first** - Use hubspot_list_associations to get contacts and company for the deal
2. **Profile all stakeholders** - For each contact, get their details and query ATLAS for history
3. **Validate deal stage** - Cross-reference HubSpot stage with actual engagement patterns
4. **Build timeline** - Gather key events chronologically
5. **Investigate thoroughly** - Use both ATLAS and HubSpot to build complete picture
6. **Know when you're done** - When you have stakeholders, timeline, and insights, call finish_analysis

## Important Rules
- ALWAYS get stakeholder/contact information - this is mandatory
- Make multiple tool calls if needed - thoroughness is valued
- Query ATLAS specifically for contact histories and pain points
- Cross-reference HubSpot data with ATLAS historical knowledge
- If a query returns no results, try rephrasing
- Focus on actionable, specific recommendations

## Output Format
When you call finish_analysis, your final response should include structured intelligence that can be parsed as JSON.`;

// Cache for the intelligence config to avoid repeated DB calls
let cachedConfig: IIntelligencePromptConfig | null = null;
let configLastFetched: number = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute cache

/**
 * Get the intelligence prompt config (with caching)
 */
async function getAgentConfig(): Promise<{
  systemPrompt: string;
  maxIterations: number;
  researchInstructions: {
    atlasPrompt: string;
    hubspotPrompt: string;
    generalGuidelines: string;
  };
  qualityStandards: string;
}> {
  const now = Date.now();
  
  // Use cached config if still valid
  if (cachedConfig && (now - configLastFetched) < CONFIG_CACHE_TTL) {
    return {
      systemPrompt: cachedConfig.agents.deal.systemPrompt,
      maxIterations: cachedConfig.agents.deal.maxIterations,
      researchInstructions: cachedConfig.researchInstructions,
      qualityStandards: cachedConfig.qualityStandards,
    };
  }
  
  try {
    await connectDB();
    cachedConfig = await getIntelligencePromptConfig();
    configLastFetched = now;
    
    return {
      systemPrompt: cachedConfig.agents.deal.systemPrompt,
      maxIterations: cachedConfig.agents.deal.maxIterations,
      researchInstructions: cachedConfig.researchInstructions,
      qualityStandards: cachedConfig.qualityStandards,
    };
  } catch (error) {
    console.error('Failed to load intelligence config, using defaults:', error);
    return {
      systemPrompt: DEFAULT_AGENT_SYSTEM_PROMPT,
      maxIterations: 10,
      researchInstructions: {
        atlasPrompt: '',
        hubspotPrompt: '',
        generalGuidelines: '',
      },
      qualityStandards: '',
    };
  }
}

/**
 * Build the full system prompt with research instructions and quality standards
 */
function buildSystemPrompt(config: Awaited<ReturnType<typeof getAgentConfig>>): string {
  let prompt = config.systemPrompt;
  
  // Append research instructions if available
  if (config.researchInstructions.generalGuidelines) {
    prompt += `\n\n${config.researchInstructions.generalGuidelines}`;
  }
  
  // Append quality standards if available
  if (config.qualityStandards) {
    prompt += `\n\n${config.qualityStandards}`;
  }
  
  return prompt;
}

export interface AgentProgress {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response' | 'error' | 'complete';
  timestamp: Date;
  data: any;
}

export interface DealContext {
  dealId: string;
  dealName: string;
  amount: number;
  stage: string;
  stageLabel?: string;
  pipeline: string;
  pipelineLabel?: string;
  closeDate?: string;
  dealType?: string;
  companyId?: string;
  ownerId?: string;
  properties?: Record<string, any>;
}

/**
 * Tool executor - handles the actual tool calls
 * Routes to appropriate handler based on tool type:
 * - Core tools (query_atlas, finish_analysis)
 * - HubSpot MCP tools (hubspot_*)
 * - Fallback HTTP tools
 */
async function executeTool(
  toolName: string,
  toolInput: any,
  dealContext: DealContext,
  hubspotApiKey: string,
  sendProgress: (progress: AgentProgress) => void
): Promise<string> {
  const startTime = Date.now();
  
  try {
    // Handle core tools
    if (toolName === 'query_atlas') {
      return await executeAtlasTool(toolInput, sendProgress, startTime);
    }
    
    if (toolName === 'finish_analysis') {
      sendProgress({
        type: 'tool_call',
        timestamp: new Date(),
        data: {
          tool: 'finish_analysis',
          input: toolInput,
          status: 'complete'
        }
      });
      
      return JSON.stringify({
        success: true,
        message: 'Analysis complete. Provide your final intelligence report.'
      });
    }
    
    // Handle HubSpot MCP tools (prefixed with hubspot_)
    if (toolName.startsWith('hubspot_')) {
      return await executeHubspotMcpTool(toolName, toolInput, sendProgress, startTime);
    }
    
    // Unknown tool
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    
  } catch (error: any) {
    sendProgress({
      type: 'error',
      timestamp: new Date(),
      data: {
        tool: toolName,
        error: error.message,
        status: 'error'
      }
    });
    
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Execute ATLAS query tool
 */
async function executeAtlasTool(
  toolInput: any,
  sendProgress: (progress: AgentProgress) => void,
  startTime: number
): Promise<string> {
  sendProgress({
    type: 'tool_call',
    timestamp: new Date(),
    data: {
      tool: 'query_atlas',
      input: toolInput,
      status: 'executing'
    }
  });
  
  const result = await queryATLAS(toolInput.query);
  const duration = Date.now() - startTime;
  
  sendProgress({
    type: 'tool_result',
    timestamp: new Date(),
    data: {
      tool: 'query_atlas',
      query: toolInput.query,
      result: result,
      resultCount: result.results?.length || 0,
      duration: `${duration}ms`,
      status: 'complete'
    }
  });
  
  return JSON.stringify({
    success: true,
    query: toolInput.query,
    results: result.results || [],
    resultCount: result.results?.length || 0
  });
}

/**
 * Execute HubSpot MCP tool
 */
async function executeHubspotMcpTool(
  toolName: string,
  toolInput: any,
  sendProgress: (progress: AgentProgress) => void,
  startTime: number
): Promise<string> {
  // Convert tool name back to MCP format (hubspot_list_objects -> hubspot-list-objects)
  const mcpToolName = toolName
    .replace('hubspot_', '')
    .replace(/_/g, '-');
  
  sendProgress({
    type: 'tool_call',
    timestamp: new Date(),
    data: {
      tool: toolName,
      mcpTool: mcpToolName,
      input: toolInput,
      status: 'executing'
    }
  });
  
  // Call the HubSpot MCP tool
  const result = await callHubspotMcpTool(mcpToolName, toolInput);
  const duration = Date.now() - startTime;
  
  if (result.success) {
    sendProgress({
      type: 'tool_result',
      timestamp: new Date(),
      data: {
        tool: toolName,
        mcpTool: mcpToolName,
        input: toolInput,
        result: result.result,
        duration: `${duration}ms`,
        status: 'complete'
      }
    });
    
    return JSON.stringify({
      success: true,
      tool: mcpToolName,
      result: result.result
    });
  } else {
    sendProgress({
      type: 'tool_result',
      timestamp: new Date(),
      data: {
        tool: toolName,
        mcpTool: mcpToolName,
        error: result.error,
        duration: `${duration}ms`,
        status: 'error'
      }
    });
    
    return JSON.stringify({
      success: false,
      tool: mcpToolName,
      error: result.error
    });
  }
}

/**
 * Run the deal intelligence agent
 */
export async function runDealIntelligenceAgent(
  dealContext: DealContext,
  hubspotApiKey: string,
  sendProgress: (progress: AgentProgress) => void,
  maxIterationsOverride?: number
): Promise<{
  success: boolean;
  intelligence?: any;
  error?: string;
  iterations: number;
  toolCalls: number;
}> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }
  
  // Load configurable prompts and settings
  const config = await getAgentConfig();
  const systemPrompt = buildSystemPrompt(config);
  const maxIterations = maxIterationsOverride ?? config.maxIterations;
  
  sendProgress({
    type: 'thinking',
    timestamp: new Date(),
    data: {
      message: 'Loaded intelligence configuration',
      maxIterations
    }
  });
  
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  
  // Initial user message with deal context
  const initialMessage = `Analyze this deal and provide comprehensive intelligence:

## Deal Information
- **Deal ID**: ${dealContext.dealId}
- **Deal Name**: ${dealContext.dealName}
- **Amount**: $${dealContext.amount?.toLocaleString() || 'Not specified'}
- **Stage**: ${dealContext.stageLabel || dealContext.stage || 'Unknown'}
- **Pipeline**: ${dealContext.pipelineLabel || dealContext.pipeline || 'Unknown'}
- **Close Date**: ${dealContext.closeDate || 'Not set'}
- **Deal Type**: ${dealContext.dealType || 'Not specified'}
${dealContext.companyId ? `- **Company ID**: ${dealContext.companyId}` : ''}

## Your Task
1. Use the available tools to gather relevant information about this deal
2. Search ATLAS for similar deals, company history, and relevant insights
3. Investigate the deal from multiple angles (stakeholders, history, comparable deals)
4. When you have enough information, call finish_analysis and provide your intelligence

Be thorough - make multiple tool calls if needed. Explain your reasoning for each investigation.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: initialMessage }
  ];
  
  let iterations = 0;
  let toolCalls = 0;
  let isComplete = false;
  let finalIntelligence: any = null;
  
  sendProgress({
    type: 'thinking',
    timestamp: new Date(),
    data: {
      message: 'Starting deal intelligence analysis...',
      dealName: dealContext.dealName,
      amount: dealContext.amount
    }
  });
  
  // Build tools dynamically (includes HubSpot MCP tools if available)
  const agentTools = await buildAgentTools(sendProgress);
  
  sendProgress({
    type: 'thinking',
    timestamp: new Date(),
    data: {
      message: `Agent initialized with ${agentTools.length} tools`,
      tools: agentTools.map(t => t.name)
    }
  });
  
  while (!isComplete && iterations < maxIterations) {
    iterations++;
    
    sendProgress({
      type: 'thinking',
      timestamp: new Date(),
      data: {
        message: `Iteration ${iterations}: Agent is analyzing...`,
        iteration: iterations
      }
    });
    
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8192,
        system: systemPrompt,
        tools: agentTools,
        messages: messages
      });
      
      // Collect all content blocks for the assistant message
      const assistantContent: Anthropic.ContentBlockParam[] = [];
      // Collect all tool uses to execute
      const toolUseBlocks: Array<{id: string; name: string; input: any}> = [];
      
      // First pass: collect all blocks
      for (const block of response.content) {
        if (block.type === 'text') {
          assistantContent.push({ type: 'text', text: block.text });
          
          sendProgress({
            type: 'response',
            timestamp: new Date(),
            data: {
              message: 'Agent reasoning',
              text: block.text.substring(0, 500) + (block.text.length > 500 ? '...' : ''),
              fullText: block.text
            }
          });
          
          // Check if this is the final response (no tool calls)
          if (response.stop_reason === 'end_turn' && !response.content.some(b => b.type === 'tool_use')) {
            // Try to parse intelligence from the response
            try {
              const jsonMatch = block.text.match(/```json\s*([\s\S]*?)```/);
              if (jsonMatch) {
                finalIntelligence = JSON.parse(jsonMatch[1]);
              } else {
                // Try to parse as raw JSON
                const rawJson = block.text.match(/\{[\s\S]*"healthScore"[\s\S]*\}/);
                if (rawJson) {
                  finalIntelligence = JSON.parse(rawJson[0]);
                }
              }
            } catch (e) {
              // If can't parse JSON, create structured response from text
              finalIntelligence = {
                healthScore: 5,
                rawAnalysis: block.text,
                parseError: 'Could not parse structured JSON from response'
              };
            }
            isComplete = true;
          }
        } else if (block.type === 'tool_use') {
          toolCalls++;
          assistantContent.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>
          });
          toolUseBlocks.push({
            id: block.id,
            name: block.name,
            input: block.input
          });
          
          // Check if this is finish_analysis
          if (block.name === 'finish_analysis') {
            isComplete = true;
          }
        }
      }
      
      // If there are tool calls, execute them and add messages
      if (toolUseBlocks.length > 0) {
        // Add the assistant message with ALL tool uses
        messages.push({ role: 'assistant', content: assistantContent });
        
        // Execute all tools and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const toolUse of toolUseBlocks) {
          const toolResult = await executeTool(
            toolUse.name,
            toolUse.input,
            dealContext,
            hubspotApiKey,
            sendProgress
          );
          
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: toolResult
          });
        }
        
        // Add ONE user message with ALL tool results
        messages.push({
          role: 'user',
          content: toolResults
        });
      } else if (response.stop_reason === 'end_turn' && assistantContent.length > 0) {
        // No tool calls, just add the assistant response
        messages.push({ role: 'assistant', content: assistantContent });
        isComplete = true;
      }
      
    } catch (error: any) {
      sendProgress({
        type: 'error',
        timestamp: new Date(),
        data: {
          message: `Agent error: ${error.message}`,
          error: error.message,
          iteration: iterations
        }
      });
      
      return {
        success: false,
        error: error.message,
        iterations,
        toolCalls
      };
    }
  }
  
  // If we hit max iterations without completing
  if (!isComplete) {
    sendProgress({
      type: 'error',
      timestamp: new Date(),
      data: {
        message: `Agent reached maximum iterations (${maxIterations}) without completing`,
        iterations,
        toolCalls
      }
    });
    
    return {
      success: false,
      error: `Agent reached maximum iterations (${maxIterations})`,
      iterations,
      toolCalls
    };
  }
  
  // Get final response if we don't have intelligence yet
  if (!finalIntelligence) {
    try {
      const finalResponse = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          ...messages,
          {
            role: 'user',
            content: `Now provide your final deal intelligence analysis in JSON format. Include ALL sections - stakeholder analysis and timeline are REQUIRED:

{
  "healthScore": <number 1-10>,
  "dealStageAnalysis": {
    "hubspotStage": "<current stage from HubSpot>",
    "inferredStage": "<your assessment of actual stage based on evidence>",
    "stageMatch": <true/false - do they match?>,
    "stageConfidence": "<High/Medium/Low>",
    "stageNotes": "<brief explanation if mismatch or low confidence>"
  },
  "stakeholders": [
    {
      "name": "<full name>",
      "title": "<job title>",
      "email": "<email if available>",
      "role": "<Economic Buyer | Technical Evaluator | End User | Champion | Blocker | Influencer | Decision Maker>",
      "influence": "<High | Medium | Low>",
      "interests": ["what they care about"],
      "painPoints": ["problems they've expressed"],
      "engagement": "<High | Medium | Low>",
      "sentiment": "<Positive | Neutral | Concerned | Unknown>",
      "keyNotes": "<important things to remember about this person>"
    }
  ],
  "timeline": [
    {
      "date": "<YYYY-MM-DD or date string>",
      "event": "<description of what happened>",
      "type": "<deal_created | stage_change | meeting | call | email | note | milestone>",
      "significance": "<High | Medium | Low>"
    }
  ],
  "executiveSummary": "<2-3 sentence high-level summary of the deal status and key points>",
  "insights": ["insight 1", "insight 2", ...],
  "recommendedActions": ["action 1", "action 2", ...],
  "riskFactors": ["risk 1", "risk 2", ...],
  "opportunitySignals": ["signal 1", "signal 2", ...],
  "similarDealsAnalysis": "<brief analysis text>",
  "investigationSummary": "<what you investigated and key findings>"
}`
          }
        ]
      });
      
      const textBlock = finalResponse.content.find(b => b.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        try {
          const jsonMatch = textBlock.text.match(/```json\s*([\s\S]*?)```/) || 
                           textBlock.text.match(/\{[\s\S]*"healthScore"[\s\S]*\}/);
          if (jsonMatch) {
            finalIntelligence = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          }
        } catch (e) {
          finalIntelligence = {
            healthScore: 5,
            rawAnalysis: textBlock.text
          };
        }
      }
    } catch (error: any) {
      // Use whatever we have
      finalIntelligence = finalIntelligence || {
        healthScore: 5,
        error: 'Could not generate final analysis'
      };
    }
  }
  
  sendProgress({
    type: 'complete',
    timestamp: new Date(),
    data: {
      message: 'Analysis complete',
      iterations,
      toolCalls,
      intelligence: finalIntelligence
    }
  });
  
  return {
    success: true,
    intelligence: finalIntelligence,
    iterations,
    toolCalls
  };
}


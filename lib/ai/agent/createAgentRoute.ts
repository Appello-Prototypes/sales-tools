/**
 * SSE Streaming Route Helper for Agent APIs
 * 
 * Creates standardized SSE endpoints for AI agent operations.
 * 
 * Usage:
 * ```typescript
 * // In your API route
 * export const GET = createAgentRoute(async (request, params, send) => {
 *   const agent = new AgentEngine(config);
 *   const result = await agent.run(message, context, (progress) => {
 *     send('progress', formatProgress(progress));
 *   });
 *   
 *   if (result.success) {
 *     send('complete', result.output);
 *   } else {
 *     send('error', { message: result.error });
 *   }
 * });
 * ```
 */

import { NextRequest } from 'next/server';

// ============================================================================
// Types
// ============================================================================

export type SSEEventType = 'progress' | 'complete' | 'error' | 'info';

export interface SSESender {
  (event: SSEEventType, data: any): void;
}

export type AgentRouteHandler<TParams = Record<string, string>> = (
  request: NextRequest,
  params: TParams,
  send: SSESender
) => Promise<void>;

export interface ProgressEvent {
  step: string;
  message: string;
  status: 'loading' | 'complete' | 'error' | 'warning' | 'info';
  data?: any;
}

// ============================================================================
// SSE Helpers
// ============================================================================

/**
 * Format a message as an SSE event
 */
function formatSSE(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Create a streaming response with SSE
 */
export function createStreamingResponse(
  handler: (send: SSESender, controller: ReadableStreamDefaultController) => Promise<void>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send: SSESender = (event, data) => {
        controller.enqueue(encoder.encode(formatSSE(event, data)));
      };

      try {
        await handler(send, controller);
      } catch (error: any) {
        send('error', { message: error.message || 'Internal server error' });
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

/**
 * Convert AgentProgress to a ProgressEvent for SSE
 */
export function formatAgentProgress(progress: {
  type: string;
  timestamp: Date;
  data: any;
}): ProgressEvent {
  const timestamp = progress.timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  switch (progress.type) {
    case 'thinking':
      return {
        step: 'agent-thinking',
        message: `🧠 ${progress.data.message}`,
        status: 'info',
        data: progress.data
      };

    case 'tool_call':
      return {
        step: `tool-call-${progress.data.tool}`,
        message: `🔧 Calling tool: ${progress.data.tool}`,
        status: 'loading',
        data: {
          tool: progress.data.tool,
          input: progress.data.input,
          reasoning: progress.data.input?.reasoning
        }
      };

    case 'tool_result':
      return {
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
      };

    case 'response':
      return {
        step: 'agent-response',
        message: `💭 Agent reasoning...`,
        status: 'info',
        data: {
          text: progress.data.text,
          fullText: progress.data.fullText
        }
      };

    case 'error':
      return {
        step: 'agent-error',
        message: `❌ ${progress.data.message}`,
        status: 'error',
        data: progress.data
      };

    case 'complete':
      return {
        step: 'agent-complete',
        message: `✅ Analysis complete (${progress.data.iterations} iterations, ${progress.data.toolCalls} tool calls)`,
        status: 'complete',
        data: progress.data
      };

    default:
      return {
        step: progress.type,
        message: progress.data.message || 'Processing...',
        status: 'info',
        data: progress.data
      };
  }
}

// ============================================================================
// Pre-built Tools
// ============================================================================

import { queryATLAS } from '@/lib/mcp/atlasClient';
import { 
  callHubspotMcpTool, 
  getHubspotMcpTools,
  getHubspotMcpStatus 
} from '@/lib/mcp/hubspotMcpClient';
import {
  scrapeUrl,
  searchWeb,
  mapWebsite,
  getFirecrawlStatus,
} from '@/lib/mcp/firecrawlMcpClient';
import { AgentTool, AgentContext, createMcpTool } from './AgentEngine';

/**
 * Create an ATLAS query tool
 */
export function createAtlasTool(): AgentTool {
  return {
    name: 'query_atlas',
    description: `Search the ATLAS knowledge base for relevant information. ATLAS contains historical data about:
- Previous deals and their outcomes (won/lost, deal sizes, timelines)
- Customer information and company profiles
- Industry insights and market data
- Sales patterns and best practices
- Competitor information

Use this tool to find similar deals, understand customer history, research industry context, or gather any relevant background information.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to send to ATLAS. Be specific and descriptive.'
        }
      },
      required: ['query']
    },
    execute: async (input) => {
      try {
        const result = await queryATLAS(input.query);
        return {
          success: true,
          result: {
            query: input.query,
            results: result.results || [],
            resultCount: result.results?.length || 0
          }
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  };
}

/**
 * Load HubSpot MCP tools dynamically
 */
export async function loadHubspotTools(): Promise<AgentTool[]> {
  const tools: AgentTool[] = [];

  try {
    const status = await getHubspotMcpStatus();
    
    if (!status.connected || !status.tools) {
      console.warn('HubSpot MCP not available:', status.error);
      return tools;
    }

    const mcpTools = await getHubspotMcpTools();
    
    for (const mcpTool of mcpTools) {
      // Skip certain tools
      const skipTools = ['hubspot-generate-feedback-link'];
      if (skipTools.includes(mcpTool.name)) continue;

      tools.push(createMcpTool(
        mcpTool,
        async (input) => {
          const mcpToolName = mcpTool.name;
          const result = await callHubspotMcpTool(mcpToolName, input);
          
          if (result.success) {
            return { success: true, result: result.result };
          } else {
            return { success: false, error: result.error };
          }
        },
        'hubspot'
      ));
    }
  } catch (error: any) {
    console.error('Failed to load HubSpot tools:', error);
  }

  return tools;
}

/**
 * Create Firecrawl tools for web scraping and search
 */
export function createFirecrawlTools(): AgentTool[] {
  return [
    {
      name: 'firecrawl_scrape',
      description: `Scrape a single webpage to extract its content. Use this to:
- Get the full content of a company's website
- Read specific pages like About, Team, Products, Services
- Extract information from any public webpage

Best for: Getting detailed content from a specific URL you already know.
Returns: Markdown content of the page.`,
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to scrape (e.g., "https://example.com/about")'
          },
          onlyMainContent: {
            type: 'boolean',
            description: 'Only extract main content, removing navigation/footer (default: true)'
          }
        },
        required: ['url']
      },
      execute: async (input) => {
        const result = await scrapeUrl(input.url, {
          formats: ['markdown'],
          onlyMainContent: input.onlyMainContent ?? true,
        });
        
        if (result.success) {
          // Extract just the useful content
          const content = result.result?.data?.markdown || result.result?.markdown || result.result;
          return {
            success: true,
            result: {
              url: input.url,
              content: typeof content === 'string' ? content.substring(0, 8000) : content,
              metadata: result.result?.data?.metadata || result.result?.metadata
            }
          };
        }
        return result;
      }
    },
    {
      name: 'firecrawl_search',
      description: `Search the web for information about companies, people, industries, or topics. Use this to:
- Research a company's background, news, and reputation
- Find industry trends and challenges
- Discover recent news or announcements
- Learn about competitors or market conditions

Best for: When you need to find information but don't know specific URLs.
Returns: Search results with snippets and optional full page content.`,
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query (e.g., "Acme Construction company news", "construction industry challenges 2024")'
          },
          limit: {
            type: 'number',
            description: 'Number of results to return (default: 5, max: 10)'
          }
        },
        required: ['query']
      },
      execute: async (input) => {
        const result = await searchWeb(input.query, {
          limit: Math.min(input.limit || 5, 10),
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          }
        });
        
        if (result.success) {
          // Summarize results to avoid token overflow
          const results = result.result?.data || result.result?.results || [];
          const summarized = Array.isArray(results) ? results.slice(0, 5).map((r: any) => ({
            title: r.title,
            url: r.url,
            snippet: r.description || r.snippet || (r.markdown ? r.markdown.substring(0, 500) : ''),
          })) : results;
          
          return {
            success: true,
            result: {
              query: input.query,
              resultCount: Array.isArray(results) ? results.length : 0,
              results: summarized
            }
          };
        }
        return result;
      }
    },
    {
      name: 'firecrawl_map',
      description: `Discover all URLs on a website. Use this to:
- Find all pages on a company's website before scraping specific ones
- Discover blog posts, case studies, or team pages
- Understand the structure of a website

Best for: When you want to know what pages exist on a site before deciding what to read.
Returns: List of URLs found on the site.`,
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The base URL to map (e.g., "https://example.com")'
          },
          search: {
            type: 'string',
            description: 'Optional: Filter URLs containing this text (e.g., "blog", "about", "team")'
          },
          limit: {
            type: 'number',
            description: 'Maximum URLs to return (default: 50, max: 100)'
          }
        },
        required: ['url']
      },
      execute: async (input) => {
        const result = await mapWebsite(input.url, {
          limit: Math.min(input.limit || 50, 100),
          search: input.search,
          includeSubdomains: false,
        });
        
        if (result.success) {
          const links = result.result?.links || result.result?.urls || [];
          return {
            success: true,
            result: {
              baseUrl: input.url,
              urlCount: Array.isArray(links) ? links.length : 0,
              urls: Array.isArray(links) ? links.slice(0, 50) : links
            }
          };
        }
        return result;
      }
    }
  ];
}

/**
 * Load Firecrawl tools if available
 */
export async function loadFirecrawlTools(): Promise<AgentTool[]> {
  try {
    const status = await getFirecrawlStatus();
    
    if (!status.available) {
      console.warn('Firecrawl not available:', status.error);
      return [];
    }
    
    return createFirecrawlTools();
  } catch (error: any) {
    console.error('Failed to load Firecrawl tools:', error);
    return [];
  }
}

/**
 * Get all available agent tools (ATLAS + HubSpot + Firecrawl)
 */
export async function getAllAgentTools(): Promise<AgentTool[]> {
  const atlasTool = createAtlasTool();
  const hubspotTools = await loadHubspotTools();
  const firecrawlTools = await loadFirecrawlTools();
  
  return [atlasTool, ...hubspotTools, ...firecrawlTools];
}


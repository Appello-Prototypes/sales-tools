/**
 * MCP Tools Integration
 * 
 * Server-side wrappers for MCP tools that can be used in Next.js API routes.
 * 
 * Note: MCP tools are configured in Cursor, but for Next.js API routes we need
 * to access them via HTTP endpoints or direct API calls.
 * 
 * For ATLAS: Uses SSE endpoint
 * For Firecrawl: Uses direct API (API key from config)
 * For Google Workspace: May need OAuth setup or use Google APIs directly
 */

import { ATLAS_MCP_ENDPOINT, FIRECRAWL_API_KEY } from '@/lib/config';
import { AuditTrail, addAuditEntry } from './auditTrail';
import { queryATLAS as queryATLASMCPDirect } from '../mcp/atlasClient';

/**
 * Query ATLAS database via MCP (preferred) or HTTP fallback
 * 
 * This function tries to use the MCP SDK first for direct RAG agent access,
 * then falls back to HTTP endpoint if MCP is not available.
 */
export async function queryATLAS(
  query: string, 
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<any> {
  try {
    logCallback?.('info', `      → Attempting ATLAS MCP connection...`);
    const result = await queryATLASMCPDirect(query, auditTrail, logCallback);
    logCallback?.('success', `      ✅ ATLAS MCP query successful`);
    return result;
  } catch (error: any) {
    logCallback?.('warning', `      ⚠️ MCP connection failed, trying HTTP fallback: ${error.message}`);
    console.warn('MCP connection failed, trying HTTP fallback:', error.message);
    
    // Fallback to HTTP endpoint
    return await queryATLASHTTP(query, auditTrail, logCallback);
  }
}

/**
 * Query ATLAS via HTTP endpoint (fallback)
 */
async function queryATLASHTTP(
  query: string, 
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<any> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(ATLAS_MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const duration = Date.now() - startTime;
    const result = await response.json();

    if (!response.ok) {
      const error = `ATLAS query failed: ${response.statusText}`;
      
      if (auditTrail) {
        addAuditEntry(auditTrail, {
          action: 'ATLAS Database Query (HTTP)',
          type: 'atlas_query',
          duration,
          details: {
            query,
            response: {
              success: false,
              error,
            },
          },
        });
      }
      
      throw new Error(error);
    }

    // Track successful query
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'ATLAS Database Query (HTTP)',
        type: 'atlas_query',
        duration,
        details: {
          query,
          response: {
            success: true,
            summary: `Found ${result.results?.length || 0} results`,
          },
          sources: [{
            type: 'atlas',
            description: `ATLAS HTTP query: ${query}`,
            dataSummary: `${result.results?.length || 0} results returned`,
          }],
        },
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'ATLAS Database Query Error',
        type: 'error',
        duration,
        details: {
          query,
          response: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      });
    }
    
    console.error('Error querying ATLAS:', error);
    // Return empty result instead of throwing
    return { results: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Search for similar customers in ATLAS
 */
export async function findSimilarCustomers(
  profile: {
    trade?: string;
    fieldWorkers?: string;
    painPoints?: string[];
  },
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<any[]> {
  const query = `Find customers similar to: trade=${profile.trade}, fieldWorkers=${profile.fieldWorkers}, painPoints=${profile.painPoints?.join(', ')}`;
  const result = await queryATLAS(query, auditTrail, logCallback);
  return result.results || [];
}

/**
 * Scrape URL using Firecrawl API
 */
export async function scrapeWithFirecrawl(
  url: string,
  options?: {
    formats?: ('markdown' | 'html')[];
    onlyMainContent?: boolean;
  },
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<any> {
  const startTime = Date.now();
  
  try {
    const requestBody = {
      url,
      formats: options?.formats || ['markdown'],
      onlyMainContent: options?.onlyMainContent ?? true,
    };
    
    logCallback?.('info', `      → Calling Firecrawl API: POST /v1/scrape`);
    logCallback?.('info', `      → Request Details`, {
      method: 'POST',
      url: 'https://api.firecrawl.dev/v1/scrape',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY.substring(0, 10)}...`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const result = await response.json();

    if (!response.ok) {
      const error = `Firecrawl scrape failed: ${result.error || response.statusText}`;
      
      logCallback?.('error', `      ❌ Firecrawl scrape failed`, {
        status: response.status,
        statusText: response.statusText,
        response: result,
      });
      
      if (auditTrail) {
        addAuditEntry(auditTrail, {
          action: 'Firecrawl Web Scrape',
          type: 'error',
          duration,
          details: {
            url,
            request: requestBody,
            response: {
              success: false,
              error,
              status: response.status,
            },
          },
        });
      }
      
      throw new Error(error);
    }

    // Handle Firecrawl response structure - content might be in result.data or result directly
    const actualResult = result?.data || result;
    const markdown = actualResult?.markdown || result?.markdown || '';
    const content = actualResult?.content || result?.content || '';
    const html = actualResult?.html || result?.html || '';
    
    // If onlyMainContent filtered everything out, try without it or use HTML
    let finalContent = markdown || content;
    if (!finalContent && html) {
      // Fallback: extract text from HTML if markdown is empty
      logCallback?.('warning', `      ⚠️ No markdown content, attempting HTML fallback...`);
      // For now, return HTML - Claude can analyze HTML
      finalContent = html.substring(0, 50000); // Limit HTML size
    }
    
    const contentLength = finalContent.length;
    
    // If still no content, try without onlyMainContent flag
    if (!finalContent && options?.onlyMainContent) {
      logCallback?.('warning', `      ⚠️ Retrying scrape without onlyMainContent filter...`);
      try {
        const retryBody = {
          url,
          formats: options?.formats || ['markdown'],
          onlyMainContent: false, // Try full page
        };
        const retryResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(retryBody),
        });
        const retryResult = await retryResponse.json();
        const retryData = retryResult?.data || retryResult;
        finalContent = retryData?.markdown || retryData?.content || retryData?.html?.substring(0, 50000) || '';
        logCallback?.('info', `      → Retry result: ${finalContent.length} chars`);
      } catch (retryError) {
        logCallback?.('warning', `      ⚠️ Retry failed: ${retryError instanceof Error ? retryError.message : 'Unknown'}`);
      }
    }
    
    const fullResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: {
        ...result,
        markdown: finalContent ? `${finalContent.substring(0, 500)}... (${finalContent.length} chars total)` : undefined,
      },
    };
    
    logCallback?.('success', `      ✅ Firecrawl scrape completed`, {
      url,
      contentLength: finalContent.length,
      duration: `${duration}ms`,
      request: requestBody,
      response: fullResponse,
      hasContent: finalContent.length > 0,
    });
    
    // Track successful scrape
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'Firecrawl Web Scrape',
        type: 'firecrawl_scrape',
        duration,
        details: {
          url,
          response: {
            success: true,
            summary: `Scraped ${url} (${finalContent.length} chars)`,
          },
          sources: [{
            type: 'firecrawl',
            url,
            description: `Scraped content from ${url}`,
          }],
        },
      });
    }

    // Return result with content in expected format
    return {
      ...result,
      markdown: finalContent,
      content: finalContent,
      data: actualResult,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'Firecrawl Web Scrape',
        type: 'error',
        duration,
        details: {
          url,
          response: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      });
    }
    
    console.error('Error scraping with Firecrawl:', error);
    throw error;
  }
}

/**
 * Search web using Firecrawl
 */
export async function searchWithFirecrawl(
  query: string,
  options?: {
    limit?: number;
    sources?: Array<{ type: 'web' | 'images' | 'news' }>;
  },
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Firecrawl v1/search API format - sources is not a valid parameter
    const requestBody: any = {
      query,
      limit: options?.limit || 5,
    };
    
    // Only add sources if it's a valid format (check Firecrawl docs)
    // Note: v1/search doesn't accept sources parameter - it defaults to web search
    // If sources are needed, they should be passed differently or use a different endpoint
    
    logCallback?.('info', `      → Calling Firecrawl API: POST /v1/search`);
    logCallback?.('info', `      → Request Details`, {
      method: 'POST',
      url: 'https://api.firecrawl.dev/v1/search',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY.substring(0, 10)}...`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });
    
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const result = await response.json();

    if (!response.ok) {
      const error = `Firecrawl search failed: ${result.error || response.statusText}`;
      
      logCallback?.('error', `      ❌ Firecrawl search failed`, {
        status: response.status,
        statusText: response.statusText,
        request: requestBody,
        response: result,
      });
      
      if (auditTrail) {
        addAuditEntry(auditTrail, {
          action: 'Firecrawl Web Search',
          type: 'error',
          duration,
          details: {
            query,
            request: requestBody,
            response: {
              success: false,
              error,
              status: response.status,
            },
          },
        });
      }
      
      throw new Error(error);
    }

    const resultCount = result.data?.length || 0;
    const fullResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: {
        ...result,
        data: result.data?.map((r: any) => ({
          ...r,
          description: r.description?.substring(0, 200) + (r.description?.length > 200 ? '...' : ''),
        })) || [],
      },
    };
    
    logCallback?.('success', `      ✅ Firecrawl search completed`, {
      query,
      resultsFound: resultCount,
      duration: `${duration}ms`,
      request: requestBody,
      response: fullResponse,
      topResults: result.data?.slice(0, 3).map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description?.substring(0, 100) + '...',
      })) || [],
    });
    
    // Track successful search
    if (auditTrail) {
      const results = result.data || [];
      addAuditEntry(auditTrail, {
        action: 'Firecrawl Web Search',
        type: 'firecrawl_search',
        duration,
        details: {
          query,
          response: {
            success: true,
            summary: `Found ${results.length} search results`,
          },
          sources: results.slice(0, 5).map((r: any) => ({
            type: 'firecrawl',
            url: r.url,
            description: r.title || r.url,
          })),
        },
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'Firecrawl Web Search',
        type: 'error',
        duration,
        details: {
          query,
          response: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      });
    }
    
    console.error('Error searching with Firecrawl:', error);
    throw error;
  }
}

/**
 * Extract structured data from web pages using Firecrawl
 */
export async function extractWithFirecrawl(
  urls: string[],
  prompt: string,
  schema?: any
): Promise<any> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls,
        prompt,
        schema,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Firecrawl extract failed: ${error.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error extracting with Firecrawl:', error);
    throw error;
  }
}

export default {
  queryATLAS,
  findSimilarCustomers,
  scrapeWithFirecrawl,
  searchWithFirecrawl,
  extractWithFirecrawl,
};


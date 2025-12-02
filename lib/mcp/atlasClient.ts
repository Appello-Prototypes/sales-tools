/**
 * ATLAS MCP Client
 * 
 * Direct connection to ATLAS MCP server using MCP SDK
 * This enables access to your RAG agent with real knowledge
 */

import { findNpx, verifyNpxAvailable } from './findNpx';

// Dynamic import to handle MCP SDK dependency
let Client: any;
let StdioClientTransport: any;

async function loadMCPSDK() {
  if (!Client || !StdioClientTransport) {
    try {
      // Import from the correct SDK paths
      const clientModule = await import('@modelcontextprotocol/sdk/client/index.js');
      const transportModule = await import('@modelcontextprotocol/sdk/client/stdio.js');
      
      Client = clientModule.Client;
      StdioClientTransport = transportModule.StdioClientTransport;
      
      if (!Client || !StdioClientTransport) {
        throw new Error('MCP SDK classes not found in expected locations');
      }
    } catch (error: any) {
      throw new Error(`Failed to load MCP SDK: ${error.message}. Install with: npm install @modelcontextprotocol/sdk`);
    }
  }
  return { Client, StdioClientTransport };
}
import { AuditTrail, addAuditEntry } from '../ai/auditTrail';

let atlasClient: any = null;
let clientInitialized = false;
let initializationPromise: Promise<any> | null = null;

/**
 * Initialize ATLAS MCP client
 */
async function initializeAtlasClient(): Promise<any> {
  // Check if client exists and is still valid
  if (atlasClient && clientInitialized) {
    // Verify client is still connected by checking if it has the necessary methods
    try {
      if (typeof atlasClient.listTools === 'function') {
        return atlasClient;
      }
    } catch (error) {
      // Client is invalid, reset and reinitialize
      console.warn('⚠️ Existing ATLAS client is invalid, reinitializing...');
      atlasClient = null;
      clientInitialized = false;
    }
  }

  // Prevent multiple simultaneous initializations
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Verify npx is available before proceeding
      try {
        verifyNpxAvailable();
      } catch (npxError: any) {
        throw new Error(`npx is not available: ${npxError.message}. MCP clients require npx to be installed and accessible.`);
      }
      
      // Load MCP SDK
      const { Client: ClientClass, StdioClientTransport: TransportClass } = await loadMCPSDK();
      
      // Get ATLAS MCP server command from environment
      // Based on your MCP config: uses supergateway with SSE endpoint
      // Use environment variable if set, otherwise find npx dynamically
      const atlasCommand = process.env.ATLAS_MCP_COMMAND || findNpx();
      const atlasArgs = process.env.ATLAS_MCP_ARGS 
        ? process.env.ATLAS_MCP_ARGS.split(' ')
        : [
            '-y', 
            'supergateway', 
            '--sse', 
            'https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse',
            '--timeout',
            '600000',
            '--keep-alive-timeout',
            '600000',
            '--retry-after-disconnect',
            '--reconnect-interval',
            '1000'
          ];
      
      console.log(`🔄 Initializing ATLAS MCP client: ${atlasCommand} ${atlasArgs.join(' ')}`);
      console.log(`📋 Environment check:`, {
        hasAtlasApiKey: !!process.env.ATLAS_API_KEY,
        hasAtlasEndpoint: !!process.env.ATLAS_ENDPOINT,
        nodeOptions: process.env.NODE_OPTIONS || 'not set',
      });
      
      // Create stdio transport for MCP server
      const transport = new TransportClass({
        command: atlasCommand,
        args: atlasArgs,
        env: {
          ...process.env,
          // Add any ATLAS-specific environment variables
          ATLAS_API_KEY: process.env.ATLAS_API_KEY,
          ATLAS_ENDPOINT: process.env.ATLAS_ENDPOINT,
          // supergateway may need NODE_OPTIONS (from your mcp.json)
          NODE_OPTIONS: process.env.NODE_OPTIONS || '',
        },
      });
      
      console.log(`🔌 Created transport, attempting connection...`);

      // Create MCP client
      const client = new ClientClass({
        name: 'appello-assessment',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      // Connect to server (connect() handles initialization automatically)
      // Add timeout to detect if connection hangs
      const connectPromise = client.connect(transport);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
      });
      
      try {
        await Promise.race([connectPromise, timeoutPromise]);
        
        // Verify connection is working by attempting to list tools
        // This ensures the server is actually responding
        try {
          const testTools = await client.listTools();
          console.log(`✅ ATLAS MCP connected - ${testTools.tools?.length || 0} tools available`);
        } catch (verifyError: any) {
          console.error('❌ ATLAS MCP connection verification failed:', verifyError);
          throw new Error(`Connection established but server not responding: ${verifyError.message}`);
        }
      } catch (connectError: any) {
        // If connection fails, try to get more details
        console.error('❌ ATLAS MCP connection error details:', {
          message: connectError.message,
          code: connectError.code,
          name: connectError.name,
        });
        throw connectError;
      }
      
      console.log('✅ ATLAS MCP client initialized successfully');
      
      atlasClient = client;
      clientInitialized = true;
      initializationPromise = null;
      
      return client;
    } catch (error: any) {
      console.error('❌ Failed to initialize ATLAS MCP client:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      initializationPromise = null;
      clientInitialized = false;
      atlasClient = null;
      
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message?.includes('Connection closed') || error.code === -32000) {
        errorMessage = `Connection closed - The MCP server process exited immediately. This may indicate: 1) The server command failed to start, 2) Missing dependencies, 3) Network/endpoint issues, or 4) Configuration errors. Check server logs for details. Original error: ${error.message}`;
      } else if (error.message?.includes('spawn') || error.message?.includes('ENOENT')) {
        errorMessage = `Cannot find MCP server command. Ensure '${atlasCommand}' is available in PATH or set ATLAS_MCP_COMMAND environment variable. Original error: ${error.message}`;
      }
      
      throw new Error(`ATLAS MCP initialization failed: ${errorMessage}`);
    }
  })();

  return initializationPromise;
}

/**
 * Query ATLAS database using MCP
 */
export async function queryATLAS(
  query: string, 
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<any> {
  const startTime = Date.now();
  
  try {
    logCallback?.('info', `      → Initializing ATLAS MCP client...`);
    // Initialize client if needed
    const client = await initializeAtlasClient();
    
    logCallback?.('info', `      → Listing available MCP tools...`);
    // List available tools
    const toolsResponse = await client.listTools();
    const tools = toolsResponse.tools || [];
    
    const toolNames = tools.map((t: any) => t.name).join(', ');
    logCallback?.('info', `      → Available tools: ${toolNames || 'none'}`);
    console.log(`🔍 ATLAS MCP tools available: ${toolNames}`);
    
    // Find the query tool (try multiple naming patterns)
    const queryTool = tools.find(
      (tool: any) => 
        tool.name === 'query' || 
        tool.name === 'query_atlas' || 
        tool.name === 'Query_ATLAS' ||
        tool.name === 'mcp_ATLAS_Query_ATLAS' ||
        tool.name.toLowerCase().includes('query') ||
        tool.name.toLowerCase().includes('atlas')
    );
    
    if (!queryTool) {
      const availableTools = tools.map((t: any) => t.name).join(', ');
      logCallback?.('error', `      ❌ ATLAS query tool not found. Available: ${availableTools || 'none'}`);
      throw new Error(`ATLAS query tool not found. Available tools: ${availableTools || 'none'}`);
    }
    
    logCallback?.('info', `      → Using ATLAS tool: ${queryTool.name}`);
    console.log(`✅ Using ATLAS tool: ${queryTool.name}`);
    
    // Call the query tool
    // MCP tools use different argument structures - try both
    const mcpRequest = {
      name: queryTool.name,
      arguments: {
        query: query,
      },
    };
    
    logCallback?.('info', `      → Calling MCP tool: ${queryTool.name}`);
    logCallback?.('info', `      → MCP Request`, {
      tool: queryTool.name,
      method: 'tools/call',
      arguments: mcpRequest.arguments,
      queryPreview: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    });
    
    let result;
    try {
      result = await client.callTool(mcpRequest);
    } catch (error: any) {
      logCallback?.('warning', `      ⚠️ First attempt failed, trying alternative format...`);
      logCallback?.('warning', `      → Error: ${error.message}`);
      
      // Try alternative argument format
      const altRequest = {
        name: queryTool.name,
        arguments: query, // Some tools accept query directly
      };
      
      logCallback?.('info', `      → Retrying with alternative format`, {
        tool: queryTool.name,
        method: 'tools/call',
        arguments: query,
      });
      
      try {
        result = await client.callTool(altRequest);
      } catch (error2: any) {
        logCallback?.('error', `      ❌ Both formats failed`, {
          firstError: error.message,
          secondError: error2.message,
          request: mcpRequest,
          altRequest: altRequest,
        });
        throw new Error(`Failed to call ATLAS tool: ${error.message}. Alternative format also failed: ${error2.message}`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Parse result - MCP tools return content array
    let parsedResult;
    if (Array.isArray(result.content)) {
      // MCP format: [{ type: 'text', text: '...' }]
      const textContent = result.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('');
      
      try {
        parsedResult = JSON.parse(textContent);
      } catch {
        // If not JSON, treat as text result
        parsedResult = { 
          results: textContent ? [{ content: textContent, source: 'ATLAS MCP' }] : [],
          raw: textContent,
        };
      }
    } else if (typeof result.content === 'string') {
      try {
        parsedResult = JSON.parse(result.content);
      } catch {
        parsedResult = { 
          results: [{ content: result.content, source: 'ATLAS MCP' }],
          raw: result.content,
        };
      }
    } else {
      parsedResult = result.content || result;
      // Ensure results array exists
      if (!parsedResult.results && parsedResult) {
        parsedResult = { results: Array.isArray(parsedResult) ? parsedResult : [parsedResult] };
      }
    }
    
    const resultCount = parsedResult.results?.length || parsedResult.length || 0;
    const resultSummary = resultCount > 0 
      ? `Found ${resultCount} results. First: ${JSON.stringify(parsedResult.results?.[0] || parsedResult[0] || {}).substring(0, 150)}...`
      : 'No results found';
    
    const mcpResponse = {
      tool: queryTool.name,
      content: Array.isArray(result.content) 
        ? result.content.map((item: any) => ({
            type: item.type,
            text: item.type === 'text' ? item.text.substring(0, 500) + (item.text.length > 500 ? '...' : '') : item.text,
            fullLength: item.type === 'text' ? item.text.length : 0,
          }))
        : result.content,
      parsed: {
        resultCount,
        hasResults: resultCount > 0,
        firstResultPreview: parsedResult.results?.[0] ? JSON.stringify(parsedResult.results[0]).substring(0, 300) + '...' : null,
      },
    };
    
    logCallback?.('success', `      ✅ ATLAS query completed`, {
      resultCount,
      summary: resultSummary,
      duration: `${Date.now() - startTime}ms`,
      request: mcpRequest,
      response: mcpResponse,
      parsedResults: parsedResult,
    });
    
    // Track successful query
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'ATLAS Database Query (MCP)',
        type: 'atlas_query',
        duration,
        details: {
          query,
          tool: queryTool.name,
          response: {
            success: true,
            summary: `Found ${resultCount} results`,
          },
          sources: [{
            type: 'atlas',
            description: `ATLAS MCP query: ${query}`,
            dataSummary: `${resultCount} results returned`,
          }],
        } as any,
      });
    }
    
    return {
      results: parsedResult.results || parsedResult,
      success: true,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Track error
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'ATLAS Database Query Error',
        type: 'error',
        duration,
        details: {
          query,
          response: {
            success: false,
            error: error.message,
          },
        } as any,
      });
    }
    
    console.error('Error querying ATLAS via MCP:', error);
    
    // Fallback: Try HTTP endpoint if MCP fails
    return await queryATLASFallback(query, auditTrail);
  }
}

/**
 * Fallback: Query ATLAS via HTTP endpoint
 */
async function queryATLASFallback(query: string, auditTrail?: AuditTrail): Promise<any> {
  const startTime = Date.now();
  
  try {
    const { ATLAS_MCP_ENDPOINT } = await import('../config');
    
    if (!ATLAS_MCP_ENDPOINT) {
      throw new Error('No ATLAS endpoint configured');
    }
    
    const response = await fetch(ATLAS_MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`ATLAS HTTP fallback failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'ATLAS Database Query (HTTP Fallback)',
        type: 'atlas_query',
        duration,
        details: {
          query,
          response: {
            success: true,
            summary: `Found ${result.results?.length || 0} results`,
          },
        } as any,
      });
    }
    
    return result;
  } catch (error: any) {
    console.error('ATLAS HTTP fallback also failed:', error);
    return { results: [], error: error.message };
  }
}

/**
 * Close ATLAS client connection
 */
export async function closeAtlasClient(): Promise<void> {
  if (atlasClient) {
    try {
      await atlasClient.close();
      atlasClient = null;
      clientInitialized = false;
      console.log('✅ ATLAS MCP client closed');
    } catch (error) {
      console.error('Error closing ATLAS client:', error);
    }
  }
}

/**
 * Get ATLAS client status
 */
export async function getAtlasStatus(): Promise<{
  connected: boolean;
  available: boolean;
  tools?: string[];
  error?: string;
  sdkInstalled?: boolean;
  npxAvailable?: boolean;
  npxPath?: string;
}> {
  try {
    // Check if SDK is installed
    try {
      await loadMCPSDK();
    } catch (sdkError: any) {
      return {
        connected: false,
        available: false,
        sdkInstalled: false,
        error: `MCP SDK not installed: ${sdkError.message}`,
      };
    }
    
    // Check npx availability
    let npxAvailable = false;
    let npxPath = '';
    try {
      const { findNpx, verifyNpxAvailable } = await import('./findNpx');
      verifyNpxAvailable();
      npxPath = findNpx();
      npxAvailable = true;
    } catch (npxError: any) {
      return {
        connected: false,
        available: false,
        sdkInstalled: true,
        npxAvailable: false,
        error: `npx not available: ${npxError.message}`,
      };
    }
    
    const client = await initializeAtlasClient();
    const tools = await client.listTools();
    
    return {
      connected: true,
      available: true,
      sdkInstalled: true,
      npxAvailable: true,
      npxPath,
      tools: tools.tools.map((t: any) => t.name),
    };
  } catch (error: any) {
    return {
      connected: false,
      available: false,
      sdkInstalled: true,
      error: error.message,
    };
  }
}


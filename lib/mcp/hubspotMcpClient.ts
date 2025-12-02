/**
 * HubSpot MCP Client
 * 
 * Connects to the official HubSpot MCP server to give the AI agent
 * flexible access to HubSpot CRM data and operations.
 * Uses locally installed @hubspot/mcp-server package when available.
 */

import { findNpx, verifyNpxAvailable } from './findNpx';
import { HUBSPOT_API_TOOLS } from '@/lib/hubspot/apiClient';

// Dynamic import to handle MCP SDK dependency
let Client: any;
let StdioClientTransport: any;

async function loadMCPSDK() {
  if (!Client || !StdioClientTransport) {
    try {
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

let hubspotClient: any = null;
let clientInitialized = false;
let initializationPromise: Promise<any> | null = null;
let availableTools: any[] = [];

/**
 * Initialize HubSpot MCP client
 */
async function initializeHubspotClient(): Promise<any> {
  // HubSpot MCP server (@hubspot/mcp-server) only supports stdio transport
  // This requires spawning a process via npx, which we'll attempt even in serverless
  // If it fails, we'll provide clear error messages

  // Check if client exists and is still valid
  if (hubspotClient && clientInitialized) {
    // Verify client is still connected by checking if it has the necessary methods
    try {
      if (typeof hubspotClient.listTools === 'function') {
        return hubspotClient;
      }
    } catch (error) {
      // Client is invalid, reset and reinitialize
      console.warn('⚠️ Existing HubSpot client is invalid, reinitializing...');
      hubspotClient = null;
      clientInitialized = false;
      availableTools = [];
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
      
      const { Client: ClientClass, StdioClientTransport: TransportClass } = await loadMCPSDK();
      
      // Get HubSpot MCP server configuration
      // Try to use locally installed package first (faster, more reliable in serverless)
      // Fall back to npx -y if not installed
      let hubspotCommand: string;
      let hubspotArgs: string[];
      
      if (process.env.HUBSPOT_MCP_COMMAND) {
        // Use explicit command from environment
        hubspotCommand = process.env.HUBSPOT_MCP_COMMAND;
        hubspotArgs = process.env.HUBSPOT_MCP_ARGS 
          ? process.env.HUBSPOT_MCP_ARGS.split(' ')
          : ['-y', '@hubspot/mcp-server'];
      } else {
        // Try to find locally installed @hubspot/mcp-server first
        // This avoids downloading the package in serverless environments
        try {
          // Use require.resolve to find the package (works in both dev and production)
          const packagePath = require.resolve('@hubspot/mcp-server/package.json');
          const { resolve, dirname } = require('path');
          const packageDir = dirname(packagePath);
          const mainFile = resolve(packageDir, 'dist', 'index.js');
          const { existsSync } = require('fs');
          
          if (existsSync(mainFile)) {
            // Use node to run the locally installed package directly
            console.log(`   → Found locally installed @hubspot/mcp-server, using direct path`);
            hubspotCommand = process.execPath; // Use node
            hubspotArgs = [mainFile];
          } else {
            // Fall back to npx -y (will download on first use)
            console.log(`   → @hubspot/mcp-server main file not found, using npx -y`);
            hubspotCommand = findNpx();
            hubspotArgs = ['-y', '@hubspot/mcp-server'];
          }
        } catch (error: any) {
          // If we can't resolve the package, fall back to npx
          console.log(`   → Could not resolve @hubspot/mcp-server package (${error.message}), using npx -y`);
          hubspotCommand = findNpx();
          hubspotArgs = ['-y', '@hubspot/mcp-server'];
        }
      }
      
      const accessToken = process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN || 
                          process.env.PRIVATE_APP_ACCESS_TOKEN ||
                          process.env.HUBSPOT_API_KEY;
      
      if (!accessToken) {
        throw new Error('HubSpot access token not configured. Set HUBSPOT_PRIVATE_APP_ACCESS_TOKEN in environment.');
      }
      
      console.log(`🔄 Initializing HubSpot MCP client: ${hubspotCommand} ${hubspotArgs.join(' ')}`);
      console.log(`📋 Environment check:`, {
        hasAccessToken: !!accessToken,
        tokenLength: accessToken?.length || 0,
        tokenPrefix: accessToken?.substring(0, 10) + '...' || 'none',
        commandPath: hubspotCommand,
        args: hubspotArgs,
        isServerless: !!(process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_TARGET),
        nodeVersion: process.version,
        platform: process.platform,
      });
      
      // Create stdio transport for MCP server
      // Match Cursor config exactly: command is npx path, args are ['-y', '@hubspot/mcp-server']
      const transport = new TransportClass({
        command: hubspotCommand,
        args: hubspotArgs,
        env: {
          ...process.env,
          PRIVATE_APP_ACCESS_TOKEN: accessToken, // Must match exactly what Cursor uses
        },
      });
      
      console.log(`🔌 Created transport, attempting connection...`);
      console.log(`   → Command: ${hubspotCommand}`);
      console.log(`   → Args: ${JSON.stringify(hubspotArgs)}`);
      console.log(`   → Env: PRIVATE_APP_ACCESS_TOKEN=${accessToken ? accessToken.substring(0, 10) + '...' : 'NOT SET'}`);

      // Create MCP client
      const client = new ClientClass({
        name: 'sales-tools-agent',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      // Connect to server with timeout
      // Note: StdioClientTransport will spawn the process and handle stdio communication
      console.log(`   → Starting connection (this will spawn: ${hubspotCommand} ${hubspotArgs.join(' ')})...`);
      
      const connectPromise = client.connect(transport);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
      });
      
      try {
        await Promise.race([connectPromise, timeoutPromise]);
        console.log(`   → Connection established, verifying...`);
        
        // Verify connection is working by attempting to list tools
        // This ensures the server is actually responding
        const toolsResponse = await client.listTools();
        availableTools = toolsResponse.tools || [];
        
        if (availableTools.length === 0) {
          console.warn('⚠️ HubSpot MCP connected but no tools available');
        } else {
          console.log(`✅ HubSpot MCP connected - ${availableTools.length} tools available`);
          console.log(`📦 Available tools: ${availableTools.map((t: any) => t.name).join(', ')}`);
        }
      } catch (connectError: any) {
        // If connection fails, try to get more details
        console.error('❌ HubSpot MCP connection error details:', {
          message: connectError.message,
          code: connectError.code,
          name: connectError.name,
          stack: connectError.stack?.split('\n').slice(0, 5).join('\n'),
        });
        
        // Check if this is a serverless environment issue
        const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_TARGET;
        if (isServerless && (connectError.message?.includes('Connection closed') || connectError.code === -32000)) {
          console.error('⚠️ Serverless environment detected - child process spawning may be restricted');
          console.error('   → HubSpot MCP requires spawning @hubspot/mcp-server via npx');
          console.error('   → Vercel serverless functions may not allow long-running child processes');
        }
        
        throw connectError;
      }
      
      console.log('✅ HubSpot MCP client initialized successfully');
      
      hubspotClient = client;
      clientInitialized = true;
      initializationPromise = null;
      
      return client;
    } catch (error: any) {
      console.error('❌ Failed to initialize HubSpot MCP client:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      initializationPromise = null;
      clientInitialized = false;
      hubspotClient = null;
      availableTools = [];
      
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message?.includes('Connection closed') || error.code === -32000) {
        errorMessage = `Connection closed - The MCP server process exited immediately. This may indicate: 1) The server command failed to start, 2) Missing dependencies (try: npm install -g @hubspot/mcp-server), 3) Invalid access token, or 4) Network issues. Check server logs for details. Original error: ${error.message}`;
      } else if (error.message?.includes('spawn') || error.message?.includes('ENOENT')) {
        errorMessage = `Cannot find MCP server command. Ensure '${hubspotCommand}' is available in PATH or set HUBSPOT_MCP_COMMAND environment variable. Original error: ${error.message}`;
      } else if (error.message?.includes('access token')) {
        errorMessage = `HubSpot authentication failed. Verify HUBSPOT_PRIVATE_APP_ACCESS_TOKEN is set correctly. Original error: ${error.message}`;
      }
      
      throw new Error(`HubSpot MCP initialization failed: ${errorMessage}`);
    }
  })();

  return initializationPromise;
}

/**
 * Get API-based tool definitions (fallback when MCP isn't available)
 */
function getApiBasedToolDefinitions(): any[] {
  return [
    {
      name: 'hubspot-get-user-details',
      description: 'Get current HubSpot user details, hub ID, and authorized scopes',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'hubspot-list-objects',
      description: 'List HubSpot objects (contacts, companies, deals, etc.) with pagination',
      inputSchema: {
        type: 'object',
        properties: {
          objectType: { type: 'string', description: 'Object type: contacts, companies, deals, tickets, etc.' },
          limit: { type: 'number', description: 'Max results (default: 100, max: 100)' },
          after: { type: 'string', description: 'Pagination cursor' },
          properties: { type: 'array', items: { type: 'string' }, description: 'Properties to return' },
          associations: { type: 'array', items: { type: 'string' }, description: 'Associations to include' },
          archived: { type: 'boolean', description: 'Include archived objects' }
        },
        required: ['objectType']
      }
    },
    {
      name: 'hubspot-search-objects',
      description: 'Search HubSpot objects with filters and query',
      inputSchema: {
        type: 'object',
        properties: {
          objectType: { type: 'string', description: 'Object type to search' },
          query: { type: 'string', description: 'Text search query' },
          filterGroups: { type: 'array', description: 'Filter groups for advanced filtering' },
          properties: { type: 'array', items: { type: 'string' }, description: 'Properties to return' },
          limit: { type: 'number', description: 'Max results (default: 10, max: 100)' },
          after: { type: 'string', description: 'Pagination cursor' },
          sorts: { type: 'array', description: 'Sort criteria' }
        },
        required: ['objectType']
      }
    },
    {
      name: 'hubspot-batch-read-objects',
      description: 'Get multiple HubSpot objects by their IDs',
      inputSchema: {
        type: 'object',
        properties: {
          objectType: { type: 'string', description: 'Object type' },
          inputs: { type: 'array', items: { type: 'object' }, description: 'Array of object IDs to read' },
          properties: { type: 'array', items: { type: 'string' }, description: 'Properties to return' },
          propertiesWithHistory: { type: 'array', items: { type: 'string' }, description: 'Properties with history' }
        },
        required: ['objectType', 'inputs']
      }
    },
    {
      name: 'hubspot-list-associations',
      description: 'Get associations between HubSpot objects (e.g., contacts for a company)',
      inputSchema: {
        type: 'object',
        properties: {
          objectType: { type: 'string', description: 'Source object type' },
          objectId: { type: 'string', description: 'Source object ID' },
          toObjectType: { type: 'string', description: 'Target object type' },
          after: { type: 'string', description: 'Pagination cursor' }
        },
        required: ['objectType', 'objectId', 'toObjectType']
      }
    },
    {
      name: 'hubspot-list-properties',
      description: 'List all properties for a HubSpot object type',
      inputSchema: {
        type: 'object',
        properties: {
          objectType: { type: 'string', description: 'Object type' },
          archived: { type: 'boolean', description: 'Include archived properties' },
          includeHidden: { type: 'boolean', description: 'Include hidden properties' }
        },
        required: ['objectType']
      }
    },
    {
      name: 'hubspot-get-property',
      description: 'Get details about a specific HubSpot property',
      inputSchema: {
        type: 'object',
        properties: {
          objectType: { type: 'string', description: 'Object type' },
          propertyName: { type: 'string', description: 'Property name' }
        },
        required: ['objectType', 'propertyName']
      }
    },
    {
      name: 'hubspot-batch-create-objects',
      description: 'Create multiple HubSpot objects in a single request',
      inputSchema: {
        type: 'object',
        properties: {
          objectType: { type: 'string', description: 'Object type' },
          inputs: { type: 'array', items: { type: 'object' }, description: 'Array of objects to create' }
        },
        required: ['objectType', 'inputs']
      }
    },
    {
      name: 'hubspot-batch-update-objects',
      description: 'Update multiple HubSpot objects in a single request',
      inputSchema: {
        type: 'object',
        properties: {
          objectType: { type: 'string', description: 'Object type' },
          inputs: { type: 'array', items: { type: 'object' }, description: 'Array of objects to update' }
        },
        required: ['objectType', 'inputs']
      }
    },
    {
      name: 'hubspot-create-engagement',
      description: 'Create a note or task engagement in HubSpot',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['NOTE', 'TASK'], description: 'Engagement type' },
          ownerId: { type: 'number', description: 'Owner ID' },
          associations: { type: 'object', description: 'Associated records' },
          metadata: { type: 'object', description: 'Engagement metadata' }
        },
        required: ['type', 'ownerId', 'associations', 'metadata']
      }
    },
    {
      name: 'hubspot-get-association-definitions',
      description: 'Get valid association types between object types',
      inputSchema: {
        type: 'object',
        properties: {
          fromObjectType: { type: 'string', description: 'Source object type' },
          toObjectType: { type: 'string', description: 'Target object type' }
        },
        required: ['fromObjectType', 'toObjectType']
      }
    },
    {
      name: 'hubspot-batch-create-associations',
      description: 'Create multiple associations between objects',
      inputSchema: {
        type: 'object',
        properties: {
          fromObjectType: { type: 'string', description: 'Source object type' },
          toObjectType: { type: 'string', description: 'Target object type' },
          types: { type: 'array', description: 'Association types' },
          inputs: { type: 'array', description: 'Array of associations to create' }
        },
        required: ['fromObjectType', 'toObjectType', 'types', 'inputs']
      }
    }
  ];
}

/**
 * Get list of available HubSpot MCP tools
 * Falls back to API-based tools if MCP isn't available
 */
export async function getHubspotMcpTools(): Promise<any[]> {
  try {
    // Try to get MCP tools first
    await initializeHubspotClient();
    if (availableTools.length > 0) {
      return availableTools;
    }
  } catch (error) {
    console.log('⚠️ HubSpot MCP not available, using API-based tools');
  }
  
  // Fall back to API-based tool definitions
  return getApiBasedToolDefinitions();
}

/**
 * Call a HubSpot MCP tool
 * Falls back to API-based implementation if MCP isn't available
 */
export async function callHubspotMcpTool(
  toolName: string,
  toolInput: any
): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // First, try MCP if available
    try {
      const client = await initializeHubspotClient();
      
      // Verify tool exists in MCP
      const tool = availableTools.find((t: any) => t.name === toolName);
      if (tool) {
        console.log(`🔧 Calling HubSpot MCP tool: ${toolName}`);
        
        // Call the MCP tool
        const result = await client.callTool({
          name: toolName,
          arguments: toolInput
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ HubSpot MCP tool '${toolName}' completed in ${duration}ms`);
        
        // Parse result
        let parsedResult;
        if (Array.isArray(result.content)) {
          const textContent = result.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('');
          
          try {
            parsedResult = JSON.parse(textContent);
          } catch {
            parsedResult = { raw: textContent };
          }
        } else if (typeof result.content === 'string') {
          try {
            parsedResult = JSON.parse(result.content);
          } catch {
            parsedResult = { raw: result.content };
          }
        } else {
          parsedResult = result.content || result;
        }
        
        return {
          success: true,
          result: parsedResult
        };
      }
    } catch (mcpError: any) {
      // MCP failed, fall through to API
      console.log(`⚠️ HubSpot MCP unavailable, using API for ${toolName}`);
    }
    
    // Fall back to API-based implementation
    console.log(`🔧 Calling HubSpot API tool: ${toolName}`);
    
    const apiFunction = HUBSPOT_API_TOOLS[toolName];
    if (!apiFunction) {
      const availableTools = Object.keys(HUBSPOT_API_TOOLS);
      return {
        success: false,
        error: `Tool '${toolName}' not found. Available: ${availableTools.join(', ')}`
      };
    }
    
    const result = await apiFunction(toolInput);
    const duration = Date.now() - startTime;
    console.log(`✅ HubSpot API tool '${toolName}' completed in ${duration}ms`);
    
    return {
      success: true,
      result: result
    };
  } catch (error: any) {
    console.error(`❌ HubSpot tool '${toolName}' failed:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Convert HubSpot MCP tools to Anthropic tool format
 */
export async function getHubspotToolsForAgent(): Promise<any[]> {
  const mcpTools = await getHubspotMcpTools();
  
  // Convert MCP tool definitions to Anthropic format
  return mcpTools.map((tool: any) => ({
    name: `hubspot_${tool.name}`,
    description: tool.description || `HubSpot tool: ${tool.name}`,
    input_schema: tool.inputSchema || {
      type: 'object',
      properties: {},
      required: []
    }
  }));
}

/**
 * Get HubSpot MCP client status
 */
export async function getHubspotMcpStatus(): Promise<{
  connected: boolean;
  available: boolean;
  toolCount?: number;
  tools?: string[];
  error?: string;
  npxAvailable?: boolean;
  npxPath?: string;
  serverless?: boolean;
}> {
  // Note: HubSpot MCP requires stdio transport (spawning @hubspot/mcp-server via npx)
  // We'll attempt this even in serverless - if it fails, the error will indicate why
  
  try {
    // Check npx availability first
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
        npxAvailable: false,
        error: `npx not available: ${npxError.message}`,
      };
    }
    
    await initializeHubspotClient();
    
    return {
      connected: true,
      available: true,
      npxAvailable: true,
      npxPath,
      toolCount: availableTools.length,
      tools: availableTools.map((t: any) => t.name)
    };
  } catch (error: any) {
    return {
      connected: false,
      available: false,
      error: error.message
    };
  }
}

/**
 * Close HubSpot MCP client connection
 */
export async function closeHubspotClient(): Promise<void> {
  if (hubspotClient) {
    try {
      await hubspotClient.close();
      hubspotClient = null;
      clientInitialized = false;
      availableTools = [];
      console.log('✅ HubSpot MCP client closed');
    } catch (error) {
      console.error('Error closing HubSpot client:', error);
    }
  }
}


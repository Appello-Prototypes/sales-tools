/**
 * HubSpot MCP Client
 * 
 * Connects to the official HubSpot MCP server to give the AI agent
 * flexible access to HubSpot CRM data and operations.
 */

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
  if (hubspotClient && clientInitialized) {
    return hubspotClient;
  }

  // Prevent multiple simultaneous initializations
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const { Client: ClientClass, StdioClientTransport: TransportClass } = await loadMCPSDK();
      
      // Get HubSpot MCP server configuration
      const hubspotCommand = process.env.HUBSPOT_MCP_COMMAND || '/Users/coreyshelson/.nvm/versions/node/v24.11.1/bin/npx';
      const hubspotArgs = process.env.HUBSPOT_MCP_ARGS 
        ? process.env.HUBSPOT_MCP_ARGS.split(' ')
        : ['-y', '@hubspot/mcp-server'];
      
      const accessToken = process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN || 
                          process.env.PRIVATE_APP_ACCESS_TOKEN ||
                          process.env.HUBSPOT_API_KEY;
      
      if (!accessToken) {
        throw new Error('HubSpot access token not configured. Set HUBSPOT_PRIVATE_APP_ACCESS_TOKEN in environment.');
      }
      
      console.log(`🔄 Initializing HubSpot MCP client: ${hubspotCommand} ${hubspotArgs.join(' ')}`);
      
      // Create stdio transport for MCP server
      const transport = new TransportClass({
        command: hubspotCommand,
        args: hubspotArgs,
        env: {
          ...process.env,
          PRIVATE_APP_ACCESS_TOKEN: accessToken,
        },
      });

      // Create MCP client
      const client = new ClientClass({
        name: 'sales-tools-agent',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      // Connect to server
      await client.connect(transport);
      
      // List available tools
      const toolsResponse = await client.listTools();
      availableTools = toolsResponse.tools || [];
      
      console.log(`✅ HubSpot MCP client initialized with ${availableTools.length} tools`);
      console.log(`📦 Available tools: ${availableTools.map((t: any) => t.name).join(', ')}`);
      
      hubspotClient = client;
      clientInitialized = true;
      initializationPromise = null;
      
      return client;
    } catch (error: any) {
      console.error('❌ Failed to initialize HubSpot MCP client:', error);
      initializationPromise = null;
      throw new Error(`HubSpot MCP initialization failed: ${error.message}`);
    }
  })();

  return initializationPromise;
}

/**
 * Get list of available HubSpot MCP tools
 */
export async function getHubspotMcpTools(): Promise<any[]> {
  try {
    await initializeHubspotClient();
    return availableTools;
  } catch (error) {
    console.error('Failed to get HubSpot MCP tools:', error);
    return [];
  }
}

/**
 * Call a HubSpot MCP tool
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
    const client = await initializeHubspotClient();
    
    // Verify tool exists
    const tool = availableTools.find((t: any) => t.name === toolName);
    if (!tool) {
      const availableNames = availableTools.map((t: any) => t.name).join(', ');
      return {
        success: false,
        error: `Tool '${toolName}' not found. Available: ${availableNames}`
      };
    }
    
    console.log(`🔧 Calling HubSpot MCP tool: ${toolName}`);
    
    // Call the tool
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
  } catch (error: any) {
    console.error(`❌ HubSpot MCP tool '${toolName}' failed:`, error);
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
}> {
  try {
    await initializeHubspotClient();
    
    return {
      connected: true,
      available: true,
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


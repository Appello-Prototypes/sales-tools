import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { 
  ANTHROPIC_API_KEY, 
  ATLAS_MCP_ENDPOINT, 
  FIRECRAWL_API_KEY, 
  ATLAS_MCP_COMMAND, 
  ATLAS_MCP_ARGS 
} from '@/lib/config';
import { getAtlasStatus } from '@/lib/mcp/atlasClient';
import { getHubspotMcpStatus } from '@/lib/mcp/hubspotMcpClient';

interface IntegrationStatus {
  id: string;
  name: string;
  category: 'ai' | 'crm' | 'mcp' | 'database' | 'communication' | 'other';
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  configured: boolean;
  lastChecked?: Date;
  details?: {
    endpoint?: string;
    apiKeyPresent?: boolean;
    error?: string;
    [key: string]: any;
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrations: IntegrationStatus[] = [];

    // Anthropic / Claude AI
    try {
      const hasKey = !!ANTHROPIC_API_KEY;
      integrations.push({
        id: 'anthropic',
        name: 'Anthropic Claude AI',
        category: 'ai',
        status: hasKey ? 'connected' : 'disconnected',
        configured: hasKey,
        lastChecked: new Date(),
        details: {
          apiKeyPresent: hasKey,
          endpoint: 'api.anthropic.com',
          model: 'claude-sonnet-4-5-20250929',
        },
      });
    } catch (error: any) {
      integrations.push({
        id: 'anthropic',
        name: 'Anthropic Claude AI',
        category: 'ai',
        status: 'error',
        configured: false,
        details: { error: error.message },
      });
    }

    // HubSpot CRM
    try {
      const hubspotKey = 
        process.env.HUBSPOT_API_KEY || 
        process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
        process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
        process.env.HUBSPOT_ACCESS_TOKEN;
      
      const hasKey = !!hubspotKey;
      
      // Test connection if key exists
      let connectionStatus: 'connected' | 'disconnected' | 'error' = hasKey ? 'connected' : 'disconnected';
      let testError: string | undefined;
      
      if (hasKey) {
        try {
          const testResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=1', {
            headers: {
              'Authorization': `Bearer ${hubspotKey}`,
            },
          });
          if (!testResponse.ok) {
            connectionStatus = 'error';
            testError = `API returned ${testResponse.status}`;
          }
        } catch (error: any) {
          connectionStatus = 'error';
          testError = error.message;
        }
      }
      
      integrations.push({
        id: 'hubspot',
        name: 'HubSpot CRM',
        category: 'crm',
        status: connectionStatus,
        configured: hasKey,
        lastChecked: new Date(),
        details: {
          apiKeyPresent: hasKey,
          endpoint: 'api.hubapi.com',
          error: testError,
        },
      });
    } catch (error: any) {
      integrations.push({
        id: 'hubspot',
        name: 'HubSpot CRM',
        category: 'crm',
        status: 'error',
        configured: false,
        details: { error: error.message },
      });
    }

    // ATLAS MCP
    try {
      const atlasStatus = await getAtlasStatus();
      const hasConfig = !!(ATLAS_MCP_COMMAND && ATLAS_MCP_ARGS);
      
      integrations.push({
        id: 'atlas',
        name: 'ATLAS MCP',
        category: 'mcp',
        status: atlasStatus.connected && atlasStatus.available ? 'connected' : hasConfig ? 'error' : 'disconnected',
        configured: hasConfig,
        lastChecked: new Date(),
        details: {
          endpoint: ATLAS_MCP_ENDPOINT,
          command: ATLAS_MCP_COMMAND,
          connected: atlasStatus.connected,
          available: atlasStatus.available,
          tools: atlasStatus.tools || [],
          error: atlasStatus.error,
        },
      });
    } catch (error: any) {
      integrations.push({
        id: 'atlas',
        name: 'ATLAS MCP',
        category: 'mcp',
        status: 'error',
        configured: !!(ATLAS_MCP_COMMAND && ATLAS_MCP_ARGS),
        details: { error: error.message },
      });
    }

    // HubSpot MCP
    try {
      const hubspotMcpStatus = await getHubspotMcpStatus();
      
      // If MCP connected successfully, it's configured (token may be in mcp.json, not env vars)
      const isConnected = hubspotMcpStatus.connected && hubspotMcpStatus.available;
      const isConfigured = isConnected || !!(
        process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN || 
        process.env.PRIVATE_APP_ACCESS_TOKEN
      );
      
      integrations.push({
        id: 'hubspot-mcp',
        name: 'HubSpot MCP',
        category: 'mcp',
        status: isConnected ? 'connected' : isConfigured ? 'error' : 'disconnected',
        configured: isConfigured,
        lastChecked: new Date(),
        details: {
          endpoint: 'npx @hubspot/mcp-server',
          connected: hubspotMcpStatus.connected,
          available: hubspotMcpStatus.available,
          toolCount: hubspotMcpStatus.toolCount || 0,
          tools: hubspotMcpStatus.tools || [],
          error: hubspotMcpStatus.error,
        },
      });
    } catch (error: any) {
      integrations.push({
        id: 'hubspot-mcp',
        name: 'HubSpot MCP',
        category: 'mcp',
        status: 'error',
        configured: !!(process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN || process.env.PRIVATE_APP_ACCESS_TOKEN),
        details: { error: error.message },
      });
    }

    // Firecrawl
    try {
      const hasKey = !!FIRECRAWL_API_KEY;
      integrations.push({
        id: 'firecrawl',
        name: 'Firecrawl',
        category: 'other',
        status: hasKey ? 'connected' : 'disconnected',
        configured: hasKey,
        lastChecked: new Date(),
        details: {
          apiKeyPresent: hasKey,
          endpoint: 'api.firecrawl.dev',
        },
      });
    } catch (error: any) {
      integrations.push({
        id: 'firecrawl',
        name: 'Firecrawl',
        category: 'other',
        status: 'error',
        configured: false,
        details: { error: error.message },
      });
    }

    // MongoDB
    try {
      const { default: connectDB } = await import('@/lib/mongodb');
      await connectDB();
      integrations.push({
        id: 'mongodb',
        name: 'MongoDB Database',
        category: 'database',
        status: 'connected',
        configured: !!process.env.MONGODB_URI,
        lastChecked: new Date(),
        details: {
          endpoint: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
        },
      });
    } catch (error: any) {
      integrations.push({
        id: 'mongodb',
        name: 'MongoDB Database',
        category: 'database',
        status: 'error',
        configured: !!process.env.MONGODB_URI,
        details: { error: error.message },
      });
    }

    // Google OAuth (Gmail)
    try {
      const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
      const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
      integrations.push({
        id: 'google',
        name: 'Google OAuth (Gmail)',
        category: 'communication',
        status: (hasClientId && hasClientSecret) ? 'connected' : 'disconnected',
        configured: hasClientId && hasClientSecret,
        lastChecked: new Date(),
        details: {
          clientIdPresent: hasClientId,
          clientSecretPresent: hasClientSecret,
          endpoint: 'accounts.google.com',
        },
      });
    } catch (error: any) {
      integrations.push({
        id: 'google',
        name: 'Google OAuth (Gmail)',
        category: 'communication',
        status: 'error',
        configured: false,
        details: { error: error.message },
      });
    }

    // Slack (placeholder for future)
    integrations.push({
      id: 'slack',
      name: 'Slack',
      category: 'communication',
      status: 'disconnected',
      configured: false,
      details: {
        message: 'Coming soon',
      },
    });

    return NextResponse.json({
      integrations,
      summary: {
        total: integrations.length,
        connected: integrations.filter(i => i.status === 'connected').length,
        disconnected: integrations.filter(i => i.status === 'disconnected').length,
        errors: integrations.filter(i => i.status === 'error').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error checking integrations:', error);
    return NextResponse.json(
      { error: 'Failed to check integrations', details: error.message },
      { status: 500 }
    );
  }
}


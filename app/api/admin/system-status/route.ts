import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { ANTHROPIC_API_KEY, ATLAS_MCP_ENDPOINT, FIRECRAWL_API_KEY, ATLAS_MCP_COMMAND, ATLAS_MCP_ARGS } from '@/lib/config';
import { getAtlasStatus } from '@/lib/mcp/atlasClient';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const connections = [];
    
    // Check MongoDB
    try {
      const { default: connectDB } = await import('@/lib/mongodb');
      await connectDB();
      connections.push({
        name: 'MongoDB Database',
        type: 'database',
        status: 'connected',
        endpoint: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
        lastChecked: new Date(),
      });
    } catch (error: any) {
      connections.push({
        name: 'MongoDB Database',
        type: 'database',
        status: 'error',
        endpoint: process.env.MONGODB_URI || 'Not configured',
        lastChecked: new Date(),
        details: { error: error.message },
      });
    }
    
    // Check Anthropic API
    connections.push({
      name: 'Anthropic Claude API',
      type: 'api',
      status: ANTHROPIC_API_KEY ? 'connected' : 'disconnected',
      endpoint: 'api.anthropic.com',
      lastChecked: new Date(),
      details: {
        model: 'claude-sonnet-4-5-20250929',
        thinkingMode: 'enabled',
        budgetTokens: 16384,
      },
    });
    
    // Check ATLAS MCP (try direct MCP connection first)
    try {
      const atlasStatus = await getAtlasStatus();
      
      if (atlasStatus.connected && atlasStatus.available) {
        connections.push({
          name: 'ATLAS Database (MCP - Direct)',
          type: 'mcp',
          status: 'connected',
          endpoint: `${ATLAS_MCP_COMMAND} ${ATLAS_MCP_ARGS}`,
          lastChecked: new Date(),
          details: {
            connection: 'Direct MCP via SDK',
            tools: atlasStatus.tools || [],
            ragEnabled: true,
          },
        });
      } else {
        // Try HTTP fallback
        try {
          const response = await fetch(ATLAS_MCP_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'test connection' }),
          });
          connections.push({
            name: 'ATLAS Database (MCP - HTTP Fallback)',
            type: 'mcp',
            status: response.ok ? 'connected' : 'error',
            endpoint: ATLAS_MCP_ENDPOINT,
            lastChecked: new Date(),
            details: {
              connection: 'HTTP endpoint',
              status: response.ok ? 'OK' : response.statusText,
              ragEnabled: false,
            },
          });
        } catch (httpError: any) {
          connections.push({
            name: 'ATLAS Database (MCP)',
            type: 'mcp',
            status: 'error',
            endpoint: `${ATLAS_MCP_COMMAND} ${ATLAS_MCP_ARGS}`,
            lastChecked: new Date(),
            details: {
              error: atlasStatus.error || httpError.message,
              mcpError: atlasStatus.error,
              httpError: httpError.message,
            },
          });
        }
      }
    } catch (error: any) {
      connections.push({
        name: 'ATLAS Database (MCP)',
        type: 'mcp',
        status: 'error',
        endpoint: `${ATLAS_MCP_COMMAND} ${ATLAS_MCP_ARGS}`,
        lastChecked: new Date(),
        details: { error: error.message },
      });
    }
    
    // Check Firecrawl API
    connections.push({
      name: 'Firecrawl API',
      type: 'api',
      status: FIRECRAWL_API_KEY ? 'connected' : 'disconnected',
      endpoint: 'api.firecrawl.dev',
      lastChecked: new Date(),
      details: FIRECRAWL_API_KEY ? { apiKey: 'Configured' } : { apiKey: 'Not configured' },
    });
    
    return NextResponse.json({
      connections,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error checking system status:', error);
    return NextResponse.json(
      { error: 'Failed to check system status', details: error.message },
      { status: 500 }
    );
  }
}


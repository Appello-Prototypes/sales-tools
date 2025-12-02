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

export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integrationId } = await request.json();

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
    }

    const testResults: any = {
      integrationId,
      success: false,
      message: '',
      details: {},
      timestamp: new Date().toISOString(),
    };

    switch (integrationId) {
      case 'anthropic': {
        if (!ANTHROPIC_API_KEY) {
          testResults.message = 'API key not configured';
          testResults.details = { configured: false };
          return NextResponse.json(testResults);
        }

        try {
          // Test Anthropic API with a simple request
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }],
            }),
          });

          if (response.ok) {
            testResults.success = true;
            testResults.message = 'Connection successful';
            testResults.details = { status: response.status };
          } else {
            const errorData = await response.json().catch(() => ({}));
            testResults.message = `API returned ${response.status}`;
            testResults.details = { status: response.status, error: errorData };
          }
        } catch (error: any) {
          testResults.message = `Connection failed: ${error.message}`;
          testResults.details = { error: error.message };
        }
        break;
      }

      case 'hubspot': {
        const hubspotKey = 
          process.env.HUBSPOT_API_KEY || 
          process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
          process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
          process.env.HUBSPOT_ACCESS_TOKEN;

        if (!hubspotKey) {
          testResults.message = 'API key not configured';
          testResults.details = { configured: false };
          return NextResponse.json(testResults);
        }

        try {
          const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=1', {
            headers: {
              'Authorization': `Bearer ${hubspotKey}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            testResults.success = true;
            testResults.message = 'Connection successful';
            testResults.details = { 
              status: response.status,
              dealsFound: data.results?.length || 0,
            };
          } else {
            const errorText = await response.text();
            testResults.message = `API returned ${response.status}`;
            testResults.details = { status: response.status, error: errorText };
          }
        } catch (error: any) {
          testResults.message = `Connection failed: ${error.message}`;
          testResults.details = { error: error.message };
        }
        break;
      }

      case 'atlas': {
        try {
          const atlasStatus = await getAtlasStatus();
          if (atlasStatus.connected && atlasStatus.available) {
            testResults.success = true;
            testResults.message = 'MCP connection successful';
            testResults.details = {
              connected: true,
              available: true,
              tools: atlasStatus.tools || [],
            };
          } else {
            testResults.message = atlasStatus.error || 'MCP connection failed';
            testResults.details = {
              connected: atlasStatus.connected,
              available: atlasStatus.available,
              error: atlasStatus.error,
            };
          }
        } catch (error: any) {
          testResults.message = `Connection failed: ${error.message}`;
          testResults.details = { error: error.message };
        }
        break;
      }

      case 'hubspot-mcp': {
        try {
          const hubspotMcpStatus = await getHubspotMcpStatus();
          if (hubspotMcpStatus.connected && hubspotMcpStatus.available) {
            testResults.success = true;
            testResults.message = 'HubSpot MCP connection successful';
            testResults.details = {
              connected: true,
              available: true,
              toolCount: hubspotMcpStatus.toolCount || 0,
              tools: hubspotMcpStatus.tools || [],
            };
          } else {
            testResults.message = hubspotMcpStatus.error || 'HubSpot MCP connection failed';
            testResults.details = {
              connected: hubspotMcpStatus.connected,
              available: hubspotMcpStatus.available,
              error: hubspotMcpStatus.error,
            };
          }
        } catch (error: any) {
          testResults.message = `Connection failed: ${error.message}`;
          testResults.details = { error: error.message };
        }
        break;
      }

      case 'firecrawl': {
        if (!FIRECRAWL_API_KEY) {
          testResults.message = 'API key not configured';
          testResults.details = { configured: false };
          return NextResponse.json(testResults);
        }

        try {
          const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: 'https://example.com',
            }),
          });

          if (response.ok) {
            testResults.success = true;
            testResults.message = 'Connection successful';
            testResults.details = { status: response.status };
          } else {
            const errorData = await response.json().catch(() => ({}));
            testResults.message = `API returned ${response.status}`;
            testResults.details = { status: response.status, error: errorData };
          }
        } catch (error: any) {
          testResults.message = `Connection failed: ${error.message}`;
          testResults.details = { error: error.message };
        }
        break;
      }

      case 'mongodb': {
        try {
          const { default: connectDB } = await import('@/lib/mongodb');
          await connectDB();
          testResults.success = true;
          testResults.message = 'Database connection successful';
          testResults.details = { connected: true };
        } catch (error: any) {
          testResults.message = `Connection failed: ${error.message}`;
          testResults.details = { error: error.message };
        }
        break;
      }

      case 'google': {
        const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
        const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;

        if (!hasClientId || !hasClientSecret) {
          testResults.message = 'OAuth credentials not fully configured';
          testResults.details = { 
            clientIdPresent: hasClientId,
            clientSecretPresent: hasClientSecret,
          };
          return NextResponse.json(testResults);
        }

        // For OAuth, we can't fully test without user interaction
        // Just verify credentials are present
        testResults.success = true;
        testResults.message = 'OAuth credentials configured (requires user authorization to fully test)';
        testResults.details = {
          clientIdPresent: true,
          clientSecretPresent: true,
          note: 'Full connection requires user OAuth flow',
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown integration: ${integrationId}` },
          { status: 400 }
        );
    }

    return NextResponse.json(testResults);
  } catch (error: any) {
    console.error('Error testing integration:', error);
    return NextResponse.json(
      { error: 'Failed to test integration', details: error.message },
      { status: 500 }
    );
  }
}


/**
 * Configuration for MCP tools and external services
 * 
 * Note: MCP tools are configured in Cursor, but for Next.js API routes
 * we may need to access them differently. This file centralizes configuration.
 */

// ATLAS MCP Configuration
// Based on your MCP server config: uses supergateway with SSE endpoint
export const ATLAS_MCP_COMMAND = process.env.ATLAS_MCP_COMMAND || 'npx';
export const ATLAS_MCP_ARGS = process.env.ATLAS_MCP_ARGS || 
  '-y supergateway --sse https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse --timeout 600000 --keep-alive-timeout 600000 --retry-after-disconnect --reconnect-interval 1000';
export const ATLAS_API_KEY = process.env.ATLAS_API_KEY;
export const ATLAS_ENDPOINT = process.env.ATLAS_ENDPOINT;

// For HTTP fallback (same SSE endpoint):
export const ATLAS_MCP_ENDPOINT = process.env.ATLAS_MCP_ENDPOINT || 
  'https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse';

export const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 
  'fc-a263c08d924a40929e8ca0a9d886008f';

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.warn('⚠️ ANTHROPIC_API_KEY not set. AI features will not work.');
} else {
  console.log('✅ Anthropic API key configured');
}


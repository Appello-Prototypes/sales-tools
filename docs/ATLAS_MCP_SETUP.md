# ATLAS MCP Setup Guide

## Overview

ATLAS MCP provides direct access to your RAG (Retrieval-Augmented Generation) agent with real knowledge from your database. This enables the assessment system to query your actual customer data, case studies, and business intelligence.

## Connection Methods

### Method 1: Direct MCP Connection (Preferred) ✅

Direct connection using MCP SDK for full RAG agent access.

**Setup:**

1. **Install MCP SDK:**
   ```bash
   npm install @modelcontextprotocol/sdk
   ```

2. **Configure Environment Variables:**
   Add to `.env.local`:
   ```bash
   # ATLAS MCP Configuration (Direct Connection)
   # Uses supergateway to connect to SSE endpoint (matches your Cursor MCP config)
   ATLAS_MCP_COMMAND=npx
   ATLAS_MCP_ARGS=-y supergateway --sse https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse --timeout 600000 --keep-alive-timeout 600000 --retry-after-disconnect --reconnect-interval 1000
   
   # ATLAS API credentials (if required)
   ATLAS_API_KEY=your_atlas_api_key
   ATLAS_ENDPOINT=https://your-atlas-endpoint.com
   ```

3. **How It Works:**
   - The system spawns the MCP server via NPX
   - Connects using stdio transport
   - Accesses your RAG agent directly
   - Queries your actual knowledge base

### Method 2: HTTP Endpoint (Fallback)

If MCP connection fails, falls back to HTTP endpoint.

**Setup:**

Add to `.env.local`:
```bash
ATLAS_MCP_ENDPOINT=https://your-atlas-endpoint.com/mcp/endpoint
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ATLAS_MCP_COMMAND` | Command to run MCP server | `npx` |
| `ATLAS_MCP_ARGS` | Arguments for MCP server | `-y @modelcontextprotocol/server-atlas` |
| `ATLAS_API_KEY` | ATLAS API key (if required) | - |
| `ATLAS_ENDPOINT` | ATLAS endpoint URL (if required) | - |
| `ATLAS_MCP_ENDPOINT` | HTTP fallback endpoint | N8N endpoint |

### Custom ATLAS MCP Server

If you have a custom ATLAS MCP server:

```bash
ATLAS_MCP_COMMAND=npx
ATLAS_MCP_ARGS=-y @your-org/atlas-mcp-server
```

Or if it's a local package:

```bash
ATLAS_MCP_COMMAND=node
ATLAS_MCP_ARGS=./node_modules/@your-org/atlas-mcp-server/dist/index.js
```

## Testing Connection

### Via Admin Dashboard

1. Go to `/admin/analytics`
2. Click "System Connections" tab
3. Check ATLAS status:
   - ✅ **Connected** = MCP working
   - ⚠️ **HTTP Fallback** = Using HTTP endpoint
   - ❌ **Error** = Check configuration

### Via API

```bash
curl http://localhost:3000/api/admin/system-status
```

Look for `ATLAS Database (MCP)` in the connections array.

## Troubleshooting

### Issue: "MCP initialization failed"

**Solutions:**
1. Check if `@modelcontextprotocol/sdk` is installed:
   ```bash
   npm install @modelcontextprotocol/sdk
   ```

2. Verify ATLAS MCP server package exists:
   ```bash
   npx -y @modelcontextprotocol/server-atlas --help
   ```

3. Check environment variables are set correctly

4. Check server logs for detailed error messages

### Issue: "ATLAS query tool not found"

**Solutions:**
1. Verify your ATLAS MCP server exposes a query tool
2. Check tool name matches expected patterns:
   - `query`
   - `query_atlas`
   - `Query_ATLAS`
   - Or contains "query" in name

3. Check server logs to see available tools

### Issue: "Connection timeout"

**Solutions:**
1. Ensure ATLAS MCP server starts quickly
2. Check if server requires additional setup
3. Consider using HTTP fallback if MCP is slow

## Benefits of Direct MCP Connection

✅ **Direct RAG Access**: Query your actual knowledge base
✅ **Real-time Data**: Always current information
✅ **Better Performance**: No HTTP overhead
✅ **Full Feature Access**: All MCP tools available
✅ **Better Error Handling**: Direct connection diagnostics

## Usage in Code

The system automatically uses MCP connection when available:

```typescript
import { queryATLAS } from '@/lib/ai/mcpTools';

// This will try MCP first, then HTTP fallback
const results = await queryATLAS('Find similar customers', auditTrail);
```

## Next Steps

1. **Install MCP SDK**: `npm install @modelcontextprotocol/sdk`
2. **Configure Environment**: Add ATLAS variables to `.env.local`
3. **Test Connection**: Check system status in admin dashboard
4. **Verify Queries**: Create a test assessment and check audit trail

## Support

If you need help configuring your specific ATLAS MCP server, check:
- Your ATLAS MCP server documentation
- MCP protocol specification
- Server logs for connection details


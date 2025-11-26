# MCP Server Configuration

## Overview

This document shows how the assessment system connects to your MCP servers, matching your Cursor MCP configuration exactly.

## Your MCP Server Setup

Based on your `~/.cursor/mcp.json`:

### Firecrawl MCP
```json
{
  "command": "npx",
  "args": ["-y", "firecrawl-mcp"],
  "env": {
    "FIRECRAWL_API_KEY": "fc-a263c08d924a40929e8ca0a9d886008f"
  }
}
```

**Note:** The assessment system uses Firecrawl's direct API (not MCP) since we have the API key. This is more efficient for server-side use.

### ATLAS MCP
```json
{
  "command": "npx",
  "args": [
    "-y",
    "supergateway",
    "--sse",
    "https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse",
    "--timeout",
    "600000",
    "--keep-alive-timeout",
    "600000",
    "--retry-after-disconnect",
    "--reconnect-interval",
    "1000"
  ],
  "env": {
    "NODE_OPTIONS": ""
  }
}
```

**Key Points:**
- Uses `supergateway` as a gateway/proxy to your SSE endpoint
- Connects to your N8N MCP endpoint
- Has extended timeouts (600 seconds) for long-running queries
- Includes retry and reconnect logic

## Assessment System Configuration

### Environment Variables

Add to `.env.local`:

```bash
# ATLAS MCP Configuration (matches your mcp.json exactly)
ATLAS_MCP_COMMAND=npx
ATLAS_MCP_ARGS=-y supergateway --sse https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse --timeout 600000 --keep-alive-timeout 600000 --retry-after-disconnect --reconnect-interval 1000

# Firecrawl API (direct API, not MCP - more efficient)
FIRECRAWL_API_KEY=fc-a263c08d924a40929e8ca0a9d886008f

# HTTP Fallback for ATLAS (same SSE endpoint)
ATLAS_MCP_ENDPOINT=https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse
```

## How It Works

### ATLAS Connection Flow

1. **MCP SDK Initialization:**
   - Loads `@modelcontextprotocol/sdk`
   - Creates stdio transport

2. **Spawn supergateway:**
   - Runs: `npx -y supergateway --sse <your-endpoint> ...`
   - supergateway acts as a proxy to your SSE endpoint

3. **Connect to Your RAG Agent:**
   - supergateway connects to your N8N MCP endpoint
   - Provides access to your ATLAS knowledge base
   - Queries your actual customer data, case studies, transcripts

4. **Query Execution:**
   - System calls MCP tools via supergateway
   - Queries are sent to your ATLAS database
   - Results come back through the MCP protocol

### Firecrawl Usage

The system uses Firecrawl's direct API (not MCP) because:
- ✅ More efficient for server-side use
- ✅ No need to spawn additional processes
- ✅ Direct API access is faster
- ✅ We have the API key

## Testing Connection

1. **Check System Status:**
   - Go to `/admin/analytics`
   - Click "System Connections" tab
   - Look for "ATLAS Database (MCP - Direct)"
   - Should show "connected" ✅

2. **Create Test Assessment:**
   - Use "Create Test Assessment (with Live Logs)"
   - Watch the logs for:
     ```
     → Initializing ATLAS MCP client: npx -y supergateway ...
     → Listing available MCP tools...
     → Available tools: query_atlas, search_atlas, ...
     → Using ATLAS tool: query_atlas
     → Calling MCP tool with query: "..."
     ✅ ATLAS query completed
     ```

## Troubleshooting

### Issue: "supergateway not found"

**Solution:**
```bash
# Test if supergateway is available
npx -y supergateway --help
```

### Issue: "ATLAS query tool not found"

**Check:**
1. supergateway is connecting to your SSE endpoint
2. Your N8N MCP endpoint is accessible
3. Server logs show available tools

**Debug:**
The logs will show:
```
→ Available tools: tool1, tool2, ...
```

### Issue: Connection timeout

**Check:**
1. Your N8N endpoint is accessible
2. Network connectivity
3. Timeout settings (600000ms = 10 minutes)

## Benefits

✅ **Matches Your Cursor Config**: Uses exact same setup as Cursor
✅ **Direct RAG Access**: Queries your actual knowledge base
✅ **Real Customer Data**: Uses actual similar customers, case studies
✅ **Meeting Transcripts**: Access Fathom transcripts from ATLAS
✅ **Business Intelligence**: Real insights from your database


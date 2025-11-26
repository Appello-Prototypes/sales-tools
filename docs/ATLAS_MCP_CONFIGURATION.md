# ATLAS MCP Configuration Guide

## Overview

ATLAS MCP provides direct access to your RAG (Retrieval-Augmented Generation) agent, enabling the assessment system to query your actual customer data, case studies, meeting transcripts, and business intelligence stored in ATLAS.

## Why Direct MCP Connection?

✅ **Real Knowledge Access**: Query your actual database, not just HTTP endpoints
✅ **Better Performance**: Direct connection, no HTTP overhead  
✅ **Full RAG Capabilities**: Access to semantic search, vector queries, and intelligent retrieval
✅ **Real-time Data**: Always current information from your knowledge base

## Setup Instructions

### Step 1: Install MCP SDK

```bash
cd appello-assessment
npm install @modelcontextprotocol/sdk
```

### Step 2: Configure Your ATLAS MCP Server

Add to `.env.local`:

```bash
# ATLAS MCP Configuration (Direct Connection)
# Matches your Cursor MCP config: uses supergateway with SSE endpoint
ATLAS_MCP_COMMAND=npx

# Arguments for the MCP server (matches your mcp.json config)
ATLAS_MCP_ARGS=-y supergateway --sse https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse --timeout 600000 --keep-alive-timeout 600000 --retry-after-disconnect --reconnect-interval 1000

# ATLAS API credentials (if your MCP server requires them)
ATLAS_API_KEY=your_atlas_api_key_here
ATLAS_ENDPOINT=https://your-atlas-endpoint.com

# HTTP Fallback (optional - used if MCP connection fails)
ATLAS_MCP_ENDPOINT=https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse
```

### Step 3: Verify Connection

1. **Check System Status:**
   - Go to `/admin/analytics`
   - Click "System Connections" tab
   - Look for "ATLAS Database (MCP - Direct)"
   - Status should show "connected" ✅

2. **Check Server Logs:**
   When you create a test assessment, you should see:
   ```
   🔄 Initializing ATLAS MCP client: npx -y @modelcontextprotocol/server-atlas
   ✅ ATLAS MCP client initialized successfully
   🔍 ATLAS MCP tools available: query, query_atlas, ...
   ✅ Using ATLAS tool: query_atlas
   ```

## Finding Your ATLAS MCP Server Command

### If Using Cursor's MCP Configuration

Check your Cursor MCP configuration file (usually `~/.cursor/mcp.json` or similar):

```json
{
  "mcpServers": {
    "atlas": {
      "command": "npx",
      "args": ["-y", "@your-org/atlas-mcp-server"],
      "env": {
        "ATLAS_API_KEY": "...",
        "ATLAS_ENDPOINT": "..."
      }
    }
  }
}
```

Copy the `command` and `args` values to your `.env.local`:
```bash
ATLAS_MCP_COMMAND=npx
ATLAS_MCP_ARGS=-y @your-org/atlas-mcp-server
```

### If Using Custom MCP Server

If you have a custom ATLAS MCP server:

1. **Find the package name:**
   ```bash
   npm search atlas mcp
   ```

2. **Or if it's a local package:**
   ```bash
   ATLAS_MCP_COMMAND=node
   ATLAS_MCP_ARGS=./path/to/atlas-mcp-server/dist/index.js
   ```

## How It Works

1. **On First Query:**
   - System spawns your ATLAS MCP server via NPX
   - Connects using stdio transport
   - Lists available tools
   - Finds the query tool

2. **On Each Query:**
   - Calls the ATLAS MCP tool with your query
   - Receives results from your RAG agent
   - Parses and returns data
   - Tracks in audit trail

3. **Fallback:**
   - If MCP connection fails, automatically falls back to HTTP endpoint
   - Logs the fallback in audit trail
   - Continues processing without errors

## Troubleshooting

### Issue: "MCP SDK not installed"

**Solution:**
```bash
npm install @modelcontextprotocol/sdk
```

### Issue: "ATLAS query tool not found"

**Check:**
1. Your MCP server is running correctly
2. The server exposes a query tool
3. Tool name matches expected patterns (query, query_atlas, Query_ATLAS)

**Debug:**
Check server logs - it will show available tools:
```
🔍 ATLAS MCP tools available: tool1, tool2, ...
```

### Issue: "Failed to initialize ATLAS MCP client"

**Check:**
1. `ATLAS_MCP_COMMAND` is correct (usually `npx`)
2. `ATLAS_MCP_ARGS` points to valid package
3. Package is installable: `npx -y <your-package>` works
4. Environment variables are set if required

**Test manually:**
```bash
npx -y @your-atlas-mcp-server
```

### Issue: Connection works but queries return empty

**Check:**
1. ATLAS API credentials are correct
2. ATLAS endpoint is accessible
3. Your knowledge base has data
4. Query format matches what ATLAS expects

## Benefits for Assessment System

With direct MCP connection, the system can:

1. **Query Real Customer Data:**
   - Find actual similar customers from your database
   - Use real case studies and success stories
   - Access actual meeting transcripts and insights

2. **Intelligent Matching:**
   - Semantic search for similar companies
   - Vector similarity for pain points
   - Context-aware recommendations

3. **Real-time Intelligence:**
   - Always current data
   - No stale information
   - Direct access to your RAG agent

## Next Steps

1. Configure your ATLAS MCP server command
2. Test connection in admin dashboard
3. Create a test assessment
4. Check audit trail to see ATLAS queries
5. Verify results are from your actual knowledge base

## Support

If you need help:
1. Check server logs for detailed error messages
2. Verify MCP server configuration
3. Test MCP server manually with NPX
4. Check audit trail for query details


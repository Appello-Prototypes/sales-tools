# MCP Production Requirements

## Overview

This document outlines the requirements for running MCP (Model Context Protocol) integrations in production environments.

## Required Dependencies

### Node.js and npm/npx

MCP clients require Node.js and `npx` to be available. The system will automatically find `npx` using the following strategies:

1. **Environment Variable**: If `HUBSPOT_MCP_COMMAND`, `ATLAS_MCP_COMMAND`, or `NPX_COMMAND` is set, it will be used
2. **Relative to Node.js**: Finds `npx` in the same directory as the Node.js executable
3. **System PATH**: Uses `which npx` to find `npx` in the system PATH
4. **Fallback**: Falls back to `'npx'` (must be in PATH)

### MCP SDK

The `@modelcontextprotocol/sdk` package is already included in `package.json`:

```json
"@modelcontextprotocol/sdk": "^1.22.0"
```

### MCP Server Packages

The following packages are downloaded automatically via `npx -y` when needed:

- **HubSpot MCP**: `@hubspot/mcp-server` (downloaded on-demand)
- **ATLAS MCP**: `supergateway` (downloaded on-demand)

These packages don't need to be pre-installed as dependencies since `npx -y` handles them automatically.

## Production Environment Setup

### Vercel / Serverless Environments

For Vercel and similar serverless platforms:

1. **Node.js Version**: Ensure your deployment uses Node.js 18+ (Vercel defaults to Node.js 18+)
2. **Build Command**: Standard Next.js build (`npm run build`)
3. **Environment Variables**: Set the following:

```bash
# HubSpot MCP (optional - will auto-detect npx if not set)
HUBSPOT_MCP_COMMAND=npx
HUBSPOT_MCP_ARGS=-y @hubspot/mcp-server
HUBSPOT_PRIVATE_APP_ACCESS_TOKEN=your_token_here

# ATLAS MCP (optional - will auto-detect npx if not set)
ATLAS_MCP_COMMAND=npx
ATLAS_MCP_ARGS=-y supergateway --sse https://useappello.app.n8n.cloud/mcp/dfbad0dd-acf3-4796-ab7a-87fdd03f51a8/sse --timeout 600000 --keep-alive-timeout 600000 --retry-after-disconnect --reconnect-interval 1000
ATLAS_API_KEY=your_key_here

# Or set a custom NPX path if needed
NPX_COMMAND=/usr/local/bin/npx
```

### Docker Environments

For Docker deployments:

1. **Base Image**: Use a Node.js base image that includes npm/npx:
   ```dockerfile
   FROM node:20-alpine
   # or
   FROM node:20
   ```

2. **Verify npx**: Ensure `npx` is available:
   ```dockerfile
   RUN which npx || (echo "npx not found" && exit 1)
   ```

3. **Environment Variables**: Same as Vercel setup above

### Traditional Server Deployments

For traditional server deployments (VPS, EC2, etc.):

1. **Install Node.js**: Ensure Node.js 18+ is installed with npm
2. **Verify npx**: `which npx` should return a path
3. **Set Environment Variables**: Same as above

## Troubleshooting

### Error: "spawn npx ENOENT"

This error means `npx` cannot be found. Solutions:

1. **Set NPX_COMMAND explicitly**:
   ```bash
   export NPX_COMMAND=$(which npx)
   ```

2. **Verify Node.js installation**:
   ```bash
   node --version
   npm --version
   which npx
   ```

3. **Install npm/npx** (if missing):
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install npm
   
   # On macOS with Homebrew
   brew install node
   ```

### Error: "ATLAS MCP initialization failed: Connection closed"

This is typically a network/endpoint issue, not an `npx` issue. Check:

1. **ATLAS Endpoint**: Verify the SSE endpoint URL is correct
2. **Network Access**: Ensure the server can reach the endpoint
3. **Timeout Settings**: Increase timeout values if needed

### Error: "HubSpot MCP initialization failed"

Check:

1. **Access Token**: Verify `HUBSPOT_PRIVATE_APP_ACCESS_TOKEN` is set
2. **Network**: Ensure server can reach npm registry to download `@hubspot/mcp-server`
3. **npx Path**: Verify `npx` is found (see above)

## Testing in Production

After deployment, test MCP connections:

1. **Check Integration Status**: Visit `/admin/system-settings/integrations`
2. **Review Logs**: Check server logs for MCP initialization messages
3. **Test Functionality**: Use features that depend on MCP (e.g., ATLAS queries, HubSpot operations)

## Performance Considerations

- **First Connection**: First MCP connection may be slower as `npx -y` downloads packages
- **Caching**: Subsequent connections reuse downloaded packages
- **Timeouts**: ATLAS MCP has extended timeouts (600s) for long-running queries
- **Connection Pooling**: MCP clients maintain persistent connections when possible

## Security Notes

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Use secure environment variable management
- **Network**: MCP connections use stdio transport (local process communication)
- **Package Downloads**: `npx -y` downloads packages from npm registry - ensure network security


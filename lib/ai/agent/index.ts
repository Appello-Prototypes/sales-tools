/**
 * AI Agent Framework
 * 
 * A reusable agentic AI engine that supports:
 * - Dynamic tool loading from MCP servers
 * - Real-time progress streaming via SSE
 * - Full audit trail transparency
 * - Configurable system prompts and output schemas
 * 
 * @example
 * ```typescript
 * import { 
 *   AgentEngine, 
 *   createAtlasTool, 
 *   loadHubspotTools,
 *   formatAgentProgress 
 * } from '@/lib/ai/agent';
 * 
 * // 1. Create tools
 * const tools = [createAtlasTool(), ...(await loadHubspotTools())];
 * 
 * // 2. Create agent
 * const agent = new AgentEngine({
 *   name: 'deal-analyzer',
 *   systemPrompt: 'You are a sales intelligence analyst...',
 *   tools,
 * });
 * 
 * // 3. Run with progress streaming
 * const result = await agent.run(
 *   'Analyze this deal...',
 *   { dealId: '123' },
 *   (progress) => send('progress', formatAgentProgress(progress))
 * );
 * ```
 */

// Core Agent Engine
export {
  AgentEngine,
  type AgentTool,
  type AgentToolResult,
  type AgentContext,
  type AgentProgress,
  type AgentConfig,
  type AgentResult,
  createMcpTool,
  createFunctionTool,
} from './AgentEngine';

// SSE Route Helpers
export {
  createStreamingResponse,
  formatAgentProgress,
  type SSEEventType,
  type SSESender,
  type AgentRouteHandler,
  type ProgressEvent,
} from './createAgentRoute';

// Pre-built Tools
export {
  createAtlasTool,
  loadHubspotTools,
  loadFirecrawlTools,
  createFirecrawlTools,
  getAllAgentTools,
} from './createAgentRoute';


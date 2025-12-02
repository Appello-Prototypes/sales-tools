/**
 * Reusable AI Agent Engine
 * 
 * A generic agentic framework that can be configured for different use cases.
 * Supports dynamic tool loading from MCP servers and provides full transparency
 * through streaming progress updates.
 * 
 * Usage:
 * ```typescript
 * const agent = new AgentEngine({
 *   name: 'deal-intelligence',
 *   systemPrompt: DEAL_ANALYSIS_PROMPT,
 *   tools: [atlasTool, ...hubspotTools],
 *   maxIterations: 10,
 * });
 * 
 * const result = await agent.run(context, onProgress);
 * ```
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '@/lib/config';

// ============================================================================
// Types
// ============================================================================

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (input: any, context: AgentContext) => Promise<AgentToolResult>;
}

export interface AgentToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface AgentContext {
  [key: string]: any;
}

export interface AgentProgress {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response' | 'error' | 'complete';
  timestamp: Date;
  data: {
    message?: string;
    tool?: string;
    input?: any;
    result?: any;
    duration?: string;
    status?: 'executing' | 'complete' | 'error';
    [key: string]: any;
  };
}

export interface AgentConfig {
  /** Unique name for this agent type */
  name: string;
  
  /** System prompt that defines the agent's role and behavior */
  systemPrompt: string;
  
  /** Available tools the agent can use */
  tools: AgentTool[];
  
  /** Maximum iterations before forcing completion (default: 10) */
  maxIterations?: number;
  
  /** Model to use (default: claude-sonnet-4-5-20250929) */
  model?: string;
  
  /** Max tokens for response (default: 8192) */
  maxTokens?: number;
  
  /** Name of the tool to call when analysis is complete */
  finishToolName?: string;
  
  /** Schema for the expected output */
  outputSchema?: Record<string, any>;
}

export interface AgentResult<T = any> {
  success: boolean;
  output?: T;
  error?: string;
  iterations: number;
  toolCalls: number;
}

// ============================================================================
// Agent Engine
// ============================================================================

export class AgentEngine<TContext extends AgentContext = AgentContext, TOutput = any> {
  private config: Required<AgentConfig>;
  private client: Anthropic;

  constructor(config: AgentConfig) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.config = {
      maxIterations: 10,
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 8192,
      finishToolName: 'finish_analysis',
      outputSchema: {},
      ...config,
    };

    this.client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }

  /**
   * Convert our tool format to Anthropic's tool format
   */
  private getAnthropicTools(): Anthropic.Tool[] {
    const tools: Anthropic.Tool[] = this.config.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    }));

    // Add the finish tool if not already present
    if (!tools.find(t => t.name === this.config.finishToolName)) {
      tools.push({
        name: this.config.finishToolName,
        description: `Call this when you have gathered enough information and are ready to provide your final analysis. This signals that you are done investigating.`,
        input_schema: {
          type: 'object' as const,
          properties: {
            summary: {
              type: 'string',
              description: 'Brief summary of what you investigated and key findings'
            }
          },
          required: ['summary']
        }
      });
    }

    return tools;
  }

  /**
   * Execute a tool call
   */
  private async executeTool(
    toolName: string,
    toolInput: any,
    context: TContext,
    sendProgress: (progress: AgentProgress) => void
  ): Promise<string> {
    const startTime = Date.now();

    // Handle finish tool
    if (toolName === this.config.finishToolName) {
      sendProgress({
        type: 'tool_call',
        timestamp: new Date(),
        data: {
          tool: toolName,
          input: toolInput,
          status: 'complete'
        }
      });

      return JSON.stringify({
        success: true,
        message: 'Analysis complete. Provide your final report.'
      });
    }

    // Find and execute the tool
    const tool = this.config.tools.find(t => t.name === toolName);
    
    if (!tool) {
      sendProgress({
        type: 'error',
        timestamp: new Date(),
        data: {
          tool: toolName,
          message: `Unknown tool: ${toolName}`,
          status: 'error'
        }
      });
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }

    sendProgress({
      type: 'tool_call',
      timestamp: new Date(),
      data: {
        tool: toolName,
        input: toolInput,
        status: 'executing'
      }
    });

    try {
      const result = await tool.execute(toolInput, context);
      const duration = Date.now() - startTime;

      sendProgress({
        type: 'tool_result',
        timestamp: new Date(),
        data: {
          tool: toolName,
          input: toolInput,
          result: result.result,
          duration: `${duration}ms`,
          status: result.success ? 'complete' : 'error'
        }
      });

      return JSON.stringify(result);
    } catch (error: any) {
      sendProgress({
        type: 'error',
        timestamp: new Date(),
        data: {
          tool: toolName,
          error: error.message,
          status: 'error'
        }
      });

      return JSON.stringify({ success: false, error: error.message });
    }
  }

  /**
   * Run the agent with the given context
   */
  async run(
    userMessage: string,
    context: TContext,
    sendProgress: (progress: AgentProgress) => void
  ): Promise<AgentResult<TOutput>> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage }
    ];

    let iterations = 0;
    let toolCalls = 0;
    let isComplete = false;
    let finalOutput: TOutput | undefined;

    sendProgress({
      type: 'thinking',
      timestamp: new Date(),
      data: {
        message: `Starting ${this.config.name} agent...`
      }
    });

    const anthropicTools = this.getAnthropicTools();

    while (!isComplete && iterations < this.config.maxIterations) {
      iterations++;

      sendProgress({
        type: 'thinking',
        timestamp: new Date(),
        data: {
          message: `Iteration ${iterations}: Agent is analyzing...`,
          iteration: iterations
        }
      });

      try {
        const response = await this.client.messages.create({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          system: this.config.systemPrompt,
          tools: anthropicTools,
          messages: messages
        });

        // Collect content blocks
        const assistantContent: Anthropic.ContentBlockParam[] = [];
        const toolUseBlocks: Array<{ id: string; name: string; input: any }> = [];

        for (const block of response.content) {
          if (block.type === 'text') {
            assistantContent.push({ type: 'text', text: block.text });

            sendProgress({
              type: 'response',
              timestamp: new Date(),
              data: {
                message: 'Agent reasoning',
                text: block.text.substring(0, 500) + (block.text.length > 500 ? '...' : ''),
                fullText: block.text
              }
            });

            // Check if this is the final response
            if (response.stop_reason === 'end_turn' && !response.content.some(b => b.type === 'tool_use')) {
              finalOutput = this.parseOutput(block.text);
              isComplete = true;
            }
          } else if (block.type === 'tool_use') {
            toolCalls++;
            assistantContent.push({
              type: 'tool_use',
              id: block.id,
              name: block.name,
              input: block.input as Record<string, unknown>
            });
            toolUseBlocks.push({
              id: block.id,
              name: block.name,
              input: block.input
            });

            if (block.name === this.config.finishToolName) {
              isComplete = true;
            }
          }
        }

        // Execute tools and add messages
        if (toolUseBlocks.length > 0) {
          messages.push({ role: 'assistant', content: assistantContent });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const toolUse of toolUseBlocks) {
            const toolResult = await this.executeTool(
              toolUse.name,
              toolUse.input,
              context,
              sendProgress
            );

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: toolResult
            });
          }

          messages.push({
            role: 'user',
            content: toolResults
          });
        } else if (response.stop_reason === 'end_turn' && assistantContent.length > 0) {
          messages.push({ role: 'assistant', content: assistantContent });
          isComplete = true;
        }

      } catch (error: any) {
        sendProgress({
          type: 'error',
          timestamp: new Date(),
          data: {
            message: `Agent error: ${error.message}`,
            error: error.message,
            iteration: iterations
          }
        });

        return {
          success: false,
          error: error.message,
          iterations,
          toolCalls
        };
      }
    }

    // Get final output if not already parsed
    if (!finalOutput && isComplete) {
      finalOutput = await this.requestFinalOutput(messages, sendProgress);
    }

    // Handle max iterations
    if (!isComplete) {
      sendProgress({
        type: 'error',
        timestamp: new Date(),
        data: {
          message: `Agent reached maximum iterations (${this.config.maxIterations})`,
          iterations,
          toolCalls
        }
      });

      return {
        success: false,
        error: `Agent reached maximum iterations (${this.config.maxIterations})`,
        iterations,
        toolCalls
      };
    }

    sendProgress({
      type: 'complete',
      timestamp: new Date(),
      data: {
        message: 'Analysis complete',
        iterations,
        toolCalls,
        output: finalOutput
      }
    });

    return {
      success: true,
      output: finalOutput,
      iterations,
      toolCalls
    };
  }

  /**
   * Parse output from agent response
   */
  private parseOutput(text: string): TOutput | undefined {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Try to find raw JSON object
      const rawJson = text.match(/\{[\s\S]*\}/);
      if (rawJson) {
        return JSON.parse(rawJson[0]);
      }
    } catch (e) {
      // Return undefined if parsing fails
    }
    return undefined;
  }

  /**
   * Request final structured output from the agent
   */
  private async requestFinalOutput(
    messages: Anthropic.MessageParam[],
    sendProgress: (progress: AgentProgress) => void
  ): Promise<TOutput | undefined> {
    try {
      const finalResponse = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: this.config.systemPrompt,
        messages: [
          ...messages,
          {
            role: 'user',
            content: `Now provide your final analysis in JSON format.`
          }
        ]
      });

      const textBlock = finalResponse.content.find(b => b.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        return this.parseOutput(textBlock.text);
      }
    } catch (error: any) {
      sendProgress({
        type: 'error',
        timestamp: new Date(),
        data: {
          message: `Failed to get final output: ${error.message}`
        }
      });
    }

    return undefined;
  }
}

// ============================================================================
// Tool Builder Helpers
// ============================================================================

/**
 * Create a tool from an MCP tool definition
 */
export function createMcpTool(
  mcpTool: { name: string; description?: string; inputSchema?: any },
  executor: (input: any, context: AgentContext) => Promise<AgentToolResult>,
  namePrefix: string = ''
): AgentTool {
  return {
    name: namePrefix ? `${namePrefix}_${mcpTool.name.replace(/-/g, '_')}` : mcpTool.name,
    description: mcpTool.description || `Tool: ${mcpTool.name}`,
    inputSchema: mcpTool.inputSchema || {
      type: 'object',
      properties: {},
      required: []
    },
    execute: executor
  };
}

/**
 * Create a simple function tool
 */
export function createFunctionTool<TInput = any>(
  name: string,
  description: string,
  inputSchema: AgentTool['inputSchema'],
  handler: (input: TInput, context: AgentContext) => Promise<any>
): AgentTool {
  return {
    name,
    description,
    inputSchema,
    execute: async (input, context) => {
      try {
        const result = await handler(input as TInput, context);
        return { success: true, result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  };
}



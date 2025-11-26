/**
 * Claude API Wrapper
 * 
 * Provides a clean interface for interacting with Anthropic's Claude API
 * Used for: complex reasoning, transcript analysis, report generation, adaptive questioning
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '@/lib/config';
import { AuditTrail, addAuditEntry } from './auditTrail';

// Lazy initialization - only create client when actually used
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required. Please set it in .env.local');
    }
    anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  model?: 'claude-sonnet-4-5-20250929' | 'claude-sonnet-4-5' | 'claude-haiku-4-5-20251001' | 'claude-3-opus-20240229' | 'claude-3-haiku-20240307';
  maxTokens?: number;
  temperature?: number;
  system?: string;
  thinking?: {
    type: 'enabled';
    budget_tokens: number;
  };
}

const DEFAULT_OPTIONS: Required<Omit<ClaudeOptions, 'system' | 'thinking'>> & { system?: string; thinking?: ClaudeOptions['thinking'] } = {
  model: 'claude-sonnet-4-5-20250929', // Sonnet 4.5 with thinking mode (max)
  maxTokens: 16384, // Must be greater than thinking.budget_tokens (recommended: 16k+ for complex tasks)
  temperature: 0.7, // Will be set to 1 automatically when thinking is enabled
  thinking: {
    type: 'enabled',
    budget_tokens: 16384, // Max thinking tokens for deep reasoning (max mode) - recommended 16k+ for complex tasks
  },
};

/**
 * Send a message to Claude and get a response
 */
export async function chatWithClaude(
  messages: ClaudeMessage[],
  options: ClaudeOptions = {},
  auditTrail?: AuditTrail
): Promise<string> {
  const startTime = Date.now();
  const userPrompt = messages.find(m => m.role === 'user')?.content || '';
  
  try {
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    // When thinking mode is enabled, temperature must be 1
    // Also ensure max_tokens is greater than thinking.budget_tokens
    const temperature = config.thinking ? 1 : config.temperature;
    const maxTokens = config.thinking && config.maxTokens <= config.thinking.budget_tokens
      ? config.thinking.budget_tokens + 1024 // Add buffer
      : config.maxTokens;
    
    const requestParams: any = {
      model: config.model,
      max_tokens: maxTokens,
      temperature: temperature,
      system: config.system,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Add thinking mode if configured (for Sonnet 4.5 and Haiku 4.5)
    if (config.thinking && (
      config.model === 'claude-sonnet-4-5-20250929' || 
      config.model === 'claude-sonnet-4-5' ||
      config.model === 'claude-haiku-4-5-20251001'
    )) {
      requestParams.thinking = {
        type: 'enabled',
        budget_tokens: config.thinking.budget_tokens,
      };
    }

    const response = await getAnthropicClient().messages.create(requestParams);
    const duration = Date.now() - startTime;

    // Extract text content from response
    const textContent = response.content.find(
      (content): content is Anthropic.Messages.TextBlock => content.type === 'text'
    );

    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Track in audit trail
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'Claude API Query',
        type: 'claude_query',
        duration,
        details: {
          prompt: userPrompt,
          systemPrompt: config.system,
          model: config.model,
          options: {
            maxTokens,
            temperature,
            thinking: config.thinking,
          },
          response: {
            success: true,
            summary: textContent.text.substring(0, 200) + (textContent.text.length > 200 ? '...' : ''),
            tokenUsage: {
              input: (response as any).usage?.input_tokens,
              output: (response as any).usage?.output_tokens,
              thinking: (response as any).usage?.thinking_tokens,
            },
          },
        },
      });
    }

    return textContent.text;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Track error in audit trail
    if (auditTrail) {
      addAuditEntry(auditTrail, {
        action: 'Claude API Query',
        type: 'error',
        duration,
        details: {
          prompt: userPrompt,
          systemPrompt: options.system,
          model: options.model || DEFAULT_OPTIONS.model,
          response: {
            success: false,
            error: error.message || 'Unknown error',
          },
        },
      });
    }
    
    console.error('Claude API error:', error);
    throw new Error(`Claude API error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Analyze text with Claude (single prompt)
 */
export async function analyzeWithClaude(
  prompt: string,
  systemPrompt?: string,
  options: Omit<ClaudeOptions, 'system'> = {},
  auditTrail?: AuditTrail
): Promise<string> {
  return chatWithClaude(
    [{ role: 'user', content: prompt }],
    { ...options, system: systemPrompt },
    auditTrail
  );
}

/**
 * Stream response from Claude (for long-running tasks)
 */
export async function* streamFromClaude(
  messages: ClaudeMessage[],
  options: ClaudeOptions = {}
): AsyncGenerator<string, void, unknown> {
  try {
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    // When thinking mode is enabled, temperature must be 1
    // Also ensure max_tokens is greater than thinking.budget_tokens
    const temperature = config.thinking ? 1 : config.temperature;
    const maxTokens = config.thinking && config.maxTokens <= config.thinking.budget_tokens
      ? config.thinking.budget_tokens + 1024 // Add buffer
      : config.maxTokens;
    
    const requestParams: any = {
      model: config.model,
      max_tokens: maxTokens,
      temperature: temperature,
      system: config.system,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Add thinking mode if configured (for Sonnet 4.5 and Haiku 4.5)
    if (config.thinking && (
      config.model === 'claude-sonnet-4-5-20250929' || 
      config.model === 'claude-sonnet-4-5' ||
      config.model === 'claude-haiku-4-5-20251001'
    )) {
      requestParams.thinking = {
        type: 'enabled',
        budget_tokens: config.thinking.budget_tokens,
      };
    }

    const stream = await anthropic.messages.stream(requestParams);

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  } catch (error: any) {
    console.error('Claude streaming error:', error);
    throw new Error(`Claude streaming error: ${error.message || 'Unknown error'}`);
  }
}

export default {
  chat: chatWithClaude,
  analyze: analyzeWithClaude,
  stream: streamFromClaude,
};


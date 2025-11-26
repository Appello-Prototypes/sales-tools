/**
 * Test API Route for AI Integration
 * 
 * Tests Claude API and MCP tools integration
 * GET /api/ai/test
 */

import { NextResponse } from 'next/server';
import { analyzeWithClaude } from '@/lib/ai/claude';
import { queryATLAS } from '@/lib/ai/mcpTools';

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Test 1: Claude API
    try {
      const claudeResponse = await analyzeWithClaude(
        'Say "Hello, AI integration is working!" in a friendly way.',
        'You are a helpful assistant.',
        { maxTokens: 100 }
      );
      results.tests.claude = {
        status: 'success',
        response: claudeResponse,
      };
    } catch (error: any) {
      results.tests.claude = {
        status: 'error',
        error: error.message,
      };
    }

    // Test 2: ATLAS Query
    try {
      const atlasResponse = await queryATLAS('test query');
      results.tests.atlas = {
        status: 'success',
        response: atlasResponse,
      };
    } catch (error: any) {
      results.tests.atlas = {
        status: 'error',
        error: error.message,
      };
    }

    // Test 3: Firecrawl (optional)
    try {
      // Simple test - we'll skip for now to avoid unnecessary API calls
      results.tests.firecrawl = {
        status: 'skipped',
        note: 'Firecrawl test skipped - will test when needed',
      };
    } catch (error: any) {
      results.tests.firecrawl = {
        status: 'error',
        error: error.message,
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}


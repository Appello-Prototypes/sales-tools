/**
 * Test AI Integration Script
 * 
 * Tests Claude API and MCP tools integration
 * Run with: npx tsx scripts/test-ai-integration.ts
 */

// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { analyzeWithClaude } from '../lib/ai/claude';
import { queryATLAS, findSimilarCustomers } from '../lib/ai/mcpTools';

async function testAIIntegration() {
  console.log('🧪 Testing AI Integration\n');

  // Test 1: Claude API
  console.log('1. Testing Claude API...');
  try {
    const response = await analyzeWithClaude(
      'Say "Hello, AI integration is working!" in a friendly way.',
      'You are a helpful assistant.',
      { maxTokens: 100 }
    );
    console.log('   ✅ Claude API working!');
    console.log(`   Response: ${response}\n`);
  } catch (error: any) {
    console.log('   ❌ Claude API error:', error.message);
    if (error.message.includes('credit')) {
      console.log('   💡 Add credits at: https://console.anthropic.com/\n');
    }
  }

  // Test 2: ATLAS Query
  console.log('2. Testing ATLAS Query...');
  try {
    const result = await queryATLAS('Find customers with HVAC trade');
    console.log('   ✅ ATLAS query executed');
    console.log(`   Results: ${JSON.stringify(result).substring(0, 100)}...\n`);
  } catch (error: any) {
    console.log('   ⚠️ ATLAS query error:', error.message);
    console.log('   💡 May need to use MCP tools directly instead\n');
  }

  // Test 3: Find Similar Customers
  console.log('3. Testing Find Similar Customers...');
  try {
    const customers = await findSimilarCustomers({
      trade: 'HVAC',
      fieldWorkers: '20-49',
    });
    console.log(`   ✅ Found ${customers.length} similar customers\n`);
  } catch (error: any) {
    console.log('   ⚠️ Error:', error.message);
  }

  console.log('✅ Testing complete!');
}

testAIIntegration().catch(console.error);


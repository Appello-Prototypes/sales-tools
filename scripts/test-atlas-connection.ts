/**
 * Test script to verify ATLAS MCP connection
 */

import 'dotenv/config';
import { getAtlasStatus, queryATLAS } from '../lib/mcp/atlasClient';

async function testAtlasConnection() {
  console.log('🧪 Testing ATLAS MCP Connection...\n');
  
  try {
    // Test 1: Check status
    console.log('1️⃣ Checking ATLAS status...');
    const status = await getAtlasStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    
    if (!status.connected) {
      console.error(`❌ ATLAS not connected: ${status.error}`);
      process.exit(1);
    }
    
    console.log(`✅ ATLAS connected! Available tools: ${status.tools?.join(', ') || 'none'}\n`);
    
    // Test 2: Try a simple query
    console.log('2️⃣ Testing ATLAS query...');
    const result = await queryATLAS('test connection query');
    console.log('Query result:', JSON.stringify(result, null, 2));
    
    console.log('\n✅ All tests passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAtlasConnection();


/**
 * Verification script to ensure npx is available in production
 * 
 * Run this script during deployment or startup to verify npx is accessible.
 * This is critical for MCP clients to work properly.
 */

import { findNpx, verifyNpxAvailable } from '../lib/mcp/findNpx';

async function main() {
  console.log('🔍 Verifying npx availability for MCP clients...\n');
  
  try {
    // Find npx
    const npxPath = findNpx();
    console.log(`📍 Found npx at: ${npxPath}\n`);
    
    // Verify it's executable
    verifyNpxAvailable();
    
    console.log('✅ npx verification successful!');
    console.log('✅ MCP clients should be able to initialize properly.\n');
    
    // Show environment info
    console.log('📋 Environment Information:');
    console.log(`   Node.js version: ${process.version}`);
    console.log(`   Node.js path: ${process.execPath}`);
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Architecture: ${process.arch}`);
    console.log(`   NPX path: ${npxPath}`);
    
    // Check environment variables
    console.log('\n📋 Environment Variables:');
    console.log(`   NPX_COMMAND: ${process.env.NPX_COMMAND || 'not set'}`);
    console.log(`   ATLAS_MCP_COMMAND: ${process.env.ATLAS_MCP_COMMAND || 'not set'}`);
    console.log(`   HUBSPOT_MCP_COMMAND: ${process.env.HUBSPOT_MCP_COMMAND || 'not set'}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ npx verification failed!');
    console.error(`   Error: ${error.message}\n`);
    
    console.error('💡 Solutions:');
    console.error('   1. Ensure Node.js and npm are installed');
    console.error('   2. Verify npx is in your PATH: which npx');
    console.error('   3. Set NPX_COMMAND environment variable to the full path of npx');
    console.error('   4. For Vercel/serverless: Ensure Node.js 18+ is configured');
    console.error('   5. For Docker: Use a Node.js base image that includes npm/npx\n');
    
    process.exit(1);
  }
}

main();


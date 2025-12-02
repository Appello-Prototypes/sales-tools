/**
 * Simple script to check npx health on Vercel deployment
 * 
 * This script doesn't require Vercel SDK - just calls the health endpoint directly.
 * 
 * Usage:
 *   npm run check-vercel-health -- https://your-app.vercel.app
 *   or set VERCEL_URL environment variable
 */

const deploymentUrl = process.argv[2] || process.env.VERCEL_URL;

if (!deploymentUrl) {
  console.error('❌ Please provide deployment URL:');
  console.error('   npm run check-vercel-health -- https://your-app.vercel.app');
  console.error('   or set VERCEL_URL environment variable');
  process.exit(1);
}

async function checkHealth() {
  const healthUrl = deploymentUrl.endsWith('/api/health/npx')
    ? deploymentUrl
    : `${deploymentUrl.replace(/\/$/, '')}/api/health/npx`;

  console.log(`🔍 Checking npx availability at: ${healthUrl}\n`);

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success && data.npxAvailable) {
      console.log('✅ npx is available on Vercel!');
      console.log(`\n📋 Details:`);
      console.log(`   npx Path: ${data.npxPath}`);
      console.log(`   Node.js Version: ${data.environment.nodeVersion}`);
      console.log(`   Platform: ${data.environment.platform}`);
      console.log(`   Architecture: ${data.environment.arch}`);
      console.log(`   Vercel Environment: ${data.environment.vercelEnv}`);
      console.log(`   Verification Duration: ${data.duration}`);
      console.log(`   Timestamp: ${data.timestamp}`);
      console.log('\n✅ MCP clients should work correctly on this deployment.');
      process.exit(0);
    } else {
      console.error('❌ npx is NOT available on Vercel!');
      console.error(`\n📋 Details:`);
      console.error(`   Error: ${data.error || 'Unknown error'}`);
      if (data.environment) {
        console.error(`   Node.js Version: ${data.environment.nodeVersion || 'unknown'}`);
        console.error(`   Platform: ${data.environment.platform || 'unknown'}`);
        console.error(`   Vercel Environment: ${data.environment.vercelEnv || 'unknown'}`);
      }
      
      console.error('\n💡 Solutions:');
      console.error('   1. Check Node.js version in Vercel dashboard (should be 18+)');
      console.error('   2. Verify deployment logs for errors');
      console.error('   3. Check Vercel project settings → General → Node.js Version');
      console.error('   4. Ensure you\'re not using a custom Node.js runtime');
      
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Health check failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('fetch')) {
      console.error('\n💡 Possible issues:');
      console.error('   1. Deployment URL is incorrect');
      console.error('   2. Deployment is not accessible');
      console.error('   3. Health check endpoint is not deployed');
      console.error('   4. Network connectivity issue');
    }
    
    process.exit(1);
  }
}

checkHealth();


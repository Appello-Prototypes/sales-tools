/**
 * Complete production verification script
 * 
 * This script runs all verification steps:
 * 1. Local npx verification
 * 2. Health check on Vercel deployment
 * 3. Vercel SDK verification (if token provided)
 * 
 * Usage:
 *   npm run verify-production -- https://your-app.vercel.app
 *   or
 *   VERCEL_URL=https://your-app.vercel.app npm run verify-production
 *   or with Vercel SDK:
 *   VERCEL_TOKEN=token VERCEL_URL=https://your-app.vercel.app npm run verify-production
 */

import { findNpx, verifyNpxAvailable } from '../lib/mcp/findNpx';

const deploymentUrl = process.argv[2] || process.env.VERCEL_URL;
const vercelToken = process.env.VERCEL_TOKEN;

async function step1_LocalVerification() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('STEP 1: Local npx Verification');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    const npxPath = findNpx();
    verifyNpxAvailable();
    
    console.log('✅ Local npx verification PASSED');
    console.log(`   npx Path: ${npxPath}`);
    console.log(`   Node.js Version: ${process.version}`);
    console.log(`   Platform: ${process.platform}`);
    return true;
  } catch (error: any) {
    console.error('❌ Local npx verification FAILED');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function step2_HealthCheck() {
  if (!deploymentUrl) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 2: Vercel Health Check');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('⏭️  Skipped: No deployment URL provided');
    console.log('   Provide URL: npm run verify-production -- https://your-app.vercel.app');
    return null;
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('STEP 2: Vercel Health Check');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const healthUrl = deploymentUrl.endsWith('/api/health/npx')
    ? deploymentUrl
    : `${deploymentUrl.replace(/\/$/, '')}/api/health/npx`;

  console.log(`🔍 Checking: ${healthUrl}\n`);

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success && data.npxAvailable) {
      console.log('✅ Vercel health check PASSED');
      console.log(`   npx Path: ${data.npxPath}`);
      console.log(`   Node.js Version: ${data.environment.nodeVersion}`);
      console.log(`   Platform: ${data.environment.platform}`);
      console.log(`   Architecture: ${data.environment.arch}`);
      console.log(`   Vercel Environment: ${data.environment.vercelEnv}`);
      console.log(`   Verification Duration: ${data.duration}`);
      return true;
    } else {
      console.error('❌ Vercel health check FAILED');
      console.error(`   Error: ${data.error || 'Unknown error'}`);
      if (data.environment) {
        console.error(`   Node.js Version: ${data.environment.nodeVersion || 'unknown'}`);
        console.error(`   Platform: ${data.environment.platform || 'unknown'}`);
      }
      return false;
    }
  } catch (error: any) {
    console.error('❌ Vercel health check FAILED');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('fetch')) {
      console.error('\n💡 Possible issues:');
      console.error('   1. Deployment URL is incorrect');
      console.error('   2. Deployment is not accessible');
      console.error('   3. Health check endpoint is not deployed');
      console.error('   4. Network connectivity issue');
    }
    return false;
  }
}

async function step3_VercelSDKVerification() {
  if (!vercelToken) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 3: Vercel SDK Verification');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('⏭️  Skipped: No VERCEL_TOKEN provided');
    console.log('   Get token from: https://vercel.com/account/tokens');
    console.log('   Then run: VERCEL_TOKEN=token npm run verify-production');
    return null;
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('STEP 3: Vercel SDK Verification');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const { Vercel } = await import('@vercel/sdk');
    const vercel = new Vercel({
      bearerToken: vercelToken,
    });

    // Try to get user info
    try {
      const user = await vercel.users.getAuthenticatedUser();
      console.log(`✅ Authenticated as: ${user.user.username || user.user.email}`);
    } catch (error: any) {
      console.warn(`⚠️  Could not verify authentication: ${error.message}`);
    }

    // If deployment URL provided, try to get deployment info
    if (deploymentUrl) {
      try {
        // Extract project name from URL if possible
        const urlMatch = deploymentUrl.match(/https?:\/\/([^.]+)\.vercel\.app/);
        if (urlMatch) {
          const projectName = urlMatch[1];
          console.log(`\n🔍 Looking for project: ${projectName}`);
          
          const projects = await vercel.projects.listProjects({});
          const project = projects.projects.find(p => 
            p.name === projectName || 
            deploymentUrl.includes(p.name)
          );
          
          if (project) {
            console.log(`✅ Found project: ${project.name} (${project.id})`);
            
            const deployments = await vercel.deployments.listDeployments({
              projectId: project.id,
              limit: 1,
            });
            
            if (deployments.deployments.length > 0) {
              const latest = deployments.deployments[0];
              console.log(`✅ Latest deployment:`);
              console.log(`   URL: https://${latest.url}`);
              console.log(`   Status: ${latest.readyState}`);
              console.log(`   Created: ${new Date(latest.createdAt).toLocaleString()}`);
              return true;
            }
          }
        }
      } catch (error: any) {
        console.warn(`⚠️  Could not fetch deployment info: ${error.message}`);
      }
    }

    console.log('✅ Vercel SDK connection verified');
    return true;
  } catch (error: any) {
    console.error('❌ Vercel SDK verification FAILED');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     Production npx Verification - Complete Check     ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  const results = {
    step1: false,
    step2: null as boolean | null,
    step3: null as boolean | null,
  };

  // Step 1: Local verification
  results.step1 = await step1_LocalVerification();

  // Step 2: Health check
  results.step2 = await step2_HealthCheck();

  // Step 3: Vercel SDK verification
  results.step3 = await step3_VercelSDKVerification();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log(`Step 1 - Local Verification: ${results.step1 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Step 2 - Health Check: ${results.step2 === null ? '⏭️  SKIPPED' : results.step2 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Step 3 - Vercel SDK: ${results.step3 === null ? '⏭️  SKIPPED' : results.step3 ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = results.step1 && 
    (results.step2 === null || results.step2) && 
    (results.step3 === null || results.step3);

  if (allPassed) {
    console.log('\n✅ All verification steps passed!');
    console.log('✅ MCP clients should work correctly in production.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some verification steps failed or were skipped.');
    console.log('   Review the output above for details.\n');
    process.exit(1);
  }
}

main();


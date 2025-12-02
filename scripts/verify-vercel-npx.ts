/**
 * Verify npx availability on Vercel using Vercel SDK
 * 
 * This script:
 * 1. Uses Vercel SDK to check deployment status
 * 2. Calls the health check endpoint to verify npx availability
 * 3. Provides detailed diagnostics
 * 
 * Usage:
 *   VERCEL_TOKEN=your_token npm run verify-vercel-npx
 *   or
 *   VERCEL_TOKEN=your_token npm run verify-vercel-npx -- --project=your-project --team=your-team
 */

import { Vercel } from '@vercel/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface VerifyOptions {
  project?: string;
  team?: string;
  deploymentUrl?: string;
}

async function verifyVercelNpx(options: VerifyOptions = {}) {
  const vercelToken = process.env.VERCEL_TOKEN;
  
  if (!vercelToken) {
    console.error('❌ VERCEL_TOKEN environment variable is required');
    console.error('   Get your token from: https://vercel.com/account/tokens');
    console.error('   Then run: VERCEL_TOKEN=your_token npm run verify-vercel-npx');
    process.exit(1);
  }

  const vercel = new Vercel({
    bearerToken: vercelToken,
  });

  try {
    console.log('🔍 Verifying npx availability on Vercel...\n');

    // Get project info
    let projectId: string | undefined;
    let projectName: string | undefined;
    
    if (options.project) {
      projectName = options.project;
      try {
        const projects = await vercel.projects.listProjects({
          teamId: options.team,
        });
        const project = projects.projects.find(p => p.name === projectName);
        if (project) {
          projectId = project.id;
          console.log(`✅ Found project: ${projectName} (${projectId})`);
        } else {
          console.warn(`⚠️ Project "${projectName}" not found`);
        }
      } catch (error: any) {
        console.warn(`⚠️ Could not fetch project info: ${error.message}`);
      }
    }

    // Get latest deployment
    let deploymentUrl: string | undefined = options.deploymentUrl;
    
    if (!deploymentUrl && projectId) {
      try {
        const deployments = await vercel.deployments.listDeployments({
          projectId,
          teamId: options.team,
          limit: 1,
        });
        
        if (deployments.deployments.length > 0) {
          const latestDeployment = deployments.deployments[0];
          deploymentUrl = `https://${latestDeployment.url}`;
          console.log(`✅ Found latest deployment: ${deploymentUrl}`);
          console.log(`   Status: ${latestDeployment.readyState}`);
          console.log(`   Created: ${new Date(latestDeployment.createdAt).toLocaleString()}`);
        }
      } catch (error: any) {
        console.warn(`⚠️ Could not fetch deployment info: ${error.message}`);
      }
    }

    if (!deploymentUrl) {
      console.error('❌ No deployment URL found. Please provide one:');
      console.error('   npm run verify-vercel-npx -- --deployment-url=https://your-app.vercel.app');
      process.exit(1);
    }

    // Call health check endpoint
    console.log(`\n🔍 Checking npx availability at: ${deploymentUrl}/api/health/npx\n`);
    
    const healthCheckUrl = `${deploymentUrl}/api/health/npx`;
    const response = await fetch(healthCheckUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const healthData = await response.json();

    if (healthData.success && healthData.npxAvailable) {
      console.log('✅ npx is available on Vercel!');
      console.log(`\n📋 Details:`);
      console.log(`   npx Path: ${healthData.npxPath}`);
      console.log(`   Node.js Version: ${healthData.environment.nodeVersion}`);
      console.log(`   Platform: ${healthData.environment.platform}`);
      console.log(`   Architecture: ${healthData.environment.arch}`);
      console.log(`   Vercel Environment: ${healthData.environment.vercelEnv}`);
      console.log(`   Verification Duration: ${healthData.duration}`);
      console.log(`   Timestamp: ${healthData.timestamp}`);
      console.log('\n✅ MCP clients should work correctly on this deployment.');
      process.exit(0);
    } else {
      console.error('❌ npx is NOT available on Vercel!');
      console.error(`\n📋 Details:`);
      console.error(`   Error: ${healthData.error || 'Unknown error'}`);
      console.error(`   Node.js Version: ${healthData.environment?.nodeVersion || 'unknown'}`);
      console.error(`   Platform: ${healthData.environment?.platform || 'unknown'}`);
      console.error(`   Vercel Environment: ${healthData.environment?.vercelEnv || 'unknown'}`);
      
      console.error('\n💡 Solutions:');
      console.error('   1. Check Node.js version in Vercel dashboard (should be 18+)');
      console.error('   2. Verify deployment logs for errors');
      console.error('   3. Check Vercel project settings → General → Node.js Version');
      console.error('   4. Ensure you\'re not using a custom Node.js runtime');
      
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Verification failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('fetch')) {
      console.error('\n💡 Possible issues:');
      console.error('   1. Deployment URL is incorrect');
      console.error('   2. Deployment is not accessible');
      console.error('   3. Health check endpoint is not deployed');
    }
    
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: VerifyOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' && args[i + 1]) {
    options.project = args[i + 1];
    i++;
  } else if (args[i] === '--team' && args[i + 1]) {
    options.team = args[i + 1];
    i++;
  } else if (args[i] === '--deployment-url' && args[i + 1]) {
    options.deploymentUrl = args[i + 1];
    i++;
  }
}

verifyVercelNpx(options);


/**
 * Utility to find npx executable path dynamically
 * 
 * This ensures MCP clients can find npx in production environments
 * where the path might differ from development.
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Verify that npx is executable
 */
function verifyNpxExecutable(npxPath: string): boolean {
  try {
    // Check if file exists and is executable
    if (!fs.existsSync(npxPath)) {
      return false;
    }
    
    // Try to get version to verify it works
    // Use a short timeout to avoid hanging
    execSync(`"${npxPath}" --version`, { 
      encoding: 'utf-8',
      timeout: 5000,
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Find the npx executable path
 * 
 * Strategy:
 * 1. Check environment variable (NPX_COMMAND, HUBSPOT_MCP_COMMAND, or ATLAS_MCP_COMMAND)
 * 2. Try to find npx relative to Node.js executable
 * 3. Try to find npx using 'which' command
 * 4. Try common system paths
 * 5. Fall back to 'npx' (hoping it's in PATH)
 */
export function findNpx(): string {
  // If explicitly set via environment, use it
  const envCommand = process.env.NPX_COMMAND ||
                     process.env.HUBSPOT_MCP_COMMAND || 
                     process.env.ATLAS_MCP_COMMAND;
  
  if (envCommand) {
    // If it's a full path, verify it exists and is executable
    if (envCommand.includes('/') || envCommand.includes('\\')) {
      if (fs.existsSync(envCommand)) {
        if (verifyNpxExecutable(envCommand)) {
          console.log(`✅ Found npx at: ${envCommand} (from env)`);
          return envCommand;
        }
        console.warn(`⚠️ NPX path from env (${envCommand}) exists but is not executable`);
      } else {
        console.warn(`⚠️ NPX path from env (${envCommand}) does not exist, trying alternatives...`);
      }
    } else {
      // If it's just a command name (like 'npx'), verify it works
      try {
        execSync(`${envCommand} --version`, { 
          encoding: 'utf-8',
          timeout: 5000,
          stdio: 'pipe'
        });
        console.log(`✅ Found npx command: ${envCommand} (from env, verified)`);
        return envCommand;
      } catch (error) {
        console.warn(`⚠️ NPX command from env (${envCommand}) is not executable, trying alternatives...`);
      }
    }
  }

  // Strategy 1: Find npx relative to Node.js executable
  try {
    const nodePath = process.execPath; // e.g., /usr/local/bin/node or /path/to/node
    const nodeDir = path.dirname(nodePath);
    
    // npx is usually in the same directory as node
    const npxPath = path.join(nodeDir, process.platform === 'win32' ? 'npx.cmd' : 'npx');
    
    if (fs.existsSync(npxPath) && verifyNpxExecutable(npxPath)) {
      console.log(`✅ Found npx at: ${npxPath}`);
      return npxPath;
    }
    
    // On some systems, npx might be in a sibling directory
    // e.g., if node is in /usr/bin/node, npx might be in /usr/bin/npx
    // or if using nvm, it might be in the same directory
    const parentDir = path.dirname(nodeDir);
    const altNpxPath = path.join(parentDir, 'bin', process.platform === 'win32' ? 'npx.cmd' : 'npx');
    if (fs.existsSync(altNpxPath) && verifyNpxExecutable(altNpxPath)) {
      console.log(`✅ Found npx at: ${altNpxPath}`);
      return altNpxPath;
    }
  } catch (error) {
    console.warn('⚠️ Could not find npx relative to Node.js executable:', error);
  }

  // Strategy 2: Try to find npx using 'which' command
  try {
    const whichCommand = process.platform === 'win32' ? 'where.exe npx' : 'which npx';
    const npxPath = execSync(whichCommand, { 
      encoding: 'utf-8',
      timeout: 5000,
      stdio: 'pipe'
    }).trim();
    
    if (npxPath && fs.existsSync(npxPath) && verifyNpxExecutable(npxPath)) {
      console.log(`✅ Found npx using 'which': ${npxPath}`);
      return npxPath;
    }
  } catch (error) {
    console.warn('⚠️ Could not find npx using which command:', error);
  }

  // Strategy 3: Try common system paths (for serverless environments)
  const commonPaths = [
    '/usr/local/bin/npx',
    '/usr/bin/npx',
    '/opt/homebrew/bin/npx',
    '/usr/local/lib/node_modules/npm/bin/npx-cli.js',
  ];
  
  for (const commonPath of commonPaths) {
    if (fs.existsSync(commonPath) && verifyNpxExecutable(commonPath)) {
      console.log(`✅ Found npx at common path: ${commonPath}`);
      return commonPath;
    }
  }

  // Strategy 4: Try to verify 'npx' is in PATH
  try {
    execSync('npx --version', { 
      encoding: 'utf-8',
      timeout: 5000,
      stdio: 'pipe'
    });
    console.log('✅ Found npx in PATH (verified)');
    return 'npx';
  } catch (error) {
    console.error('❌ npx not found in PATH and cannot be verified');
  }

  // Strategy 5: Fall back to 'npx' (hoping it's in PATH)
  console.warn('⚠️ Could not verify npx, falling back to "npx" (may fail if not in PATH)');
  return 'npx';
}

/**
 * Verify npx is available and working
 * Throws an error if npx cannot be found or executed
 */
export function verifyNpxAvailable(): void {
  const npxPath = findNpx();
  
  try {
    // Try to execute npx with --version
    const result = execSync(`"${npxPath}" --version`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: 'pipe'
    });
    
    console.log(`✅ npx verification successful: ${npxPath} (version: ${result.trim()})`);
  } catch (error: any) {
    const errorMsg = `npx is not available or not executable at: ${npxPath}. ` +
      `This is required for MCP clients to work. ` +
      `Please ensure Node.js and npm are installed, or set NPX_COMMAND environment variable. ` +
      `Error: ${error.message}`;
    
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }
}


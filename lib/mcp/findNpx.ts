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
 * Find the npx executable path
 * 
 * Strategy:
 * 1. Check environment variable (HUBSPOT_MCP_COMMAND or ATLAS_MCP_COMMAND)
 * 2. Try to find npx relative to Node.js executable
 * 3. Try to find npx using 'which' command
 * 4. Fall back to 'npx' (hoping it's in PATH)
 */
export function findNpx(): string {
  // If explicitly set via environment, use it
  const envCommand = process.env.HUBSPOT_MCP_COMMAND || 
                     process.env.ATLAS_MCP_COMMAND ||
                     process.env.NPX_COMMAND;
  
  if (envCommand) {
    // If it's a full path, verify it exists
    if (envCommand.includes('/') || envCommand.includes('\\')) {
      if (fs.existsSync(envCommand)) {
        return envCommand;
      }
      console.warn(`⚠️ NPX path from env (${envCommand}) does not exist, trying alternatives...`);
    } else {
      // If it's just a command name (like 'npx'), return it
      // The system will try to find it in PATH
      return envCommand;
    }
  }

  // Strategy 1: Find npx relative to Node.js executable
  try {
    const nodePath = process.execPath; // e.g., /usr/local/bin/node or /path/to/node
    const nodeDir = path.dirname(nodePath);
    
    // npx is usually in the same directory as node
    const npxPath = path.join(nodeDir, process.platform === 'win32' ? 'npx.cmd' : 'npx');
    
    if (fs.existsSync(npxPath)) {
      console.log(`✅ Found npx at: ${npxPath}`);
      return npxPath;
    }
    
    // On some systems, npx might be in a sibling directory
    // e.g., if node is in /usr/bin/node, npx might be in /usr/bin/npx
    // or if using nvm, it might be in the same directory
    const parentDir = path.dirname(nodeDir);
    const altNpxPath = path.join(parentDir, 'bin', process.platform === 'win32' ? 'npx.cmd' : 'npx');
    if (fs.existsSync(altNpxPath)) {
      console.log(`✅ Found npx at: ${altNpxPath}`);
      return altNpxPath;
    }
  } catch (error) {
    console.warn('⚠️ Could not find npx relative to Node.js executable:', error);
  }

  // Strategy 2: Try to find npx using 'which' command
  try {
    const whichCommand = process.platform === 'win32' ? 'where.exe npx' : 'which npx';
    const npxPath = execSync(whichCommand, { encoding: 'utf-8' }).trim();
    
    if (npxPath && fs.existsSync(npxPath)) {
      console.log(`✅ Found npx using 'which': ${npxPath}`);
      return npxPath;
    }
  } catch (error) {
    console.warn('⚠️ Could not find npx using which command:', error);
  }

  // Strategy 3: Fall back to 'npx' (hoping it's in PATH)
  console.log('⚠️ Could not find npx path, falling back to "npx" (must be in PATH)');
  return 'npx';
}


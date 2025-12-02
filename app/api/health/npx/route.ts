/**
 * Health check endpoint to verify npx availability in production
 * 
 * This endpoint can be called to verify npx is available on the Vercel runtime.
 * Useful for pre-deployment verification and monitoring.
 */

import { NextResponse } from 'next/server';
import { findNpx, verifyNpxAvailable } from '@/lib/mcp/findNpx';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Find npx
    const npxPath = findNpx();
    
    // Verify it's executable
    verifyNpxAvailable();
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      npxAvailable: true,
      npxPath,
      verified: true,
      duration: `${duration}ms`,
      environment: {
        nodeVersion: process.version,
        nodePath: process.execPath,
        platform: process.platform,
        arch: process.arch,
        vercel: process.env.VERCEL === '1',
        vercelEnv: process.env.VERCEL_ENV || 'unknown',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      npxAvailable: false,
      verified: false,
      error: error.message,
      environment: {
        nodeVersion: process.version,
        nodePath: process.execPath,
        platform: process.platform,
        arch: process.arch,
        vercel: process.env.VERCEL === '1',
        vercelEnv: process.env.VERCEL_ENV || 'unknown',
      },
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}


/**
 * @deprecated This endpoint is deprecated. Please use /api/admin/letter-studio/generate instead.
 * This endpoint will be removed in a future version.
 * 
 * The new Letter Studio provides:
 * - AI-powered multiagent research
 * - Complete session history
 * - Draft versioning
 * - Enhanced research insights
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Return deprecation notice
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated',
      message: 'Please use /api/admin/letter-studio/generate instead. The new Letter Studio provides AI-powered multiagent research, complete session history, and draft versioning.',
      deprecated: true,
      migrationPath: '/admin/letter-studio'
    },
    { status: 410 } // 410 Gone
  );
}

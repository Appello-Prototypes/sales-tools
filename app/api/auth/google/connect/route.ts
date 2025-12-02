import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google/googleOAuth';

/**
 * GET /api/auth/google/connect
 * Initiates OAuth flow - returns authorization URL
 * Can be used for login (no auth required) or connecting email (auth required)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Google OAuth is configured
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    
    if (!hasClientId || !hasClientSecret) {
      return NextResponse.json(
        {
          success: false,
          message: 'Google OAuth is not configured',
          error: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required',
          requiresConfiguration: true
        },
        { status: 503 }
      );
    }

    // For login, use backend callback URL (Google redirects here)
    // Backend then redirects to frontend with token
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3002';
    const backendCallbackUri = `${protocol}://${host}/api/auth/google/callback`;
    
    // State can be userId (for email connection) or 'login' (for initial login)
    const state = request.nextUrl.searchParams.get('state') || 'login';
    const authUrl = getAuthUrl(state, backendCallbackUri);

    return NextResponse.json({
      success: true,
      authUrl,
      redirectUri: backendCallbackUri
    });
  } catch (error: any) {
    console.error('Error initiating Google OAuth:', error);
    const errorMessage = error.message || 'Internal server error';
    const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('credentials');
    return NextResponse.json(
      {
        success: false,
        message: isConfigError ? 'Google OAuth is not configured' : 'Failed to initiate Google connection',
        error: errorMessage,
        requiresConfiguration: isConfigError
      },
      { status: isConfigError ? 503 : 500 }
    );
  }
}


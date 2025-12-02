import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getTokensFromCode } from '@/lib/google/googleOAuth';
import jwt from 'jsonwebtoken';

/**
 * GET /api/auth/google/callback
 * Handles OAuth callback - exchanges code for tokens
 * This is used for BOTH login and email connection
 */
export async function GET(request: NextRequest) {
  // Get client URL from request headers or environment variable
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3002';
  // Prefer request host over env variable to ensure correct port
  const clientUrl = host.includes(':') ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`);

  try {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent('Google OAuth is not configured')}`);
    }

    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent('Missing authorization code')}`);
    }

    // Use the redirect URI that was used in the OAuth request
    const backendCallbackUri = `${protocol}://${host}/api/auth/google/callback`;
    const tokens = await getTokensFromCode(code, backendCallbackUri);

    await connectDB();

    // Find user by Google email - only allow existing users to login
    const user = await User.findOne({ email: tokens.email.toLowerCase() });

    if (!user) {
      // User doesn't exist - reject login
      return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent('Account not found. Please contact an administrator to create your account.')}`);
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent('Your account has been deactivated. Please contact an administrator.')}`);
    }

    // Update existing user with Google OAuth tokens
    user.googleOAuth = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.tokenExpiry || undefined,
      email: tokens.email,
      connectedAt: new Date(),
      scope: tokens.scope
    };
    await user.save();

    // Generate JWT token for app authentication
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    const appToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn }
    );

    // Redirect to frontend with token
    const redirectUrl = state && state.startsWith('settings')
      ? `${clientUrl}/admin/settings?googleConnected=true`
      : `${clientUrl}/auth/callback?token=${appToken}`;

    // Create redirect response with HTTP-only cookie
    const response = NextResponse.redirect(redirectUrl);
    
    // Set HTTP-only cookie (same as regular login)
    response.cookies.set('admin_token', appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Error handling Google OAuth callback:', error);
    const errorMessage = error.message || 'Failed to authenticate with Google';
    // Check if it's a MongoDB connection error
    if (errorMessage.includes('MongoDB') || errorMessage.includes('Atlas') || errorMessage.includes('whitelist')) {
      return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent(errorMessage)}`);
    }
    return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent(errorMessage)}`);
  }
}


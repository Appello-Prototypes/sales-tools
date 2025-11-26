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
  try {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      const clientUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent('Google OAuth is not configured')}`);
    }

    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      const clientUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      const clientUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent('Missing authorization code')}`);
    }

    // Use the redirect URI that was used in the OAuth request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const backendCallbackUri = `${protocol}://${host}/api/auth/google/callback`;
    const tokens = await getTokensFromCode(code, backendCallbackUri);

    await connectDB();

    // Find or create user by Google email
    let user = await User.findOne({ email: tokens.email.toLowerCase() });

    if (!user) {
      // Create new user from Google account
      // Password is optional when Google OAuth is present
      user = new User({
        name: tokens.email.split('@')[0], // Use email prefix as name
        email: tokens.email.toLowerCase(),
        role: 'viewer', // Default role, can be updated by admin
        isActive: true,
        googleOAuth: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: tokens.tokenExpiry || undefined,
          email: tokens.email,
          connectedAt: new Date(),
          scope: tokens.scope
        }
      });
      await user.save();
    } else {
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
    }

    // Generate JWT token for app authentication
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    const appToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn }
    );

    // Redirect to frontend with token
    const clientUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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
    const clientUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${clientUrl}/admin/login?error=${encodeURIComponent(error.message || 'Failed to authenticate with Google')}`);
  }
}


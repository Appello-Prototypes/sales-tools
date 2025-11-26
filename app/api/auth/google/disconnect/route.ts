import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { revokeToken } from '@/lib/google/googleOAuth';

/**
 * POST /api/auth/google/disconnect
 * Disconnect Google account
 */
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: 'Google OAuth is not configured',
          error: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required'
        },
        { status: 503 }
      );
    }

    await connectDB();
    const userDoc = await User.findById(user.userId);

    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (userDoc.googleOAuth && userDoc.googleOAuth.refreshToken) {
      // Revoke token with Google
      try {
        await revokeToken(userDoc.googleOAuth.refreshToken);
      } catch (error) {
        console.error('Error revoking token:', error);
        // Continue with disconnection even if revocation fails
      }

      // Clear OAuth data
      userDoc.googleOAuth = undefined;
      await userDoc.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Google account disconnected successfully'
    });
  } catch (error: any) {
    console.error('Error disconnecting Google account:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to disconnect Google account',
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}


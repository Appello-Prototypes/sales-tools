import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/auth/google/status
 * Check if user has Google account connected
 */
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Google OAuth is configured
    const isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    
    if (!isConfigured) {
      return NextResponse.json({
        success: true,
        isConfigured: false,
        isConnected: false,
        message: 'Google OAuth is not configured'
      });
    }

    await connectDB();
    const userDoc = await User.findById(user.userId).select('googleOAuth email name');
    
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const isConnected = !!(userDoc.googleOAuth && userDoc.googleOAuth.refreshToken);
    const email = userDoc.googleOAuth?.email || null;
    const connectedAt = userDoc.googleOAuth?.connectedAt || null;

    return NextResponse.json({
      success: true,
      isConfigured: true,
      isConnected,
      email,
      connectedAt
    });
  } catch (error: any) {
    console.error('Error getting Google connection status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get connection status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}


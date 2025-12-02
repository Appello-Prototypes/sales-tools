import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/admin/setup-password - Set password using invite token
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { inviteToken, email, password } = await request.json();
    
    if (!inviteToken || !email || !password) {
      return NextResponse.json(
        { error: 'Invite token, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      inviteToken,
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid invite token or email' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.inviteTokenExpiry && user.inviteTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Invite token has expired. Please request a new invitation.' },
        { status: 400 }
      );
    }

    // Set password
    user.passwordHash = password; // Will be hashed by pre-save middleware
    user.inviteToken = undefined;
    user.inviteTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now log in.',
    });
  } catch (error: any) {
    console.error('Error setting password:', error);
    return NextResponse.json(
      { error: 'Failed to set password', details: error.message },
      { status: 500 }
    );
  }
}


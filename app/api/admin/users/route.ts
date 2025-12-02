import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/google/gmailService';
import crypto from 'crypto';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    const authUser = verifyAuth(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can list users
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const users = await User.find({}).select('-passwordHash -inviteToken').sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const authUser = verifyAuth(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can create users
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { email, name, role, sendInvite } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date();
    inviteTokenExpiry.setDate(inviteTokenExpiry.getDate() + 7); // 7 days expiry

    // Create new user (password optional - can be set via invite)
    const user = new User({
      email: email.toLowerCase(),
      name,
      role: role || 'viewer',
      isActive: true,
      inviteToken,
      inviteTokenExpiry,
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.inviteToken;

    // Send invite email if requested
    let emailSent = false;
    let emailError = null;
    if (sendInvite) {
      try {
        const adminUser = await User.findById(authUser.userId);
        if (adminUser && adminUser.googleOAuth?.refreshToken) {
          const protocol = request.headers.get('x-forwarded-proto') || 'http';
          const host = request.headers.get('host') || 'localhost:3002';
          const baseUrl = host.includes(':') ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`);
          const loginUrl = `${baseUrl}/admin/login?invite=${inviteToken}`;

          const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">You've been invited to join Catalyst Sales Tools</h2>
              <p>Hello ${name},</p>
              <p>You've been invited to access the Catalyst Sales Tools platform. Click the button below to set up your account and log in:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
              </div>
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #666; font-size: 14px; word-break: break-all;">${loginUrl}</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">This invitation link will expire in 7 days.</p>
              <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          `;

          const textBody = `
You've been invited to join Catalyst Sales Tools

Hello ${name},

You've been invited to access the Catalyst Sales Tools platform. Use the link below to set up your account and log in:

${loginUrl}

This invitation link will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
          `;

          await sendEmail(
            adminUser.email,
            user.email,
            'Invitation to Catalyst Sales Tools',
            htmlBody,
            textBody
          );
          emailSent = true;
        } else {
          emailError = 'Your Google account is not connected. Please connect it in Settings to send invite emails.';
        }
      } catch (error: any) {
        console.error('Error sending invite email:', error);
        emailError = error.message || 'Failed to send email';
      }
    }

    return NextResponse.json({
      success: true,
      user: userObj,
      inviteToken: sendInvite ? inviteToken : undefined,
      emailSent,
      emailError,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}


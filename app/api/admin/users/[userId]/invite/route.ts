import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/google/gmailService';
import crypto from 'crypto';

// POST /api/admin/users/[userId]/invite - Send invite email to user
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authUser = verifyAuth(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can send invites
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const user = await User.findById(params.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date();
    inviteTokenExpiry.setDate(inviteTokenExpiry.getDate() + 7); // 7 days expiry

    user.inviteToken = inviteToken;
    user.inviteTokenExpiry = inviteTokenExpiry;
    await user.save();

    // Get the base URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3002';
    const baseUrl = host.includes(':') ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`);
    
    const loginUrl = `${baseUrl}/admin/login?invite=${inviteToken}`;

    // Send invite email using admin's Gmail account
    try {
      const adminUser = await User.findById(authUser.userId);
      if (!adminUser || !adminUser.googleOAuth?.refreshToken) {
        return NextResponse.json({
          success: false,
          inviteUrl: loginUrl,
          inviteToken,
          error: 'Your Google account is not connected. Please connect it in Settings to send invite emails.',
          message: 'Invite token generated, but email could not be sent. Share this link manually: ' + loginUrl,
        });
      }

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You've been invited to join Catalyst Sales Tools</h2>
          <p>Hello ${user.name},</p>
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

Hello ${user.name},

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

      return NextResponse.json({
        success: true,
        inviteUrl: loginUrl,
        inviteToken,
        message: 'Invite email sent successfully',
      });
    } catch (emailError: any) {
      console.error('Error sending invite email:', emailError);
      return NextResponse.json({
        success: false,
        inviteUrl: loginUrl,
        inviteToken,
        error: emailError.message || 'Failed to send email',
        message: 'Invite token generated, but email could not be sent. Share this link manually: ' + loginUrl,
      });
    }
  } catch (error: any) {
    console.error('Error generating invite:', error);
    return NextResponse.json(
      { error: 'Failed to generate invite', details: error.message },
      { status: 500 }
    );
  }
}


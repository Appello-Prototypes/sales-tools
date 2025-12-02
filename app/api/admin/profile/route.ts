import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const authUser = verifyAuth(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { name, email } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    const user: any = await (User as any).findById(authUser.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user fields
    user.name = name;
    
    // Only update email if user doesn't have Google OAuth
    if (!user.googleOAuth || !user.googleOAuth.refreshToken) {
      // Check if email is already taken by another user
      const existingUser = await (User as any).findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: authUser.userId }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        );
      }
      
      user.email = email.toLowerCase();
    }
    
    await user.save();
    
    const userDoc = await (User as any).findById(authUser.userId).select('-passwordHash').lean();
    
    return NextResponse.json({
      success: true,
      user: userDoc,
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  }
}


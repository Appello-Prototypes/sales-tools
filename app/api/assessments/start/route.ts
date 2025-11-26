import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email } = body;
    
    const submissionId = uuidv4();
    const startedAt = new Date();
    
    // Create new assessment
    const assessment = new Assessment({
      submissionId,
      email: email || undefined,
      startedAt,
      status: 'in_progress',
      currentStep: 1,
      section1: {},
      section2: {},
      section3: {},
      section4: {},
      section5: {},
    });
    
    await assessment.save();
    
    return NextResponse.json({
      submissionId,
      currentStep: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });
  } catch (error: any) {
    console.error('Error starting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to start assessment', details: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    await connectDB();
    
    const { submissionId } = await params;
    const body = await request.json();
    const { step, data } = body;
    
    const assessment: any = await (Assessment as any).findOne({ submissionId });
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    // Update assessment with new data
    // Handle top-level fields
    if (data.companyName !== undefined) {
      assessment.companyName = data.companyName;
    }
    if (data.website !== undefined) {
      assessment.website = data.website;
    }
    if (data.name !== undefined) {
      assessment.name = data.name;
    }
    if (data.email !== undefined) {
      assessment.email = data.email;
    }
    
    // Handle section data
    if (data.section1) {
      assessment.section1 = { ...assessment.section1, ...data.section1 };
    }
    if (data.section2) {
      assessment.section2 = { ...assessment.section2, ...data.section2 };
    }
    if (data.section3) {
      assessment.section3 = { ...assessment.section3, ...data.section3 };
    }
    if (data.section4) {
      assessment.section4 = { ...assessment.section4, ...data.section4 };
    }
    if (data.section5) {
      assessment.section5 = { ...assessment.section5, ...data.section5 };
    }
    
    assessment.currentStep = step;
    assessment.status = 'in_progress';
    
    // Capture metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || undefined;
    
    if (!assessment.ipAddress) assessment.ipAddress = ipAddress;
    if (!assessment.userAgent) assessment.userAgent = userAgent;
    if (!assessment.referrer) assessment.referrer = referrer;
    
    await assessment.save();
    
    return NextResponse.json({
      success: true,
      currentStep: step,
      savedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error saving assessment:', error);
    return NextResponse.json(
      { error: 'Failed to save assessment', details: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { submissionId } = await params;
    
    await connectDB();
    
    const assessment = await Assessment.findOne({ submissionId }).lean();
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    if (!(assessment as any).adminReport) {
      return NextResponse.json(
        { error: 'Admin report not yet generated. Please wait a moment and try again.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      report: {
        adminReport: (assessment as any).adminReport,
        assessment: {
          submissionId: assessment.submissionId,
          name: assessment.name,
          email: assessment.email,
          companyName: assessment.companyName,
          status: assessment.status,
          completedAt: assessment.completedAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin report', details: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    await connectDB();
    
    const { submissionId } = await params;
    
    const assessment: any = await (Assessment as any).findOne({ submissionId }).lean();
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }
    
    // Remove sensitive fields
    const { passwordHash, ...safeAssessment } = assessment as any;
    
    return NextResponse.json(safeAssessment);
  } catch (error: any) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment', details: error.message },
      { status: 500 }
    );
  }
}


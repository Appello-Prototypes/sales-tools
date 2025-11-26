import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { submissionIds } = await request.json();
    
    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid submission IDs' },
        { status: 400 }
      );
    }
    
    const result = await Assessment.deleteMany({
      submissionId: { $in: submissionIds }
    });
    
    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} assessment(s)`,
    });
  } catch (error: any) {
    console.error('Error bulk deleting assessments:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessments', details: error.message },
      { status: 500 }
    );
  }
}


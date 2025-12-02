import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Estimate from '@/models/Estimate';
import { verifyAuth } from '@/lib/auth';

// GET - Fetch single estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { estimateId } = await params;
    const estimate = await Estimate.findById(estimateId).lean();
    
    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }
    
    return NextResponse.json({ estimate });
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimate' },
      { status: 500 }
    );
  }
}

// PUT - Update estimate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { estimateId } = await params;
    const body = await request.json();
    
    const estimate = await Estimate.findByIdAndUpdate(
      estimateId,
      {
        ...body,
        lastModifiedBy: user.email,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, estimate });
  } catch (error) {
    console.error('Error updating estimate:', error);
    return NextResponse.json(
      { error: 'Failed to update estimate' },
      { status: 500 }
    );
  }
}

// DELETE - Delete estimate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { estimateId } = await params;
    const estimate = await Estimate.findByIdAndDelete(estimateId);
    
    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json(
      { error: 'Failed to delete estimate' },
      { status: 500 }
    );
  }
}

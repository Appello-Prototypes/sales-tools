import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { letterId } = await params;
    const letter: any = await (GeneratedLetter as any).findById(letterId);

    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    return NextResponse.json({ letter });
  } catch (error: any) {
    console.error('Error fetching letter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch letter', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { letterId } = await params;
    const body = await request.json();
    const { generatedText, status, recipientName, recipientTitle } = body;

    const letter: any = await (GeneratedLetter as any).findById(letterId);
    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    if (generatedText !== undefined) letter.generatedText = generatedText;
    if (status !== undefined) letter.status = status;
    if (recipientName !== undefined) letter.recipientName = recipientName;
    if (recipientTitle !== undefined) letter.recipientTitle = recipientTitle;
    letter.updatedBy = user.userId;

    await letter.save();

    return NextResponse.json({ letter });
  } catch (error: any) {
    console.error('Error updating letter:', error);
    return NextResponse.json(
      { error: 'Failed to update letter', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { letterId } = await params;
    const letter: any = await (GeneratedLetter as any).findByIdAndDelete(letterId);

    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Letter deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting letter:', error);
    return NextResponse.json(
      { error: 'Failed to delete letter', details: error.message },
      { status: 500 }
    );
  }
}




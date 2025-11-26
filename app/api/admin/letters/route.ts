import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } },
        { generatedText: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [letters, total] = await Promise.all([
      GeneratedLetter.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GeneratedLetter.countDocuments(query),
    ]);

    return NextResponse.json({
      letters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching letters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch letters', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const {
      companyId,
      companyName,
      companyDomain,
      companyIndustry,
      companyLocation,
      recipientName,
      recipientTitle,
      generatedText,
      originalPrompt,
      aiModel,
      status,
    } = body;

    const letter = await GeneratedLetter.create({
      companyId,
      companyName,
      companyDomain,
      companyIndustry,
      companyLocation,
      recipientName,
      recipientTitle,
      generatedText,
      originalPrompt,
      aiModel,
      status: status || 'draft',
      createdBy: user.userId,
      updatedBy: user.userId,
    });

    return NextResponse.json({ letter }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating letter:', error);
    return NextResponse.json(
      { error: 'Failed to create letter', details: error.message },
      { status: 500 }
    );
  }
}




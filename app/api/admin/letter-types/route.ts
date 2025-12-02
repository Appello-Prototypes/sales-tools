import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LetterType from '@/models/LetterType';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const letterTypes = await LetterType.find({ isActive: true })
      .sort({ isDefault: -1, name: 1 })
      .lean();

    // If no letter types exist, create defaults
    if (letterTypes.length === 0) {
      const defaultTypes = [
        {
          name: 'Cold Call',
          description: 'Outreach to potential customers',
          systemPrompt: 'You are writing personalized cold call letters for Appello Inc., a B2B SaaS platform for ICI subcontractors.',
          userPromptTemplate: 'Write a professional cold call letter for {{companyName}}.',
          isDefault: true,
          isActive: true,
          createdBy: user.userId || 'system',
          updatedBy: user.userId || 'system',
        },
        {
          name: 'Internal',
          description: 'Internal company communications',
          systemPrompt: 'You are writing internal communications for Appello Inc.',
          userPromptTemplate: 'Write an internal letter for {{recipientName}}.',
          isDefault: false,
          isActive: true,
          createdBy: user.userId || 'system',
          updatedBy: user.userId || 'system',
        },
      ];

      await LetterType.insertMany(defaultTypes);
      const newTypes = await LetterType.find({ isActive: true }).lean();
      return NextResponse.json({ letterTypes: newTypes });
    }

    return NextResponse.json({ letterTypes });
  } catch (error: any) {
    console.error('Error fetching letter types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch letter types', details: error.message },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { name, description, systemPrompt, userPromptTemplate, isDefault } = body;

    if (!name || !systemPrompt || !userPromptTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await LetterType.updateMany({ isDefault: true }, { isDefault: false });
    }

    const letterType = new LetterType({
      name,
      description,
      systemPrompt,
      userPromptTemplate,
      isDefault: isDefault || false,
      isActive: true,
      createdBy: user.userId || 'admin',
      updatedBy: user.userId || 'admin',
    });

    await letterType.save();

    return NextResponse.json({
      success: true,
      letterType,
    });
  } catch (error: any) {
    console.error('Error creating letter type:', error);
    return NextResponse.json(
      { error: 'Failed to create letter type', details: error.message },
      { status: 500 }
    );
  }
}


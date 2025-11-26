import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { DEFAULT_SCORING_CONFIG, getScoringConfig, saveScoringConfig } from '@/lib/config/scoringConfig';
import connectDB from '@/lib/mongodb';
import AssessmentConfig from '@/models/AssessmentConfig';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const config = await getScoringConfig();
    
    // Try to load custom prompts from database
    await connectDB();
    const dbConfig = await AssessmentConfig.findOne({ type: 'scoring' }).lean();
    
    return NextResponse.json({
      config,
      customPrompts: (dbConfig as any)?.customPrompts || {},
    });
  } catch (error: any) {
    console.error('Error loading scoring config:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration', details: error.message },
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
    
    const body = await request.json();
    const { config, customPrompts } = body;
    
    // Validate weights total 100
    const totalWeight = (Object.values(config.weights) as number[]).reduce((sum: number, w: number) => sum + w, 0);
    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: `Total weights must equal 100, got ${totalWeight}` },
        { status: 400 }
      );
    }
    
    // Save to database
    await connectDB();
    await AssessmentConfig.findOneAndUpdate(
      { type: 'scoring' },
      {
        type: 'scoring',
        config,
        customPrompts: customPrompts || {},
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving scoring config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration', details: error.message },
      { status: 500 }
    );
  }
}


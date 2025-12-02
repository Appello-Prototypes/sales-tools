/**
 * Letter Studio Prompt Configuration API
 * 
 * GET - Retrieve current prompt configuration
 * PUT - Update prompt configuration
 * POST - Add custom letter type
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LetterPromptConfig, {
  getPromptConfig,
  updatePromptConfig,
  addCustomLetterType,
  updateLetterType,
  deleteLetterType,
  ILetterType,
} from '@/models/LetterPromptConfig';

// GET - Retrieve prompt configuration
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const config = await getPromptConfig();

    return NextResponse.json({
      success: true,
      config: {
        systemPrompt: config.systemPrompt,
        letterTypes: config.letterTypes,
        tones: config.tones,
        defaults: config.defaults,
        researchInstructions: config.researchInstructions,
        qualityStandards: config.qualityStandards,
        version: config.version,
        lastUpdatedBy: config.lastUpdatedBy,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting prompt config:', error);
    return NextResponse.json(
      { error: 'Failed to get prompt configuration', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update prompt configuration
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const {
      systemPrompt,
      letterTypes,
      tones,
      defaults,
      researchInstructions,
      qualityStandards,
    } = body;

    // Build updates object with only provided fields
    const updates: any = {};
    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;
    if (letterTypes !== undefined) updates.letterTypes = letterTypes;
    if (tones !== undefined) updates.tones = tones;
    if (defaults !== undefined) updates.defaults = defaults;
    if (researchInstructions !== undefined) updates.researchInstructions = researchInstructions;
    if (qualityStandards !== undefined) updates.qualityStandards = qualityStandards;

    const config = await updatePromptConfig(updates, user.userId || 'unknown');

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        systemPrompt: config.systemPrompt,
        letterTypes: config.letterTypes,
        tones: config.tones,
        defaults: config.defaults,
        researchInstructions: config.researchInstructions,
        qualityStandards: config.qualityStandards,
        version: config.version,
        lastUpdatedBy: config.lastUpdatedBy,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating prompt config:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt configuration', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add custom letter type
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { action, letterType, typeId, updates } = body;

    if (action === 'add_letter_type') {
      if (!letterType || !letterType.id || !letterType.name || !letterType.prompt) {
        return NextResponse.json(
          { error: 'Letter type must have id, name, and prompt' },
          { status: 400 }
        );
      }

      const config = await addCustomLetterType(
        {
          id: letterType.id,
          name: letterType.name,
          description: letterType.description || '',
          prompt: letterType.prompt,
          icon: letterType.icon || 'FileText',
          isActive: letterType.isActive ?? true,
        },
        user.userId || 'unknown'
      );

      return NextResponse.json({
        success: true,
        message: 'Letter type added successfully',
        letterTypes: config.letterTypes,
      });
    }

    if (action === 'update_letter_type') {
      if (!typeId) {
        return NextResponse.json(
          { error: 'Type ID is required' },
          { status: 400 }
        );
      }

      const config = await updateLetterType(typeId, updates, user.userId || 'unknown');

      return NextResponse.json({
        success: true,
        message: 'Letter type updated successfully',
        letterTypes: config.letterTypes,
      });
    }

    if (action === 'delete_letter_type') {
      if (!typeId) {
        return NextResponse.json(
          { error: 'Type ID is required' },
          { status: 400 }
        );
      }

      const config = await deleteLetterType(typeId, user.userId || 'unknown');

      return NextResponse.json({
        success: true,
        message: 'Letter type deleted successfully',
        letterTypes: config.letterTypes,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: add_letter_type, update_letter_type, or delete_letter_type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error with letter type action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

// Available Anthropic Claude models
const AVAILABLE_MODELS = [
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    description: 'Latest and most capable model with advanced reasoning',
    recommended: true,
    default: true,
    category: 'latest',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude Sonnet 3.5',
    description: 'Previous generation, excellent performance',
    recommended: false,
    default: false,
    category: 'standard',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude Opus 3',
    description: 'Most powerful model for complex tasks',
    recommended: false,
    default: false,
    category: 'standard',
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude Haiku 3',
    description: 'Fast and efficient for simple tasks',
    recommended: false,
    default: false,
    category: 'fast',
  },
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5 (Short)',
    description: 'Latest model with shorter ID',
    recommended: false,
    default: false,
    category: 'latest',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    description: 'Latest fast model',
    recommended: false,
    default: false,
    category: 'fast',
  },
];

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      models: AVAILABLE_MODELS,
      count: AVAILABLE_MODELS.length,
    });
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models', details: error.message },
      { status: 500 }
    );
  }
}




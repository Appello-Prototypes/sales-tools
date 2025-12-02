/**
 * Letter Studio Prompt Configuration History API
 * 
 * GET - Retrieve version history
 * POST - Rollback to a specific version or compare versions
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { rollbackToVersion } from '@/models/LetterPromptConfig';
import { 
  getConfigHistory, 
  getConfigVersion, 
  compareVersions 
} from '@/models/LetterPromptConfigHistory';

// GET - Retrieve version history
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // If version specified, get that specific version
    if (version) {
      const versionData = await getConfigVersion(parseInt(version));
      if (!versionData) {
        return NextResponse.json(
          { error: `Version ${version} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        version: versionData,
      });
    }
    
    // Otherwise, get history list
    const history = await getConfigHistory(limit);
    
    return NextResponse.json({
      success: true,
      history: history.map(h => ({
        version: h.version,
        changeSummary: h.changeSummary,
        action: h.action,
        actionDetails: h.actionDetails,
        changedBy: h.changedBy,
        createdAt: h.createdAt,
        changeCount: h.changes?.length || 0,
      })),
      total: history.length,
    });
  } catch (error: any) {
    console.error('Error getting config history:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration history', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Rollback or compare versions
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { action, targetVersion, compareVersion1, compareVersion2 } = body;

    // Rollback to a specific version
    if (action === 'rollback') {
      if (!targetVersion) {
        return NextResponse.json(
          { error: 'Target version is required for rollback' },
          { status: 400 }
        );
      }

      const config = await rollbackToVersion(
        parseInt(targetVersion),
        user.userId || 'unknown'
      );

      return NextResponse.json({
        success: true,
        message: `Successfully rolled back to version ${targetVersion}`,
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
    }

    // Compare two versions
    if (action === 'compare') {
      if (!compareVersion1 || !compareVersion2) {
        return NextResponse.json(
          { error: 'Both version numbers are required for comparison' },
          { status: 400 }
        );
      }

      const comparison = await compareVersions(
        parseInt(compareVersion1),
        parseInt(compareVersion2)
      );

      return NextResponse.json({
        success: true,
        comparison: {
          version1: comparison.v1 ? {
            version: comparison.v1.version,
            changedBy: comparison.v1.changedBy,
            createdAt: comparison.v1.createdAt,
            configSnapshot: comparison.v1.configSnapshot,
          } : null,
          version2: comparison.v2 ? {
            version: comparison.v2.version,
            changedBy: comparison.v2.changedBy,
            createdAt: comparison.v2.createdAt,
            configSnapshot: comparison.v2.configSnapshot,
          } : null,
          changes: comparison.changes,
        },
      });
    }

    // Get full details of a specific version
    if (action === 'get_version') {
      if (!targetVersion) {
        return NextResponse.json(
          { error: 'Target version is required' },
          { status: 400 }
        );
      }

      const versionData = await getConfigVersion(parseInt(targetVersion));
      if (!versionData) {
        return NextResponse.json(
          { error: `Version ${targetVersion} not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        version: versionData,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: rollback, compare, or get_version' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error with history action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 500 }
    );
  }
}



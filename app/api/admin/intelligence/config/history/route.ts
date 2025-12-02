import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  getIntelligenceConfigHistory,
  getIntelligenceConfigVersion,
} from '@/models/IntelligencePromptConfigHistory';
import { rollbackIntelligenceConfig } from '@/models/IntelligencePromptConfig';

/**
 * GET /api/admin/intelligence/config/history
 * Get configuration history or a specific version
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');
    
    if (version) {
      // Get specific version details
      const versionData = await getIntelligenceConfigVersion(parseInt(version));
      
      if (!versionData) {
        return NextResponse.json(
          { success: false, error: `Version ${version} not found` },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        version: versionData,
      });
    }
    
    // Get history list
    const limit = parseInt(searchParams.get('limit') || '50');
    const history = await getIntelligenceConfigHistory(limit);
    
    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('Error fetching intelligence config history:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/intelligence/config/history
 * Handle rollback action
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, targetVersion, rolledBackBy = 'admin' } = body;
    
    if (action !== 'rollback') {
      return NextResponse.json(
        { success: false, error: `Unknown action: ${action}` },
        { status: 400 }
      );
    }
    
    if (!targetVersion || typeof targetVersion !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Target version is required' },
        { status: 400 }
      );
    }
    
    const config = await rollbackIntelligenceConfig(targetVersion, rolledBackBy);
    
    return NextResponse.json({
      success: true,
      message: `Successfully rolled back to version ${targetVersion}`,
      config: {
        agents: config.agents,
        analysisTypes: config.analysisTypes,
        researchInstructions: config.researchInstructions,
        qualityStandards: config.qualityStandards,
        outputSchema: config.outputSchema,
        version: config.version,
        lastUpdatedBy: config.lastUpdatedBy,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error rolling back intelligence config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



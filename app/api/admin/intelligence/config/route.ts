import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  getIntelligencePromptConfig,
  updateIntelligencePromptConfig,
  updateAgentConfig,
  addAnalysisType,
} from '@/models/IntelligencePromptConfig';

/**
 * GET /api/admin/intelligence/config
 * Get the current intelligence prompt configuration
 */
export async function GET() {
  try {
    await connectDB();
    const config = await getIntelligencePromptConfig();
    
    return NextResponse.json({
      success: true,
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
    console.error('Error fetching intelligence config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/intelligence/config
 * Update configuration fields
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { updatedBy = 'admin', ...updates } = body;
    
    // Validate that we're not trying to update protected fields
    delete updates.version;
    delete updates.lastUpdatedBy;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    const config = await updateIntelligencePromptConfig(updates, updatedBy);
    
    return NextResponse.json({
      success: true,
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
    console.error('Error updating intelligence config:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/intelligence/config
 * Handle special actions (update agent, add analysis type, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, updatedBy = 'admin', ...data } = body;
    
    let config;
    
    switch (action) {
      case 'update_agent': {
        const { agentId, updates } = data;
        if (!agentId || !['deal', 'contact', 'company'].includes(agentId)) {
          return NextResponse.json(
            { success: false, error: 'Invalid agent ID' },
            { status: 400 }
          );
        }
        config = await updateAgentConfig(agentId, updates, updatedBy);
        break;
      }
      
      case 'add_analysis_type': {
        const { analysisType } = data;
        if (!analysisType || !analysisType.id || !analysisType.name) {
          return NextResponse.json(
            { success: false, error: 'Invalid analysis type data' },
            { status: 400 }
          );
        }
        config = await addAnalysisType(analysisType, updatedBy);
        break;
      }
      
      case 'update_analysis_type': {
        const { typeId, updates } = data;
        const currentConfig = await getIntelligencePromptConfig();
        const typeIndex = currentConfig.analysisTypes.findIndex(t => t.id === typeId);
        
        if (typeIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Analysis type not found' },
            { status: 404 }
          );
        }
        
        currentConfig.analysisTypes[typeIndex] = {
          ...currentConfig.analysisTypes[typeIndex],
          ...updates,
          updatedAt: new Date(),
        };
        
        config = await updateIntelligencePromptConfig(
          { analysisTypes: currentConfig.analysisTypes },
          updatedBy
        );
        break;
      }
      
      case 'delete_analysis_type': {
        const { typeId } = data;
        const currentConfig = await getIntelligencePromptConfig();
        const newTypes = currentConfig.analysisTypes.filter(t => t.id !== typeId);
        
        if (newTypes.length === currentConfig.analysisTypes.length) {
          return NextResponse.json(
            { success: false, error: 'Analysis type not found' },
            { status: 404 }
          );
        }
        
        config = await updateIntelligencePromptConfig(
          { analysisTypes: newTypes },
          updatedBy
        );
        break;
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
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
    console.error('Error processing intelligence config action:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



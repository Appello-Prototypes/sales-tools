import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hubspotApiKey = 
      process.env.HUBSPOT_API_KEY || 
      process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
      process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!hubspotApiKey) {
      return NextResponse.json(
        { error: 'HubSpot API key not configured' },
        { status: 500 }
      );
    }

    // Fetch pipelines from HubSpot
    const url = 'https://api.hubapi.com/crm/v3/pipelines/deals';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot Pipelines API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `HubSpot API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Build a map of pipeline ID to pipeline label
    const pipelineMap: Record<string, string> = {};
    // Build a map of stage ID to stage label (keyed by pipeline:stage)
    const stageMap: Record<string, string> = {};
    
    data.results?.forEach((pipeline: any) => {
      const pipelineId = pipeline.id;
      const pipelineLabel = pipeline.label || pipelineId;
      pipelineMap[pipelineId] = pipelineLabel;
      
      // Map stages within this pipeline
      pipeline.stages?.forEach((stage: any) => {
        const stageId = stage.id;
        const stageLabel = stage.label || stageId;
        stageMap[`${pipelineId}:${stageId}`] = stageLabel;
      });
    });
    
    return NextResponse.json({
      pipelines: pipelineMap,
      stages: stageMap,
      pipelineData: data.results || [],
    });
  } catch (error: any) {
    console.error('Error fetching HubSpot pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines', details: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LetterSettings from '@/models/LetterSettings';
import GeneratedLetter from '@/models/GeneratedLetter';

export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { companyId, companyData, recipientName, recipientTitle, companySummary, contacts, deals } = body;

    if (!companyId || !companyData) {
      return NextResponse.json(
        { error: 'Company ID and data are required' },
        { status: 400 }
      );
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Fetch letter settings
    const settings = await LetterSettings.findOne({ settingsType: 'default' });
    if (!settings) {
      return NextResponse.json({ error: 'Letter settings not configured' }, { status: 500 });
    }

    // Build prompt using settings template
    let prompt = settings.userPromptTemplate
      .replace(/\{\{companyName\}\}/g, companyData.name)
      .replace(/\{\{industry\}\}/g, companyData.industry || 'Not specified')
      .replace(/\{\{location\}\}/g, companyData.city ? `${companyData.city}, ${companyData.state || ''}` : 'Not specified')
      .replace(/\{\{website\}\}/g, companyData.website || companyData.domain || 'Not specified')
      .replace(/\{\{employees\}\}/g, companyData.employees || 'Not specified');

    if (recipientName) {
      prompt = prompt.replace(/\{\{#if recipientName\}\}/g, '');
      prompt = prompt.replace(/\{\{\/if\}\}/g, '');
      prompt = prompt.replace(/\{\{recipientName\}\}/g, recipientName);
      prompt = prompt.replace(/\{\{#if recipientTitle\}\}/g, recipientTitle ? '' : '');
      prompt = prompt.replace(/\{\{recipientTitle\}\}/g, recipientTitle || '');
    } else {
      // Remove recipient section if no recipient
      prompt = prompt.replace(/\{\{#if recipientName\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    if (companySummary) {
      prompt = prompt.replace(/\{\{#if companySummary\}\}/g, '');
      prompt = prompt.replace(/\{\{companySummary\}\}/g, companySummary);
      prompt = prompt.replace(/\{\{\/if\}\}/g, '');
    } else {
      prompt = prompt.replace(/\{\{#if companySummary\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    if (contacts && contacts.length > 0) {
      const contactsText = contacts.map((c: any) => 
        `- ${c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim()} (${c.jobTitle || 'No title'}) - ${c.email || 'No email'}`
      ).join('\n');
      prompt = prompt.replace(/\{\{#if contacts\}\}/g, '');
      prompt = prompt.replace(/\{\{contacts\}\}/g, contactsText);
      prompt = prompt.replace(/\{\{\/if\}\}/g, '');
    } else {
      prompt = prompt.replace(/\{\{#if contacts\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    if (deals && deals.length > 0) {
      const dealsText = deals.map((d: any) => 
        `- ${d.name || 'Unnamed'} - Stage: ${d.stage || 'Unknown'} - Value: ${d.amount ? `$${d.amount}` : 'Not specified'}`
      ).join('\n');
      prompt = prompt.replace(/\{\{#if deals\}\}/g, '');
      prompt = prompt.replace(/\{\{deals\}\}/g, dealsText);
      prompt = prompt.replace(/\{\{\/if\}\}/g, '');
    } else {
      prompt = prompt.replace(/\{\{#if deals\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    // Clean up any remaining template syntax
    prompt = prompt.replace(/\{\{[^}]+\}\}/g, '');

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.aiModel,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Anthropic API Error:', aiResponse.status, errorText);
      return NextResponse.json(
        { error: `Failed to generate letter: ${aiResponse.status}`, details: errorText },
        { status: aiResponse.status }
      );
    }

    const data = await aiResponse.json();
    const letter = data.content[0]?.text || '';

    // Save generated letter to DB
    const newLetter = await GeneratedLetter.create({
      companyId,
      companyName: companyData.name,
      companyDomain: companyData.domain,
      companyIndustry: companyData.industry,
      companyLocation: companyData.city ? `${companyData.city}, ${companyData.state || ''}` : undefined,
      recipientName,
      recipientTitle,
      generatedText: letter,
      originalPrompt: prompt,
      aiModel: settings.aiModel,
      createdBy: user.userId,
      status: 'draft',
    });

    return NextResponse.json({ 
      letter,
      letterId: newLetter._id.toString(),
      companyId,
      companyName: companyData.name,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating letter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate letter' },
      { status: 500 }
    );
  }
}


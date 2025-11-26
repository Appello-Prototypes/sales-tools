import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';
import LetterSettings from '@/models/LetterSettings';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { letterId } = await params;
    const { feedback } = await request.json();

    const letter = await GeneratedLetter.findById(letterId);
    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    const settings = await LetterSettings.findOne({ settingsType: 'default' });
    if (!settings) {
      return NextResponse.json({ error: 'Letter settings not configured' }, { status: 500 });
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Build prompt using original prompt + feedback
    let prompt = letter.originalPrompt;
    if (feedback) {
      prompt += `\n\nUser Feedback for Regeneration: ${feedback}\n\nPlease regenerate the letter incorporating this feedback.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to regenerate letter', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const regeneratedText = data.content[0]?.text || '';

    letter.generatedText = regeneratedText;
    letter.feedback = feedback;
    letter.updatedBy = user.userId;
    await letter.save();

    return NextResponse.json({ letter: regeneratedText });
  } catch (error: any) {
    console.error('Error regenerating letter:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate letter', details: error.message },
      { status: 500 }
    );
  }
}


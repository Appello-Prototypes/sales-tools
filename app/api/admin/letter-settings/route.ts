import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LetterSettings from '@/models/LetterSettings';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    let settings: any = await (LetterSettings as any).findOne({ settingsType: 'default' });

    if (!settings) {
      // Create default settings
      settings = await (LetterSettings as any).create({
        settingsType: 'default',
        aiModel: 'claude-sonnet-4-5-20250929',
        maxTokens: 2000,
        temperature: 0.7,
        systemPrompt: `You are writing personalized cold call letters for Appello Inc., a B2B SaaS platform for ICI subcontractors.

Your letters should be:
- Professional and personalized based on company context
- Clear and concise (3-4 paragraphs maximum)
- Actionable with specific benefits relevant to the recipient's trade
- Include concrete examples when possible
- Maintain an approachable but professional tone
- Focus on solving real operational challenges

When writing letters:
- Always personalize the opening based on company industry/location
- Highlight benefits specific to ICI subcontractors (mobile timesheets, job costing, union wage rules)
- Include specific metrics or outcomes when available
- End with a clear, low-pressure call-to-action
- Use the company intelligence summary to add relevant context
- Reference contacts and deals when they add value to the message

Format letters as plain text suitable for email or mail. Avoid overly salesy language—focus on partnership and solving problems.`,
        userPromptTemplate: `Company Information:
- Name: {{companyName}}
- Industry: {{industry}}
- Location: {{location}}
- Website: {{website}}
- Employees: {{employees}}
{{#if recipientName}}
- Recipient: {{recipientName}}{{#if recipientTitle}}, {{recipientTitle}}{{/if}}
{{/if}}
{{#if companySummary}}

Company Intelligence Summary:
{{companySummary}}
{{/if}}
{{#if contacts}}

Key Contacts:
{{contacts}}
{{/if}}
{{#if deals}}

Active Deals:
{{deals}}
{{/if}}

Write a professional, personalized cold call letter that:
1. Opens with a personalized hook based on the company's industry/location
2. Introduces Appello and its value proposition for ICI subcontractors
3. Highlights key benefits (mobile timesheets, job costing, real-time visibility, union wage rules support)
4. Includes a clear call-to-action
5. Maintains a professional but approachable tone
6. Is concise (3-4 paragraphs max)

Format the letter as plain text suitable for email or mail.`,
        approvedSamples: [
          {
            name: 'HVAC Contractor Example',
            description: 'Professional letter for HVAC contractors focusing on field operations',
            content: `Dear [Recipient Name],

I hope this letter finds you well. I'm reaching out because I noticed [Company Name] specializes in HVAC installation and maintenance—a field where operational efficiency can make all the difference.

At Appello, we've built a B2B SaaS platform specifically designed for ICI subcontractors like yourself. We understand the unique challenges you face: managing field crews across multiple job sites, tracking time accurately for union wage rules, and ensuring job costing stays on budget.

Our platform offers:
• Mobile timesheets with GPS tracking for accurate field time capture
• Automated union wage rule calculations to eliminate payroll errors
• Real-time job costing visibility so you always know where you stand
• Seamless integration with your existing accounting systems

Many contractors similar to [Company Name] have reduced payroll processing time by 60% and improved job profitability visibility significantly.

I'd love to show you how Appello could help streamline your operations. Would you be available for a brief 15-minute call next week to discuss your specific needs?

Best regards,
[Your Name]
Appello Inc.`,
            createdAt: new Date(),
          },
          {
            name: 'Electrical Contractor Example',
            description: 'Focused on project management and cost control for electrical contractors',
            content: `Dear [Recipient Name],

I'm writing to introduce Appello, a construction management platform built specifically for ICI electrical contractors like [Company Name].

Having worked with electrical contractors across North America, I know firsthand the complexity of managing multiple projects, coordinating field teams, and ensuring accurate job costing—especially when dealing with complex union wage structures and change orders.

Appello helps electrical contractors:
• Track field time accurately with mobile timesheets and GPS verification
• Automate union wage calculations (prevailing wage, overtime, travel time)
• Monitor job costs in real-time to catch budget issues early
• Generate accurate reports for project managers and accounting

The result? Better project profitability, fewer payroll errors, and more time to focus on growing your business.

I'd appreciate the opportunity to show you how [Company Name] could benefit from Appello. Would you be open to a quick 15-minute demo next week?

Looking forward to connecting.

Best regards,
[Your Name]
Appello Inc.`,
            createdAt: new Date(),
          },
          {
            name: 'Mechanical Insulation Example',
            description: 'Emphasizes specialized trade needs and compliance requirements',
            content: `Dear [Recipient Name],

I hope this message finds you well. I'm reaching out because I see that [Company Name] specializes in mechanical insulation—a trade where precision, compliance, and operational efficiency are critical to success.

At Appello, we've developed a construction management platform specifically for specialized ICI subcontractors. We understand that mechanical insulation contractors face unique challenges:
• Managing crews across industrial and commercial sites
• Ensuring compliance with union agreements and wage rules
• Tracking material costs accurately for job profitability
• Coordinating with GCs and other trades effectively

Our platform provides:
• Mobile-first timesheet capture with GPS tracking
• Automated union wage rule calculations
• Real-time job costing and budget tracking
• Integration with major accounting systems

Many mechanical insulation contractors have found that Appello helps them reduce administrative overhead while improving job visibility and profitability.

I'd love to show you how Appello could help [Company Name] streamline operations and improve profitability. Would you be available for a brief call next week?

Best regards,
[Your Name]
Appello Inc.`,
            createdAt: new Date(),
          },
        ],
        createdBy: user.userId,
        updatedBy: user.userId,
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error fetching letter settings:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        error: 'Failed to fetch settings',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { aiModel, maxTokens, temperature, systemPrompt, userPromptTemplate, approvedSamples } = body;

    let settings: any = await (LetterSettings as any).findOne({ settingsType: 'default' });

    if (!settings) {
      settings = await (LetterSettings as any).create({
        settingsType: 'default',
        aiModel: aiModel || 'claude-sonnet-4-5-20250929',
        maxTokens: maxTokens || 2000,
        temperature: temperature !== undefined ? temperature : 0.7,
        systemPrompt: systemPrompt || 'You are writing a personalized cold call letter for Appello Inc., a B2B SaaS platform for ICI subcontractors.',
        userPromptTemplate: userPromptTemplate || '',
        approvedSamples: approvedSamples || [],
        createdBy: user.userId,
        updatedBy: user.userId,
      });
    } else {
      if (aiModel !== undefined) settings.aiModel = aiModel;
      if (maxTokens !== undefined) settings.maxTokens = maxTokens;
      if (temperature !== undefined) settings.temperature = temperature;
      if (systemPrompt !== undefined) settings.systemPrompt = systemPrompt;
      if (userPromptTemplate !== undefined) settings.userPromptTemplate = userPromptTemplate;
      if (approvedSamples !== undefined) settings.approvedSamples = approvedSamples;
      settings.updatedBy = user.userId;
      await settings.save();
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error updating letter settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}


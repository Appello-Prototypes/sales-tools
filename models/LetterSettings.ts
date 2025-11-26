import mongoose, { Schema, Document } from 'mongoose';

export interface ILetterSettings extends Document {
  settingsType: string; // Always 'default' to ensure only one document
  aiModel: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  userPromptTemplate: string;
  approvedSamples: Array<{
    name: string;
    content: string;
    description?: string;
    createdAt: Date;
  }>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const LetterSettingsSchema = new Schema<ILetterSettings>(
  {
    settingsType: { type: String, default: 'default', required: true, unique: true },
    aiModel: { type: String, default: 'claude-sonnet-4-5-20250929', required: true },
    maxTokens: { type: Number, default: 2000, required: true },
    temperature: { type: Number, default: 0.7, min: 0, max: 1, required: true },
    systemPrompt: {
      type: String,
      required: true,
      default: `You are writing personalized cold call letters for Appello Inc., a B2B SaaS platform for ICI subcontractors.

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
    },
    userPromptTemplate: {
      type: String,
      required: true,
      default: `Company Information:
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
    },
    approvedSamples: [
      {
        name: { type: String, required: true },
        content: { type: String, required: true },
        description: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.LetterSettings || mongoose.model<ILetterSettings>('LetterSettings', LetterSettingsSchema);


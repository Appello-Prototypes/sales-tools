import mongoose, { Schema, Document } from 'mongoose';

export interface IGeneratedLetter extends Document {
  companyId: string;
  companyName: string;
  companyDomain?: string;
  companyIndustry?: string;
  companyLocation?: string;
  recipientName?: string;
  recipientTitle?: string;
  generatedText: string;
  originalPrompt: string;
  feedback?: string;
  aiModel: string;
  status: 'draft' | 'approved' | 'sent' | 'archived';
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedLetterSchema = new Schema<IGeneratedLetter>(
  {
    companyId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    companyDomain: { type: String },
    companyIndustry: { type: String },
    companyLocation: { type: String },
    recipientName: { type: String },
    recipientTitle: { type: String },
    generatedText: { type: String, required: true },
    originalPrompt: { type: String, required: true },
    feedback: { type: String },
    aiModel: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'approved', 'sent', 'archived'],
      default: 'draft',
    },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true }
);

GeneratedLetterSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.models.GeneratedLetter || mongoose.model<IGeneratedLetter>('GeneratedLetter', GeneratedLetterSchema);




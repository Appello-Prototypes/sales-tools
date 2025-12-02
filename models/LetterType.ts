import mongoose, { Schema, Document } from 'mongoose';

export interface ILetterType extends Document {
  name: string;
  description?: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const LetterTypeSchema = new Schema<ILetterType>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    systemPrompt: { type: String, required: true },
    userPromptTemplate: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true }
);

LetterTypeSchema.index({ isActive: 1, isDefault: 1 });

export default mongoose.models.LetterType || mongoose.model<ILetterType>('LetterType', LetterTypeSchema);


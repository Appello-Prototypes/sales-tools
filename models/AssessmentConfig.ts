import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessmentConfig extends Document {
  type: 'scoring' | 'roi' | 'ai';
  config?: any;
  customPrompts?: Record<string, string>;
  updatedAt: Date;
}

const AssessmentConfigSchema = new Schema<IAssessmentConfig>(
  {
    type: { type: String, required: true, unique: true },
    config: { type: Schema.Types.Mixed },
    customPrompts: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

export default mongoose.models.AssessmentConfig || mongoose.model<IAssessmentConfig>('AssessmentConfig', AssessmentConfigSchema);


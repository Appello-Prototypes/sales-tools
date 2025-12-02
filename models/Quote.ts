import mongoose, { Schema, Document } from 'mongoose';

export interface IQuote extends Document {
  quoteNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerCompany?: string;
  numUsers: number;
  tier: number;
  selectedModules: string[];
  hasNIADiscount: boolean;
  paymentFrequency: 'monthly' | 'quarterly' | 'annual';
  calculations: {
    userCostPerUser: number;
    totalUserCost: number;
    serverStorageCost: number;
    totalModuleCost: number;
    monthlySubscriptionSubtotal: number;
    taxAmount: number;
    monthlySubscriptionWithTax: number;
    onboardingCost: number;
    monthlyEquivalent: number;
    paymentAmount: number;
    annualEquivalent: number;
    savings: number;
    selectedModulesCount: number;
  };
  firstYearTotal: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  expiresAt?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    quoteNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String },
    customerEmail: { type: String },
    customerCompany: { type: String },
    numUsers: { type: Number, required: true },
    tier: { type: Number, required: true },
    selectedModules: [{ type: String }],
    hasNIADiscount: { type: Boolean, default: false },
    paymentFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      required: true,
    },
    calculations: {
      userCostPerUser: { type: Number, required: true },
      totalUserCost: { type: Number, required: true },
      serverStorageCost: { type: Number, required: true },
      totalModuleCost: { type: Number, required: true },
      monthlySubscriptionSubtotal: { type: Number, required: true },
      taxAmount: { type: Number, required: true },
      monthlySubscriptionWithTax: { type: Number, required: true },
      onboardingCost: { type: Number, required: true },
      monthlyEquivalent: { type: Number, required: true },
      paymentAmount: { type: Number, required: true },
      annualEquivalent: { type: Number, required: true },
      savings: { type: Number, required: true },
      selectedModulesCount: { type: Number, required: true },
    },
    firstYearTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
      default: 'draft',
    },
    expiresAt: { type: Date },
    notes: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

QuoteSchema.index({ quoteNumber: 1 });
QuoteSchema.index({ customerEmail: 1, createdAt: -1 });
QuoteSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Quote || mongoose.model<IQuote>('Quote', QuoteSchema);


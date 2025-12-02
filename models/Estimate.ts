import mongoose, { Schema, Document } from 'mongoose';

// Line item types for flexibility
export type LineItemType = 
  | 'onboarding'
  | 'user_subscription'
  | 'server_storage'
  | 'module'
  | 'custom';

export interface ILineItem {
  id: string;
  type: LineItemType;
  description: string;
  included: boolean;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discount: number; // percentage
  discountedPrice: number;
  notes?: string;
  isOverridden?: boolean;
}

export interface IDiscount {
  id: string;
  name: string;
  percentage: number;
  appliedTo: 'subtotal' | 'modules' | 'users' | 'onboarding' | 'server' | 'all';
  amount: number; // calculated amount
  enabled: boolean;
}

export interface IEstimate extends Document {
  estimateNumber: string;
  
  // Customer Information
  preparedFor: {
    companyName: string;
    contactName: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  
  // Linked HubSpot Records
  hubspotDealId?: string;
  hubspotCompanyId?: string;
  hubspotContactId?: string;
  
  // Configuration
  numberOfUsers: number;
  moduleTier: number;
  currency: 'CAD' | 'USD';
  
  // Line Items
  lineItems: ILineItem[];
  
  // Discounts
  discounts: IDiscount[];
  
  // Calculated Totals
  totals: {
    modulePrice: number;
    userPrice: number;
    serverStorage: number;
    subtotal: number;
    totalDiscounts: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  };
  
  // Payment Options (calculated)
  paymentOptions: {
    monthly: {
      amount: number;
      annual: number;
      monthlyEquiv: number;
    };
    quarterly: {
      amount: number;
      annual: number;
      monthlyEquiv: number;
      savings?: number;
      discountPct?: number;
    };
    annual: {
      amount: number;
      annual: number;
      monthlyEquiv: number;
      savings?: number;
      discountPct?: number;
    };
  };
  
  // Status
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil?: Date;
  
  // Notes
  notes?: string;
  internalNotes?: string;
  
  // Audit
  createdBy: string;
  lastModifiedBy?: string;
  sentAt?: Date;
  acceptedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['onboarding', 'user_subscription', 'server_storage', 'module', 'custom'],
    required: true 
  },
  description: { type: String, required: true },
  included: { type: Boolean, default: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountedPrice: { type: Number, required: true },
  notes: { type: String },
  isOverridden: { type: Boolean, default: false },
}, { _id: false });

const DiscountSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  appliedTo: { 
    type: String, 
    enum: ['subtotal', 'modules', 'users', 'onboarding', 'server', 'all'],
    default: 'all'
  },
  amount: { type: Number, required: true },
  enabled: { type: Boolean, default: true },
}, { _id: false });

const EstimateSchema = new Schema<IEstimate>(
  {
    estimateNumber: { type: String, required: true, unique: true, index: true },
    
    preparedFor: {
      companyName: { type: String, required: true },
      contactName: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    
    hubspotDealId: { type: String, index: true },
    hubspotCompanyId: { type: String, index: true },
    hubspotContactId: { type: String, index: true },
    
    numberOfUsers: { type: Number, required: true },
    moduleTier: { type: Number, required: true },
    currency: { type: String, enum: ['CAD', 'USD'], default: 'CAD' },
    
    lineItems: [LineItemSchema],
    discounts: [DiscountSchema],
    
    totals: {
      modulePrice: { type: Number, default: 0 },
      userPrice: { type: Number, default: 0 },
      serverStorage: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      totalDiscounts: { type: Number, default: 0 },
      taxRate: { type: Number, default: 13 },
      taxAmount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    
    paymentOptions: {
      monthly: {
        amount: { type: Number, default: 0 },
        annual: { type: Number, default: 0 },
        monthlyEquiv: { type: Number, default: 0 },
      },
      quarterly: {
        amount: { type: Number, default: 0 },
        annual: { type: Number, default: 0 },
        monthlyEquiv: { type: Number, default: 0 },
        savings: { type: Number, default: 0 },
        discountPct: { type: Number, default: 8.3 },
      },
      annual: {
        amount: { type: Number, default: 0 },
        annual: { type: Number, default: 0 },
        monthlyEquiv: { type: Number, default: 0 },
        savings: { type: Number, default: 0 },
        discountPct: { type: Number, default: 16.7 },
      },
    },
    
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
      default: 'draft',
    },
    validUntil: { type: Date },
    
    notes: { type: String },
    internalNotes: { type: String },
    
    createdBy: { type: String, required: true },
    lastModifiedBy: { type: String },
    sentAt: { type: Date },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
EstimateSchema.index({ status: 1, createdAt: -1 });
EstimateSchema.index({ 'preparedFor.companyName': 'text', 'preparedFor.contactName': 'text' });

export default mongoose.models.Estimate || mongoose.model<IEstimate>('Estimate', EstimateSchema);

// Type exports for frontend use
export type EstimateLineItem = ILineItem;
export type EstimateDiscount = IDiscount;
export type EstimateData = Omit<IEstimate, keyof Document>;

import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialOrderLineItem {
  productId?: string;
  productName: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  notes?: string;
}

export interface IMaterialOrder extends Document {
  materialOrderNo: string; // e.g., "MO-2025-001"
  jobId: string;
  jobName?: string; // Denormalized
  requiredByDate?: Date;
  priority: 'urgent' | 'standard' | 'low';
  status: 'submitted' | 'approved' | 'po_issued' | 'delivered' | 'closed' | 'cancelled';
  deliveryLocation: 'jobsite' | 'warehouse' | 'pickup';
  deliveryAddress?: string;
  deliveryNotes?: string;
  orderedByUserId?: string;
  orderedByName?: string;
  lineItems: IMaterialOrderLineItem[];
  purchaseOrderId?: string; // Link to PO if converted
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialOrderLineItemSchema = new Schema<IMaterialOrderLineItem>({
  productId: { type: String },
  productName: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  unitOfMeasure: { type: String, required: true },
  notes: { type: String },
}, { _id: false });

const MaterialOrderSchema = new Schema<IMaterialOrder>(
  {
    materialOrderNo: { type: String, required: true, unique: true, index: true },
    jobId: { type: String, required: true, index: true },
    jobName: { type: String },
    requiredByDate: { type: Date, index: true },
    priority: {
      type: String,
      enum: ['urgent', 'standard', 'low'],
      default: 'standard',
    },
    status: {
      type: String,
      enum: ['submitted', 'approved', 'po_issued', 'delivered', 'closed', 'cancelled'],
      default: 'submitted',
      index: true,
    },
    deliveryLocation: {
      type: String,
      enum: ['jobsite', 'warehouse', 'pickup'],
      required: true,
    },
    deliveryAddress: { type: String },
    deliveryNotes: { type: String },
    orderedByUserId: { type: String, index: true },
    orderedByName: { type: String },
    lineItems: [MaterialOrderLineItemSchema],
    purchaseOrderId: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
MaterialOrderSchema.index({ jobId: 1, status: 1 });
MaterialOrderSchema.index({ requiredByDate: 1, priority: 1 });
MaterialOrderSchema.index({ purchaseOrderId: 1 });

export default mongoose.models.MaterialOrder || mongoose.model<IMaterialOrder>('MaterialOrder', MaterialOrderSchema);


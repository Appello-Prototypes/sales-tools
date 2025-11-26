import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrderLineItem {
  productId?: string;
  productName: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  extendedCost: number;
  costCodeId?: string;
  costCodeName?: string;
  notes?: string;
}

export interface IPurchaseOrder extends Document {
  poNumber: string; // e.g., "PO-2025-001"
  vendorId: string; // Reference to Company (supplier)
  vendorName: string; // Denormalized
  jobId: string;
  jobName?: string; // Denormalized
  materialOrderId?: string; // Link to material order if converted from request
  orderDate: Date;
  expectedDeliveryDate?: Date;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  shipToAddress?: string;
  deliveryInstructions?: string;
  internalNotes?: string;
  supplierNotes?: string;
  buyerUserId?: string;
  buyerName?: string;
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: Date;
  subtotal: number;
  tax: number;
  freight: number;
  total: number;
  lineItems: IPurchaseOrderLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderLineItemSchema = new Schema<IPurchaseOrderLineItem>({
  productId: { type: String },
  productName: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  unitOfMeasure: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  extendedCost: { type: Number, required: true, min: 0 },
  costCodeId: { type: String },
  costCodeName: { type: String },
  notes: { type: String },
}, { _id: false });

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true, index: true },
    vendorId: { type: String, required: true, index: true },
    vendorName: { type: String, required: true },
    jobId: { type: String, required: true, index: true },
    jobName: { type: String },
    materialOrderId: { type: String },
    orderDate: { type: Date, required: true, default: Date.now, index: true },
    expectedDeliveryDate: { type: Date, index: true },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'sent', 'partially_received', 'received', 'closed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    shipToAddress: { type: String },
    deliveryInstructions: { type: String },
    internalNotes: { type: String },
    supplierNotes: { type: String },
    buyerUserId: { type: String },
    buyerName: { type: String },
    approvedByUserId: { type: String },
    approvedByName: { type: String },
    approvedAt: { type: Date },
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    freight: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    lineItems: [PurchaseOrderLineItemSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
PurchaseOrderSchema.index({ vendorId: 1, status: 1 });
PurchaseOrderSchema.index({ jobId: 1, status: 1 });
PurchaseOrderSchema.index({ materialOrderId: 1 });
PurchaseOrderSchema.index({ orderDate: -1 });

// Pre-save hook to calculate totals
PurchaseOrderSchema.pre('save', function(next) {
  this.subtotal = this.lineItems.reduce((sum, item) => sum + item.extendedCost, 0);
  this.total = this.subtotal + this.tax + this.freight;
  next();
});

export default mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);


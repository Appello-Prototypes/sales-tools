import mongoose, { Schema, Document } from 'mongoose';

export interface IReceivingLineItem {
  poLineItemIndex: number; // Index of line item in PO
  productId?: string;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  previousReceivedQuantity: number; // Total received before this receipt
  condition: 'good' | 'damaged' | 'incorrect_item';
  notes?: string;
}

export interface IReceiving extends Document {
  receiptNumber: string; // e.g., "REC-2025-001"
  purchaseOrderId: string;
  poNumber: string; // Denormalized
  vendorId: string;
  vendorName: string; // Denormalized
  jobId: string;
  jobName?: string; // Denormalized
  receivedByUserId?: string;
  receivedByName?: string;
  receivedDate: Date;
  deliveryDate?: Date;
  locationPlaced?: string; // e.g., "Floor 3, North Wing" or "Warehouse 1, Aisle 3"
  billOfLadingPhoto?: string; // URL or file path
  materialPhotos?: string[]; // Array of photo URLs
  lineItems: IReceivingLineItem[];
  status: 'pending' | 'completed' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceivingLineItemSchema = new Schema<IReceivingLineItem>({
  poLineItemIndex: { type: Number, required: true },
  productId: { type: String },
  productName: { type: String, required: true },
  orderedQuantity: { type: Number, required: true, min: 0 },
  receivedQuantity: { type: Number, required: true, min: 0 },
  previousReceivedQuantity: { type: Number, default: 0, min: 0 },
  condition: {
    type: String,
    enum: ['good', 'damaged', 'incorrect_item'],
    default: 'good',
  },
  notes: { type: String },
}, { _id: false });

const ReceivingSchema = new Schema<IReceiving>(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    purchaseOrderId: { type: String, required: true, index: true },
    poNumber: { type: String, required: true },
    vendorId: { type: String, required: true, index: true },
    vendorName: { type: String, required: true },
    jobId: { type: String, required: true, index: true },
    jobName: { type: String },
    receivedByUserId: { type: String, index: true },
    receivedByName: { type: String },
    receivedDate: { type: Date, required: true, default: Date.now, index: true },
    deliveryDate: { type: Date },
    locationPlaced: { type: String },
    billOfLadingPhoto: { type: String },
    materialPhotos: [{ type: String }],
    lineItems: [ReceivingLineItemSchema],
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReceivingSchema.index({ purchaseOrderId: 1, receivedDate: -1 });
ReceivingSchema.index({ jobId: 1, receivedDate: -1 });
ReceivingSchema.index({ vendorId: 1, receivedDate: -1 });

export default mongoose.models.Receiving || mongoose.model<IReceiving>('Receiving', ReceivingSchema);


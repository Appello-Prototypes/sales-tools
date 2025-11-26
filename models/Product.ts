import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  supplierId?: string; // Reference to Company (vendor)
  supplierName?: string; // Denormalized for quick access
  supplierCatalogNumber?: string;
  lastPrice?: number;
  standardCost?: number;
  unitOfMeasure: 'EA' | 'FT' | 'M' | 'BOX' | 'ROLL' | 'SQ_FT' | 'GAL' | 'LB' | 'KG' | 'TON';
  category?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    supplierId: { type: String, index: true },
    supplierName: { type: String },
    supplierCatalogNumber: { type: String },
    lastPrice: { type: Number },
    standardCost: { type: Number },
    unitOfMeasure: {
      type: String,
      enum: ['EA', 'FT', 'M', 'BOX', 'ROLL', 'SQ_FT', 'GAL', 'LB', 'KG', 'TON'],
      required: true,
      default: 'EA',
    },
    category: { type: String, index: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ supplierId: 1, isActive: 1 });
ProductSchema.index({ category: 1, isActive: 1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);


import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  productId: string;
  productName?: string; // Denormalized for quick access
  locationId: string;
  locationName: string; // e.g., "Main Warehouse", "Job Site A", "Yard 1"
  locationType: 'warehouse' | 'yard' | 'jobsite' | 'vehicle';
  jobId?: string; // If locationType is 'jobsite'
  onHand: number; // Physical quantity in location
  allocated: number; // Committed to specific jobs/requests
  available: number; // onHand - allocated (calculated)
  onOrder: number; // Quantity on open POs, not yet received
  minLevel?: number;
  maxLevel?: number;
  averageCost?: number; // For valuation
  lastCountDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String },
    locationId: { type: String, required: true },
    locationName: { type: String, required: true },
    locationType: {
      type: String,
      enum: ['warehouse', 'yard', 'jobsite', 'vehicle'],
      required: true,
    },
    jobId: { type: String, index: true },
    onHand: { type: Number, default: 0, min: 0 },
    allocated: { type: Number, default: 0, min: 0 },
    available: { type: Number, default: 0, min: 0 },
    onOrder: { type: Number, default: 0, min: 0 },
    minLevel: { type: Number, min: 0 },
    maxLevel: { type: Number, min: 0 },
    averageCost: { type: Number, min: 0 },
    lastCountDate: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
InventorySchema.index({ productId: 1, locationId: 1 }, { unique: true });
InventorySchema.index({ locationId: 1, locationType: 1 });
InventorySchema.index({ jobId: 1, productId: 1 });

// Virtual for available quantity calculation
InventorySchema.virtual('calculatedAvailable').get(function() {
  return Math.max(0, this.onHand - this.allocated);
});

// Pre-save hook to calculate available quantity
InventorySchema.pre('save', function(next) {
  this.available = Math.max(0, this.onHand - this.allocated);
  next();
});

export default mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);


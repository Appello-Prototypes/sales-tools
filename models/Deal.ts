import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal extends Document {
  hubspotId: string;
  dealname: string;
  amount: string;
  dealstage: string;
  pipeline: string;
  closedate?: Date;
  dealtype?: string;
  ownerId?: string;
  
  // Associated IDs
  companyIds?: string[];
  contactIds?: string[];
  
  // Status flags
  isClosed: boolean;
  isWon: boolean;
  isLost: boolean;
  
  // Additional HubSpot properties
  properties: Record<string, any>;
  
  // Sync tracking
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  syncError?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    hubspotId: { type: String, required: true, unique: true, index: true },
    dealname: { type: String, required: true },
    amount: { type: String, default: '0' },
    dealstage: { type: String, required: true, index: true },
    pipeline: { type: String, required: true, index: true },
    closedate: { type: Date },
    dealtype: { type: String },
    ownerId: { type: String },
    companyIds: [{ type: String }],
    contactIds: [{ type: String }],
    isClosed: { type: Boolean, default: false, index: true },
    isWon: { type: Boolean, default: false },
    isLost: { type: Boolean, default: false },
    properties: { type: Schema.Types.Mixed, default: {} },
    lastSyncedAt: { type: Date, default: Date.now },
    syncStatus: { 
      type: String, 
      enum: ['synced', 'pending', 'error'],
      default: 'synced'
    },
    syncError: { type: String },
  },
  { timestamps: true }
);

DealSchema.index({ hubspotId: 1 });
DealSchema.index({ dealname: 1 }); // For search queries
DealSchema.index({ dealtype: 1 }); // For search queries
DealSchema.index({ pipeline: 1, dealstage: 1 });
DealSchema.index({ isClosed: 1 });
DealSchema.index({ companyIds: 1 });
DealSchema.index({ contactIds: 1 });
DealSchema.index({ lastSyncedAt: -1 });
DealSchema.index({ syncStatus: 1 });
// Compound index for sorting by lastSyncedAt with dealname lookup
DealSchema.index({ lastSyncedAt: -1, dealname: 1 });

export default mongoose.models.Deal || mongoose.model<IDeal>('Deal', DealSchema);


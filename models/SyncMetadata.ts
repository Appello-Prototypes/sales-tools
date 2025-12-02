import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncMetadata extends Document {
  entityType: 'contacts' | 'companies' | 'deals';
  lastFullSyncAt: Date | null;
  lastIncrementalSyncAt: Date | null;
  totalRecords: number;
  syncInProgress: boolean;
  lastSyncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SyncMetadataSchema = new Schema<ISyncMetadata>(
  {
    entityType: { 
      type: String, 
      required: true, 
      unique: true,
      enum: ['contacts', 'companies', 'deals']
    },
    lastFullSyncAt: { type: Date, default: null },
    lastIncrementalSyncAt: { type: Date, default: null },
    totalRecords: { type: Number, default: 0 },
    syncInProgress: { type: Boolean, default: false },
    lastSyncError: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.SyncMetadata || mongoose.model<ISyncMetadata>('SyncMetadata', SyncMetadataSchema);



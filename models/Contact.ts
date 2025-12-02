import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  hubspotId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  jobTitle?: string;
  phone?: string;
  company?: string;
  companyId?: string; // HubSpot company ID
  fullName: string;
  
  // Additional HubSpot properties
  properties: Record<string, any>;
  
  // Sync tracking
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  syncError?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    hubspotId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, index: true },
    jobTitle: { type: String },
    phone: { type: String },
    company: { type: String },
    companyId: { type: String, index: true },
    fullName: { type: String, required: true },
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

ContactSchema.index({ hubspotId: 1 });
ContactSchema.index({ email: 1 });
ContactSchema.index({ firstName: 1 }); // For search queries
ContactSchema.index({ lastName: 1 }); // For search queries
ContactSchema.index({ fullName: 1 }); // For search queries
ContactSchema.index({ company: 1 }); // For search queries
ContactSchema.index({ companyId: 1 });
ContactSchema.index({ lastSyncedAt: -1 });
ContactSchema.index({ syncStatus: 1 });
// Compound index for sorting by lastSyncedAt with fullName lookup
ContactSchema.index({ lastSyncedAt: -1, fullName: 1 });

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);


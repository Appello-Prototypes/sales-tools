import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  hubspotId: string;
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  industry?: string;
  employees?: string;
  
  // Geocoding data
  lat?: number;
  lng?: number;
  geocodedAt?: Date;
  geocodeError?: boolean;
  
  // Additional HubSpot properties
  properties: Record<string, any>;
  
  // Sync tracking
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  syncError?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    hubspotId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    domain: { type: String, index: true },
    website: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    industry: { type: String },
    employees: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    geocodedAt: { type: Date },
    geocodeError: { type: Boolean },
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

CompanySchema.index({ hubspotId: 1 });
CompanySchema.index({ domain: 1 });
CompanySchema.index({ name: 1 });
CompanySchema.index({ industry: 1 }); // For industry filtering
CompanySchema.index({ website: 1 }); // For search queries
CompanySchema.index({ lastSyncedAt: -1 });
CompanySchema.index({ syncStatus: 1 });
// Compound index for sorting by lastSyncedAt with name lookup
CompanySchema.index({ lastSyncedAt: -1, name: 1 });

export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);


import mongoose, { Schema, Document } from 'mongoose';

export interface IMapFilter extends Document {
  name: string;
  description?: string;
  userId: string;
  
  // Filter criteria
  filters: {
    searchQuery?: string;
    industries?: string[];
    pipelines?: string[];
    dealStages?: string[];
    hasDeals?: boolean;
    dealAmountMin?: number;
    dealAmountMax?: number;
  };
  
  // Map state
  mapState?: {
    center?: { lat: number; lng: number };
    zoom?: number;
  };
  
  // Metadata
  isDefault?: boolean;
  color?: string;
  icon?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const MapFilterSchema = new Schema<IMapFilter>(
  {
    name: { type: String, required: true },
    description: { type: String },
    userId: { type: String, required: true, index: true },
    
    filters: {
      searchQuery: { type: String },
      industries: [{ type: String }],
      pipelines: [{ type: String }],
      dealStages: [{ type: String }],
      hasDeals: { type: Boolean },
      dealAmountMin: { type: Number },
      dealAmountMax: { type: Number },
    },
    
    mapState: {
      center: {
        lat: { type: Number },
        lng: { type: Number },
      },
      zoom: { type: Number },
    },
    
    isDefault: { type: Boolean, default: false },
    color: { type: String, default: '#6366f1' },
    icon: { type: String, default: 'filter' },
  },
  { timestamps: true }
);

MapFilterSchema.index({ userId: 1, name: 1 });
MapFilterSchema.index({ userId: 1, isDefault: 1 });

export default mongoose.models.MapFilter || mongoose.model<IMapFilter>('MapFilter', MapFilterSchema);



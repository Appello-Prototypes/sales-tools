import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessment extends Document {
  submissionId: string;
  email?: string;
  name?: string;
  companyName?: string;
  website?: string;
  
  section1: {
    trade: string;
    fieldWorkers: string;
    role: string;
  };
  
  section2: {
    painPoints: string[];
    magicWand: string;
    urgency: number;
    hoursPerWeek: string;
  };
  
  section3: {
    timesheetMethod: string;
    unionized: string;
    cbaCount?: string;
    unions?: string[];
    accountingSoftware: string;
    payrollSoftware?: string;
    constructionSoftware: string;
    notDoing: string[];
  };
  
  section4: {
    demoFocus: string[];
    evaluators: string[];
    techComfort: string;
    smartphones: string;
  };
  
  section5: {
    timeline: string;
    evaluating: string[];
    nextSteps: string[];
    likelihood: number;
    specificQuestions?: string;
  };
  
  startedAt: Date;
  completedAt?: Date;
  timeToComplete?: number;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  
  status: 'in_progress' | 'completed' | 'abandoned';
  currentStep: number;
  
  assignedTo?: string;
  notes?: string;
  flagged?: boolean;
  
  // Opportunity Scoring
  opportunityScore?: number;
  opportunityGrade?: string;
  opportunityPriority?: string;
  
  // AI Audit Trail
  auditTrail?: any; // Store AuditTrail object
  
  // Debug Log
  debugLog?: any; // Store AssessmentDebugLog object
  
  // Admin/Sales Report
  adminReport?: any; // Store AdminReport object
  
  // Customer Report (saved version)
  customerReport?: any; // Store CustomerReport object
  customerReportGeneratedAt?: Date; // When customer report was generated
  
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    submissionId: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    name: { type: String },
    companyName: { type: String },
    website: { type: String },
    
    section1: {
      trade: { type: String },
      fieldWorkers: { type: String },
      role: { type: String },
    },
    
    section2: {
      painPoints: { type: [String], default: [] },
      magicWand: { type: String },
      urgency: { type: Number },
      hoursPerWeek: { type: String },
    },
    
    section3: {
      timesheetMethod: { type: String },
      unionized: { type: String },
      cbaCount: { type: String },
      unions: { type: [String], default: [] },
      accountingSoftware: { type: String },
      payrollSoftware: { type: String },
      constructionSoftware: { type: String },
      notDoing: { type: [String], default: [] },
    },
    
    section4: {
      demoFocus: { type: [String], default: [] },
      evaluators: { type: [String], default: [] },
      techComfort: { type: String },
      smartphones: { type: String },
    },
    
    section5: {
      timeline: { type: String },
      evaluating: { type: [String], default: [] },
      nextSteps: { type: [String], default: [] },
      likelihood: { type: Number },
      specificQuestions: { type: String },
    },
    
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeToComplete: { type: Number },
    ipAddress: { type: String },
    userAgent: { type: String },
    referrer: { type: String },
    
    status: { 
      type: String, 
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress'
    },
    currentStep: { type: Number, default: 1 },
    
    assignedTo: { type: String },
    notes: { type: String },
    flagged: { type: Boolean, default: false },
    
    // Opportunity Scoring
    opportunityScore: { type: Number },
    opportunityGrade: { type: String },
    opportunityPriority: { type: String },
    
    // AI Audit Trail
    auditTrail: { type: Schema.Types.Mixed },
    
    // Debug Log
    debugLog: { type: Schema.Types.Mixed },
    
    // Admin/Sales Report
    adminReport: { type: Schema.Types.Mixed },
    
    // Customer Report (saved version)
    customerReport: { type: Schema.Types.Mixed },
    customerReportGeneratedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
AssessmentSchema.index({ status: 1, completedAt: -1 });
AssessmentSchema.index({ email: 1 });
AssessmentSchema.index({ createdAt: -1 });

export default mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);


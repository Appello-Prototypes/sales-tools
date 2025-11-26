import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IGoogleOAuth {
  accessToken: string;
  refreshToken: string;
  tokenExpiry?: Date;
  email: string;
  connectedAt: Date;
  scope?: string;
}

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  role: 'admin' | 'sales' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  googleOAuth?: IGoogleOAuth;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { 
      type: String, 
      required: function() {
        // Password not required if user has Google OAuth
        return !this.googleOAuth || !this.googleOAuth.refreshToken;
      }
    },
    name: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['admin', 'sales', 'viewer'],
      default: 'viewer'
    },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    googleOAuth: {
      accessToken: String,
      refreshToken: String,
      tokenExpiry: Date,
      email: String,
      connectedAt: Date,
      scope: String
    }
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Skip password hashing if user has Google OAuth and no password
  if (this.googleOAuth?.refreshToken && !this.passwordHash) {
    return next();
  }

  // Only hash the password if it has been modified (or is new) and exists
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.passwordHash, 12);
    this.passwordHash = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.index({ email: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);


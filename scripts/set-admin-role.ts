import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function setAdminRole() {
  try {
    if (!MONGODB_URI) {
      console.error('Error: MONGODB_URI environment variable is not set');
      console.error('Please set MONGODB_URI in your .env.local file');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.error('Usage: tsx scripts/set-admin-role.ts <email>');
      console.log('\nAvailable users:');
      const users = await User.find({}).select('email name role').lean();
      users.forEach((user: any) => {
        console.log(`  - ${user.email} (${user.name}) [${user.role}]`);
      });
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    // Update role to admin
    user.role = 'admin';
    await user.save();

    console.log(`✅ Successfully updated ${user.email} (${user.name}) to admin role`);
    console.log('⚠️  You may need to log out and log back in for the changes to take effect');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating user role:', error);
    process.exit(1);
  }
}

setAdminRole();


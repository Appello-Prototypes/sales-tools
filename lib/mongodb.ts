import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appello-assessment';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastError: Date | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null, lastError: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Clear the cached connection - useful when connections go stale
 */
export function clearConnectionCache() {
  console.log('[MongoDB] Clearing connection cache...');
  if (cached.conn) {
    try {
      mongoose.connection.close();
    } catch (e) {
      // Ignore close errors
    }
  }
  cached.conn = null;
  cached.promise = null;
  cached.lastError = null;
}

async function connectDB() {
  const startTime = Date.now();
  console.log('[MongoDB] Attempting connection...');
  console.log('[MongoDB] URI (masked):', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  // If we had a recent error (within last 5 seconds), clear the cache
  if (cached.lastError && Date.now() - cached.lastError.getTime() < 5000) {
    console.log('[MongoDB] Recent error detected, clearing stale connection...');
    clearConnectionCache();
  }
  
  // Check if existing connection is actually healthy
  if (cached.conn) {
    const readyState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (readyState === 1) {
      console.log('[MongoDB] Using cached connection (readyState: connected)');
      return cached.conn;
    } else {
      console.log(`[MongoDB] Cached connection unhealthy (readyState: ${readyState}), reconnecting...`);
      clearConnectionCache();
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 3, // Further reduced pool size
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000, // Reduced to 5 seconds to fail faster
      socketTimeoutMS: 10000, // Reduced to 10 seconds
      connectTimeoutMS: 5000, // Connection timeout
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 5000, // More frequent heartbeats to detect dead connections
      maxIdleTimeMS: 10000, // Close idle connections after 10 seconds
      // Force reads from primary to avoid issues with unreachable secondaries
      readPreference: 'primaryPreferred' as const,
    };

    console.log('[MongoDB] Connection options:', {
      serverSelectionTimeoutMS: opts.serverSelectionTimeoutMS,
      socketTimeoutMS: opts.socketTimeoutMS,
      connectTimeoutMS: opts.connectTimeoutMS,
      maxPoolSize: opts.maxPoolSize,
      heartbeatFrequencyMS: opts.heartbeatFrequencyMS,
    });

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      const duration = Date.now() - startTime;
      console.log(`[MongoDB] ✅ Connected successfully in ${duration}ms`);
      
      // Set up error handlers to clear cache on connection errors
      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error:', err.message);
        cached.lastError = new Date();
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('[MongoDB] Disconnected - will reconnect on next request');
        cached.conn = null;
        cached.promise = null;
      });
      
      return mongoose;
    }).catch((error) => {
      const duration = Date.now() - startTime;
      console.error(`[MongoDB] ❌ Connection failed after ${duration}ms`);
      console.error('[MongoDB] Error name:', error.name);
      console.error('[MongoDB] Error message:', error.message);
      console.error('[MongoDB] Error code:', error.code);
      if (error.reason) {
        console.error('[MongoDB] Reason:', error.reason.message);
      }
      cached.promise = null; // Reset so we can retry
      cached.lastError = new Date();
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    cached.lastError = new Date();
    console.error('[MongoDB] Failed to get connection from promise:', e.message);
    throw e;
  }

  return cached.conn;
}

export default connectDB;


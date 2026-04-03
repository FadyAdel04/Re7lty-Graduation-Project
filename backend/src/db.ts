import mongoose from "mongoose";

export async function connectToDatabase(uri: string): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  // Clean the URI - trim whitespace and remove potential surrounding quotes commonly found in environment variables
  const cleanUri = uri.trim().replace(/^["'](.+)["']$/, '$1');
  
  // Basic validation of scheme to provide a clear error before reaching the driver
  if (!cleanUri.startsWith("mongodb://") && !cleanUri.startsWith("mongodb+srv://")) {
    throw new Error(
      `Invalid MongoDB connection string: Expected it to start with "mongodb://" or "mongodb+srv://". ` +
      `Current value starts with: "${cleanUri.substring(0, 15)}..."`
    );
  }
  
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  
  mongoose.set('strictQuery', true);
  
  // Connection options with better error handling
  const options = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    dbName: process.env.MONGODB_DB || undefined,
  };
  
  try {
    console.log(`📡 Connecting to MongoDB... (Scheme: ${cleanUri.split(':')[0]})`);
    await mongoose.connect(cleanUri, options as any);
    console.log("✓ MongoDB connected successfully");
    return mongoose;
  } catch (error: any) {
    // Provide helpful error messages
    if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
      const isDnsError = error.message.includes('ENOTFOUND') || error.message.includes('querySrv');
      
      throw new Error(
        `MongoDB connection failed: ${error.message}\n` +
        `Common causes:\n` +
        `1. ${isDnsError ? 'DNS issue / Cluster not found (Check if your Atlas cluster name is correct)' : 'IP address not whitelisted in MongoDB Atlas'}\n` +
        `2. Incorrect credentials in connection string\n` +
        `3. Network/firewall issues (Check your server's outbound rules)\n` +
        `Fix: Add your IP to Atlas whitelist or check cluster status: https://www.mongodb.com/docs/atlas/security-whitelist/`
      );
    }
    throw error;
  }
}



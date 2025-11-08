import mongoose from "mongoose";

export async function connectToDatabase(uri: string): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
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
    await mongoose.connect(uri, options as any);
    console.log("✓ MongoDB connected successfully");
    return mongoose;
  } catch (error: any) {
    // Provide helpful error messages
    if (error.name === 'MongoServerSelectionError') {
      throw new Error(
        `MongoDB connection failed: ${error.message}\n` +
        `Common causes:\n` +
        `1. IP address not whitelisted in MongoDB Atlas\n` +
        `2. Incorrect connection string\n` +
        `3. Network/firewall issues\n` +
        `Fix: Add your IP to MongoDB Atlas whitelist: https://www.mongodb.com/docs/atlas/security-whitelist/`
      );
    }
    throw error;
  }
}



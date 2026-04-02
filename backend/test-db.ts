import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables (.env is in the same folder)
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  if (!MONGODB_URI) {
    console.error('✗ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('URI:', MONGODB_URI.split('@')[1]); // Show cluster info for verification
    
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected successfully!');
    
    // Check collections
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log('Available collections:', collections?.map(c => c.name));
    
    // Check if backup/seed collections exist
    const tripCount = await mongoose.connection.db?.collection('trips').countDocuments();
    console.log(`Trip count: ${tripCount}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error: any) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

// Running the test
testConnection();

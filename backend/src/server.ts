import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import tripsRouter from "./routes/trips";
import profilesRouter from "./routes/profiles";
import usersRouter from "./routes/users";
import { connectToDatabase } from "./db";

dotenv.config();

// Validate Clerk secret key
if (!process.env.CLERK_SECRET_KEY) {
  console.warn("Warning: CLERK_SECRET_KEY is not set. Authentication will not work properly.");
} else {
  console.log("Clerk secret key found - authentication enabled");
}

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

// Apply middleware in correct order
app.use(cors());

// Increase body size limit to handle large image payloads (50MB)
// Base64 encoded images can be quite large
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Apply Clerk middleware (reads CLERK_SECRET_KEY from env automatically)
// This must be after body parsing for proper request handling
try {
  app.use(clerkMiddleware());
  console.log("Clerk middleware initialized successfully");
} catch (error: any) {
  console.error("Failed to initialize Clerk middleware:", error.message);
  // Continue without Clerk if it fails (for development)
}

app.get('/api/health', async (_req, res) => {
  try {
    await connectToDatabase(process.env.MONGODB_URI || "");
    res.json({ status: 'ok', service: 'backend', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.json({ status: 'ok', service: 'backend', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

app.use('/api/trips', tripsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/users', usersRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handling middleware (must be last)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Handle payload too large errors
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request payload exceeds the maximum allowed size (50MB). Please reduce image sizes or upload fewer images.',
    });
  }
  
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const startServer = async () => {
  try {
    // Try to connect to database
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase(process.env.MONGODB_URI);
        console.log("✓ MongoDB connected successfully");
      } catch (dbError: any) {
        console.warn("⚠ MongoDB connection failed:", dbError?.message || dbError);
        console.warn("⚠ Server will start without database connection");
      }
    } else {
      console.warn("⚠ MONGODB_URI not set - database features will not work");
    }

    // Start listening with port conflict handling
    const server = app.listen(port, () => {
      console.log(`✓ Backend server listening on port ${port}`);
      console.log(`✓ Health check: http://localhost:${port}/api/health`);
      console.log(`✓ API endpoints available at http://localhost:${port}/api`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${port} is already in use. Please:`);
        console.error(`  1. Stop the other process using port ${port}`);
        console.error(`  2. Or set a different PORT in your .env file`);
        console.error(`  3. Or kill the process: taskkill /PID <pid> /F`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  } catch (error: any) {
    console.error("✗ Failed to start server:", error.message);
    console.error(error);
    process.exit(1);
  }
};

startServer();



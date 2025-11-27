import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { clerkMiddleware } from "@clerk/express";
import tripsRouter from "./routes/trips";
import profilesRouter from "./routes/profiles";
import usersRouter from "./routes/users";
import searchRouter from "./routes/search";
import notificationsRouter from "./routes/notifications";
import { connectToDatabase } from "./db";
import mongoose from "mongoose";

dotenv.config();

if (!process.env.CLERK_SECRET_KEY) {
  console.warn("Warning: CLERK_SECRET_KEY is not set. Authentication will not work properly.");
} else {
  console.log("Clerk secret key found - authentication enabled");
}

const ensureUploadsDirectory = () => {
  const uploadsDir = path.join(process.cwd(), "uploads");
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (error) {
    console.warn("Unable to ensure uploads directory:", error);
  }
  return uploadsDir;
};

const initializeDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn("⚠ MONGODB_URI not set - database features will not work");
    return;
  }

  try {
    await connectToDatabase(process.env.MONGODB_URI);
  } catch (error) {
    console.error("✗ Failed to connect to MongoDB:", error);
  }
};

// Initialize database connection on app creation (for serverless compatibility)
// In serverless environments, we want to connect eagerly but handle reconnection
let dbConnectionPromise: Promise<void> | null = null;
const ensureDatabaseConnection = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If connection is in progress, wait for it
  if (dbConnectionPromise) {
    await dbConnectionPromise;
    return;
  }

  // Start new connection
  if (process.env.MONGODB_URI) {
    dbConnectionPromise = initializeDatabase().catch((error) => {
      console.error("Database connection error:", error);
      dbConnectionPromise = null; // Reset on error so we can retry
      throw error;
    });
    await dbConnectionPromise;
  }
};

export function createApp() {
  const app = express();

  // Apply middleware in correct order
  app.use(cors({ origin: true, credentials: true }));

  // Increase body size limit to handle large image payloads (50MB)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Request logging middleware (for debugging)
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Static uploads
  const uploadsDir = ensureUploadsDirectory();
  app.use(
    "/uploads",
    express.static(uploadsDir, {
      maxAge: "7d",
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=604800");
      },
    })
  );

  // Clerk middleware
  try {
    app.use(clerkMiddleware());
    console.log("Clerk middleware initialized successfully");
  } catch (error: any) {
    console.error("Failed to initialize Clerk middleware:", error.message);
  }

  app.get("/api/health", async (_req, res) => {
    try {
      // Ensure database connection
      await ensureDatabaseConnection();
      const isConnected = mongoose.connection.readyState === 1;
      res.json({ 
        status: "ok", 
        service: "backend", 
        db: isConnected ? "connected" : "disconnected", 
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      res.json({ 
        status: "ok", 
        service: "backend", 
        db: "disconnected", 
        error: error.message,
        timestamp: new Date().toISOString() 
      });
    }
  });

  // Ensure database connection before handling routes (for serverless)
  app.use("/api", async (_req, _res, next) => {
    await ensureDatabaseConnection();
    next();
  });

  app.use("/api/trips", tripsRouter);
  app.use("/api/profiles", profilesRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/notifications", notificationsRouter);

  app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not Found", path: req.path });
  });

  // Error handling middleware (must be last)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === "entity.too.large") {
      return res.status(413).json({
        error: "Payload Too Large",
        message: "Request payload exceeds the maximum allowed size (50MB). Please reduce image sizes or upload fewer images.",
      });
    }

    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  return app;
}

// Only initialize database on module load (not in serverless)
// In serverless, we'll connect on first request via ensureDatabaseConnection
if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  initializeDatabase();
}

const app = createApp();

export default app;



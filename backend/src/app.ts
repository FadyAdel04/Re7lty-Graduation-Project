import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { clerkMiddleware } from "@clerk/express";
import tripsRouter from "./routes/trips";
import profilesRouter from "./routes/profiles";
import usersRouter from "./routes/users";
import searchRouter from "./routes/search";
import notificationsRouter from "./routes/notifications";
import storiesRouter from "./routes/stories";
import companySubmissionsRouter from "./routes/companySubmissions";
import corporateCompaniesRouter from "./routes/corporateCompanies";
import corporateTripsRouter from "./routes/corporateTrips";
import { connectToDatabase } from "./db";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";

dotenv.config();

if (!process.env.CLERK_SECRET_KEY) {
  console.warn("Warning: CLERK_SECRET_KEY is not set. Authentication will not work properly.");
} else {
  console.log("Clerk secret key found - authentication enabled");
}

const ensureUploadsDirectory = () => {
  // IMPORTANT: Never touch the filesystem here.
  // This function runs during app initialization (including on serverless
  // platforms like Vercel) and **must** be pure and non-throwing.
  //
  // We only need to provide a virtual path for `express.static`. In serverless
  // production we currently store media as base64 in MongoDB (see
  // `routes/trips.ts`), so this directory is only useful for future
  // non-serverless/local setups.
  //
  // If you ever introduce real file uploads again, do it through a dedicated
  // storage service (S3, Cloudinary, etc.), not by writing to `/var/task`.
  const uploadsDir = path.join(process.cwd(), "uploads");
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
  // CORS configuration: allow all origins in production, with credentials support
  app.use(cors({
    origin: true, // Allow all origins (reflects the request origin)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  }));

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
  // Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

  // Root route handler
  app.get("/", (_req, res) => {
    res.json({
      message: "Re7lty Backend API",
      version: "1.0.0",
      endpoints: {
        health: "/api/health",
        trips: "/api/trips",
        profiles: "/api/profiles",
        users: "/api/users",
        search: "/api/search",
        notifications: "/api/notifications"
      },
      documentation: "Visit /api/health to check server status"
    });
  });

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
  app.use("/api/stories", storiesRouter);

  // Corporate trips routes
  app.use("/api/submissions", companySubmissionsRouter);
  app.use("/api/corporate/companies", corporateCompaniesRouter);
  app.use("/api/corporate/trips", corporateTripsRouter);

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



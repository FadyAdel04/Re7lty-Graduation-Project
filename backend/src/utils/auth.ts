import type { RequestHandler } from "express";
import { getAuth as clerkGetAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Define a custom getAuth that returns the demo user correctly without crashing clerkGetAuth
export const getAuth = (req: any) => {
  const demoHeader = req.headers?.['x-demo-user'];
  if (process.env.NODE_ENV !== 'production' && demoHeader) {
    return {
      userId: demoHeader === 'true' ? 'user_2r9nE5R8r7TzK6pM9wL1vQ3xH4j' : demoHeader,
      sessionId: 'demo_session',
      orgId: null,
    };
  }
  return clerkGetAuth(req);
};

// Re-export getAuth and clerkClient for use in routes
export { clerkClient };

/**
 * Middleware to require authentication
 * Returns JSON 401 for API clients (Bearer token requests)
 * In development, allows a fallback demo user via the x-demo-user header
 */
export const requireAuthStrict: RequestHandler = (req, res, next) => {
  const demoHeader = req.headers["x-demo-user"];
  if (process.env.NODE_ENV !== "production" && demoHeader) {
    (req as any).auth = {
      userId: demoHeader === "true" ? "user_2r9nE5R8r7TzK6pM9wL1vQ3xH4j" : demoHeader,
      sessionId: "demo_session",
      orgId: null,
    };
    return next();
  }

  try {
    const auth = clerkGetAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ error: "Unauthorized", message: "Not authenticated" });
    }
    return next();
  } catch (err: any) {
    return res.status(401).json({ error: "Unauthorized", message: err.message });
  }
};

/**
 * Optional auth middleware - doesn't block if not authenticated
 */
export const requireAuthOptional: RequestHandler = (req, _res, next) => {
  // Try to get auth, but don't throw if not present
  try {
    getAuth(req);
  } catch {
    // Auth not present, continue anyway
  }
  next();
};

import type { RequestHandler } from "express";
import { requireAuth as clerkRequireAuth, getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Re-export getAuth and clerkClient for use in routes
// clerkClient automatically reads CLERK_SECRET_KEY from environment variables
export { getAuth, clerkClient };

/**
 * Middleware to require authentication
 * Uses Clerk's requireAuth which automatically verifies Bearer tokens
 * In development, allows a fallback 'demo_user' via header
 */
export const requireAuthStrict: RequestHandler = (req, res, next) => {
  const demoHeader = req.headers['x-demo-user'];
  if (process.env.NODE_ENV !== 'production' && demoHeader) {
    // Inject a mock auth object
    (req as any).auth = {
      userId: demoHeader === 'true' ? 'user_2r9nE5R8r7TzK6pM9wL1vQ3xH4j' : demoHeader, // Default demo ID or custom
      sessionId: 'demo_session',
      orgId: null,
    };
    return next();
  }
  return clerkRequireAuth()(req, res, next);
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

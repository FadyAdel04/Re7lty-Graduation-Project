import type { RequestHandler } from "express";
import { requireAuth as clerkRequireAuth, getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Re-export getAuth and clerkClient for use in routes
// clerkClient automatically reads CLERK_SECRET_KEY from environment variables
export { getAuth, clerkClient };

/**
 * Middleware to require authentication
 * Uses Clerk's requireAuth which automatically verifies Bearer tokens
 */
export const requireAuthStrict: RequestHandler = clerkRequireAuth();

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

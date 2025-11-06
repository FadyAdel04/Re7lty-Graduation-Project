import type { RequestHandler } from "express";
import { ClerkExpressWithAuth, getAuth, clerkClient } from "@clerk/clerk-sdk-node";

export const requireAuthStrict: RequestHandler = ClerkExpressWithAuth({
  signInUrl: "/auth",
  authorizedParties: undefined,
});

export const requireAuthOptional: RequestHandler = (req, _res, next) => {
  // Attach auth if present, but don't block
  try { (req as any).auth = getAuth(req); } catch {}
  next();
};

declare global {
  namespace Express {
    // Clerk attaches `auth` on the request
    interface Request {
      auth?: { userId?: string | null };
    }
  }
}



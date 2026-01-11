import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Extend Express Request to include auth
declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                sessionId: string;
            };
        }
    }
}

/**
 * Middleware to verify if the authenticated user is the admin
 * Checks if user email matches: e79442457@gmail.com
 */
export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check if user is authenticated (should be handled by Clerk middleware first)
        if (!req.auth?.userId) {
            return res.status(401).json({ error: 'Unauthorized - No authentication' });
        }

        // Get user from Clerk
        const user = await clerkClient.users.getUser(req.auth.userId);

        // Check if user email matches admin email
        const adminEmail = 'e79442457@gmail.com';
        const userEmail = user.emailAddresses.find(email => email.emailAddress === adminEmail);

        if (!userEmail) {
            return res.status(403).json({
                error: 'Forbidden - Admin access required',
                message: 'You do not have permission to access this resource'
            });
        }

        // User is admin, proceed
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Middleware to check admin status without blocking
 * Adds isAdmin flag to request
 */
export const checkAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.auth?.userId) {
            const user = await clerkClient.users.getUser(req.auth.userId);
            const adminEmail = 'e79442457@gmail.com';
            const userEmail = user.emailAddresses.find(email => email.emailAddress === adminEmail);
            (req as any).isAdmin = !!userEmail;
        } else {
            (req as any).isAdmin = false;
        }
        next();
    } catch (error) {
        (req as any).isAdmin = false;
        next();
    }
};

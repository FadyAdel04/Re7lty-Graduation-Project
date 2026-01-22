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
import analyticsRouter from "./routes/analytics";
import adminUsersRouter from "./routes/adminUsers";
import { connectToDatabase } from "./db";
import mongoose from "mongoose";

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

    // Root route handler - Interactive API Documentation
    app.get("/", (_req, res) => {
        const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";

        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Re7lty API Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        .version { 
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 20px;
            margin-top: 10px;
            font-size: 0.9em;
        }
        .content { padding: 40px; }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 4px;
        }
        .info-box h3 { color: #667eea; margin-bottom: 10px; }
        .info-box ul { margin-left: 20px; }
        .info-box li { margin: 5px 0; }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 1.8em;
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }
        .endpoint-group {
            margin-bottom: 30px;
        }
        .group-header {
            background: #667eea;
            color: white;
            padding: 15px 20px;
            border-radius: 8px 8px 0 0;
            font-size: 1.3em;
            font-weight: 600;
        }
        .group-base {
            background: #f1f3f5;
            padding: 10px 20px;
            font-family: 'Courier New', monospace;
            color: #495057;
            border-bottom: 1px solid #dee2e6;
        }
        .endpoint {
            background: white;
            border: 1px solid #e9ecef;
            border-top: none;
            padding: 15px 20px;
            transition: all 0.2s;
        }
        .endpoint:hover {
            background: #f8f9fa;
            transform: translateX(5px);
        }
        .endpoint:last-child {
            border-radius: 0 0 8px 8px;
        }
        .endpoint-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 8px;
        }
        .method {
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.85em;
            min-width: 70px;
            text-align: center;
        }
        .method.get { background: #d3f9d8; color: #2b8a3e; }
        .method.post { background: #d0ebff; color: #1971c2; }
        .method.patch { background: #ffe8cc; color: #e67700; }
        .method.put { background: #fff3bf; color: #f08c00; }
        .method.delete { background: #ffe0e0; color: #c92a2a; }
        .endpoint-path {
            font-family: 'Courier New', monospace;
            color: #495057;
            font-size: 0.95em;
            flex: 1;
        }
        .auth-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: 600;
        }
        .auth-none { background: #e7f5ff; color: #1971c2; }
        .auth-optional { background: #fff3bf; color: #f08c00; }
        .auth-required { background: #ffe0e0; color: #c92a2a; }
        .auth-admin { background: #f3d9fa; color: #9c36b5; }
        .endpoint-desc {
            color: #666;
            margin-left: 85px;
            margin-bottom: 8px;
        }
        .endpoint-link {
            margin-left: 85px;
        }
        .endpoint-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .endpoint-link a:hover {
            text-decoration: underline;
        }
        .query-params {
            margin-left: 85px;
            margin-top: 8px;
            font-size: 0.85em;
            color: #868e96;
        }
        .query-params strong { color: #495057; }
        .footer {
            background: #f8f9fa;
            padding: 30px 40px;
            border-top: 1px solid #e9ecef;
            color: #666;
            text-align: center;
        }
        .quick-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .quick-link {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #e9ecef;
            text-align: center;
            transition: all 0.2s;
        }
        .quick-link:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        .quick-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 Re7lty API</h1>
            <p>Backend API for Re7lty - A Social Travel Platform</p>
            <span class="version">v1.0.0</span>
        </div>
        
        <div class="content">
            <div class="info-box">
                <h3>📋 Important Information</h3>
                <ul>
                    <li><strong>Base URL:</strong> ${baseUrl}</li>
                    <li><strong>Authentication:</strong> Include <code>Authorization: Bearer &lt;token&gt;</code> header for authenticated endpoints</li>
                    <li><strong>CORS:</strong> Enabled for all origins with credentials support</li>
                    <li><strong>Error Format:</strong> All errors return JSON with 'error' and 'message' fields</li>
                </ul>
            </div>

            <div class="quick-links">
                <div class="quick-link">
                    <a href="/api/health" target="_blank">🏥 Health Check</a>
                </div>
                <div class="quick-link">
                    <a href="/api/trips" target="_blank">✈️ Browse Trips</a>
                </div>
                <div class="quick-link">
                    <a href="/api/corporate/companies" target="_blank">🏢 Corporate Companies</a>
                </div>
                <div class="quick-link">
                    <a href="/api/corporate/trips" target="_blank">🎫 Corporate Trips</a>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">API Endpoints</h2>

                <!-- Trips -->
                <div class="endpoint-group">
                    <div class="group-header">✈️ Trips</div>
                    <div class="group-base">/api/trips</div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/trips</span>
                            <span class="auth-badge auth-optional">Optional Auth</span>
                        </div>
                        <div class="endpoint-desc">Get list of trips with pagination and filters</div>
                        <div class="query-params"><strong>Query Params:</strong> q, city, sort, page, limit</div>
                        <div class="endpoint-link"><a href="/api/trips" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/trips/:id</span>
                            <span class="auth-badge auth-optional">Optional Auth</span>
                        </div>
                        <div class="endpoint-desc">Get trip details by ID</div>
                        <div class="endpoint-link"><a href="/api/trips" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/trips</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Create a new trip</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method patch">PATCH</span>
                            <span class="endpoint-path">/api/trips/:id</span>
                            <span class="auth-badge auth-required">Required (Owner)</span>
                        </div>
                        <div class="endpoint-desc">Update trip by ID</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method delete">DELETE</span>
                            <span class="endpoint-path">/api/trips/:id</span>
                            <span class="auth-badge auth-required">Required (Owner)</span>
                        </div>
                        <div class="endpoint-desc">Delete trip by ID</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/trips/:id/love</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Love/unlike a trip</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/trips/:id/save</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Save/unsave a trip</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/trips/:id/comments</span>
                            <span class="auth-badge auth-optional">Optional Auth</span>
                        </div>
                        <div class="endpoint-desc">Get comments for a trip</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/trips/:id/comments</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Add comment to a trip</div>
                    </div>
                </div>

                <!-- Users -->
                <div class="endpoint-group">
                    <div class="group-header">👤 Users</div>
                    <div class="group-base">/api/users</div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/users/me</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Get current authenticated user profile</div>
                        <div class="endpoint-link"><a href="/api/users/me" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method patch">PATCH</span>
                            <span class="endpoint-path">/api/users/me</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Update current user profile</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/users/me/trips</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Get current user's trips</div>
                        <div class="endpoint-link"><a href="/api/users/me/trips" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/users/me/ai-trips</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Get current user's AI-generated trips</div>
                        <div class="endpoint-link"><a href="/api/users/me/ai-trips" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/users/me/saves</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Get current user's saved trips</div>
                        <div class="endpoint-link"><a href="/api/users/me/saves" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/users/:id</span>
                            <span class="auth-badge auth-optional">Optional Auth</span>
                        </div>
                        <div class="endpoint-desc">Get user profile by ID</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/users/:id/trips</span>
                            <span class="auth-badge auth-optional">Optional Auth</span>
                        </div>
                        <div class="endpoint-desc">Get user's trips by user ID</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/users/:id/follow</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Follow/unfollow a user</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/users/:id/followers</span>
                            <span class="auth-badge auth-optional">Optional Auth</span>
                        </div>
                        <div class="endpoint-desc">Get user's followers</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/users/:id/following</span>
                            <span class="auth-badge auth-optional">Optional Auth</span>
                        </div>
                        <div class="endpoint-desc">Get users that this user follows</div>
                    </div>
                </div>

                <!-- Profiles -->
                <div class="endpoint-group">
                    <div class="group-header">📝 Profiles</div>
                    <div class="group-base">/api/profiles</div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/profiles/me</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Get current user's profile</div>
                        <div class="endpoint-link"><a href="/api/profiles/me" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method patch">PATCH</span>
                            <span class="endpoint-path">/api/profiles/me</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Update current user's profile</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/profiles/:username</span>
                            <span class="auth-badge auth-none">Public</span>
                        </div>
                        <div class="endpoint-desc">Get public profile by username</div>
                    </div>
                </div>

                <!-- Search -->
                <div class="endpoint-group">
                    <div class="group-header">🔍 Search</div>
                    <div class="group-base">/api/search</div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/search</span>
                            <span class="auth-badge auth-none">Public</span>
                        </div>
                        <div class="endpoint-desc">Search trips and users</div>
                        <div class="query-params"><strong>Query Params:</strong> q, limit</div>
                        <div class="endpoint-link"><a href="/api/search?q=egypt" target="_blank">→ Try it</a></div>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="endpoint-group">
                    <div class="group-header">🔔 Notifications</div>
                    <div class="group-base">/api/notifications</div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/notifications</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Get user notifications</div>
                        <div class="query-params"><strong>Query Params:</strong> limit</div>
                        <div class="endpoint-link"><a href="/api/notifications" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/notifications/:id/read</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Mark notification as read</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/notifications/read-all</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Mark all notifications as read</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/notifications/unread-count</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Get unread notifications count</div>
                        <div class="endpoint-link"><a href="/api/notifications/unread-count" target="_blank">→ Try it</a></div>
                    </div>
                </div>

                <!-- Stories -->
                <div class="endpoint-group">
                    <div class="group-header">📸 Stories</div>
                    <div class="group-base">/api/stories</div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/stories</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Create a new story</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/stories/me</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Get current user's active stories</div>
                        <div class="endpoint-link"><a href="/api/stories/me" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/stories/following</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Get stories from followed users</div>
                        <div class="endpoint-link"><a href="/api/stories/following" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/stories/:id/view</span>
                            <span class="auth-badge auth-required">Required</span>
                        </div>
                        <div class="endpoint-desc">Mark story as viewed</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/stories/:id/viewers</span>
                            <span class="auth-badge auth-required">Required (Owner)</span>
                        </div>
                        <div class="endpoint-desc">Get story viewers (owner only)</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method delete">DELETE</span>
                            <span class="endpoint-path">/api/stories/:id</span>
                            <span class="auth-badge auth-required">Required (Owner)</span>
                        </div>
                        <div class="endpoint-desc">Delete story</div>
                    </div>
                </div>

                <!-- Company Submissions -->
                <div class="endpoint-group">
                    <div class="group-header">📋 Company Submissions</div>
                    <div class="group-base">/api/submissions</div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/submissions</span>
                            <span class="auth-badge auth-none">Public</span>
                        </div>
                        <div class="endpoint-desc">Submit a new company for approval</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/submissions/admin</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Get all company submissions</div>
                        <div class="query-params"><strong>Query Params:</strong> status, limit, skip</div>
                        <div class="endpoint-link"><a href="/api/submissions/admin" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/submissions/admin/stats</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Get submission statistics</div>
                        <div class="endpoint-link"><a href="/api/submissions/admin/stats" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/submissions/admin/:id</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Get submission by ID</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method put">PUT</span>
                            <span class="endpoint-path">/api/submissions/admin/:id/approve</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Approve a submission</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method put">PUT</span>
                            <span class="endpoint-path">/api/submissions/admin/:id/reject</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Reject a submission</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method delete">DELETE</span>
                            <span class="endpoint-path">/api/submissions/admin/:id</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Delete a submission</div>
                    </div>
                </div>

                <!-- Corporate Companies -->
                <div class="endpoint-group">
                    <div class="group-header">🏢 Corporate Companies</div>
                    <div class="group-base">/api/corporate/companies</div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/companies</span>
                            <span class="auth-badge auth-none">Public</span>
                        </div>
                        <div class="endpoint-desc">Get all active corporate companies</div>
                        <div class="endpoint-link"><a href="/api/corporate/companies" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/companies/:id</span>
                            <span class="auth-badge auth-none">Public</span>
                        </div>
                        <div class="endpoint-desc">Get company by ID with trips</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/companies/admin/stats</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Get company statistics</div>
                        <div class="endpoint-link"><a href="/api/corporate/companies/admin/stats" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/companies/admin/all</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Get all companies including inactive</div>
                        <div class="endpoint-link"><a href="/api/corporate/companies/admin/all" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/corporate/companies/admin/create</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Create new company</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method put">PUT</span>
                            <span class="endpoint-path">/api/corporate/companies/admin/:id</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Update company</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method delete">DELETE</span>
                            <span class="endpoint-path">/api/corporate/companies/admin/:id</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Soft delete company</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method put">PUT</span>
                            <span class="endpoint-path">/api/corporate/companies/admin/:id/toggle-active</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Toggle company active status</div>
                    </div>
                </div>

                <!-- Corporate Trips -->
                <div class="endpoint-group">
                    <div class="group-header">🎫 Corporate Trips</div>
                    <div class="group-base">/api/corporate/trips</div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/trips</span>
                            <span class="auth-badge auth-none">Public</span>
                        </div>
                        <div class="endpoint-desc">Get all active corporate trips with filters</div>
                        <div class="query-params"><strong>Query Params:</strong> destination, companyId, minRating, limit, skip</div>
                        <div class="endpoint-link"><a href="/api/corporate/trips" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/trips/:slug</span>
                            <span class="auth-badge auth-none">Public</span>
                        </div>
                        <div class="endpoint-desc">Get trip by slug</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/trips/company/:companyId</span>
                            <span class="auth-badge auth-none">Public</span>
                        </div>
                        <div class="endpoint-desc">Get all trips for a specific company</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/trips/featured/top</span>
                            <span class="auth-badge auth-none">Public</span>
                        </div>
                        <div class="endpoint-desc">Get featured/top-rated trips</div>
                        <div class="query-params"><strong>Query Params:</strong> limit</div>
                        <div class="endpoint-link"><a href="/api/corporate/trips/featured/top" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/trips/admin/stats</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Get trip statistics</div>
                        <div class="endpoint-link"><a href="/api/corporate/trips/admin/stats" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="endpoint-path">/api/corporate/trips/admin/all</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Get all trips including inactive</div>
                        <div class="endpoint-link"><a href="/api/corporate/trips/admin/all" target="_blank">→ Try it</a></div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method post">POST</span>
                            <span class="endpoint-path">/api/corporate/trips/admin/create</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Create new trip</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method put">PUT</span>
                            <span class="endpoint-path">/api/corporate/trips/admin/:id</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Update trip</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method delete">DELETE</span>
                            <span class="endpoint-path">/api/corporate/trips/admin/:id</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Soft delete trip</div>
                    </div>
                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method put">PUT</span>
                            <span class="endpoint-path">/api/corporate/trips/admin/:id/toggle-active</span>
                            <span class="auth-badge auth-admin">Admin Only</span>
                        </div>
                        <div class="endpoint-desc">Toggle trip active status</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Re7lty API v1.0.0 | Built with ❤️ for travelers</p>
        </div>
    </div>
</body>
</html>
    `);
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

    // Analytics routes (admin only)
    app.use("/api/analytics", analyticsRouter);
    app.use("/api/admin/users", adminUsersRouter);

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



import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import https from "https";
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
import complaintsRouter from "./routes/complaints";
import contentReportsRouter from "./routes/contentReports";
import adminCommentsRouter from "./routes/adminComments";
import bookingsRouter from "./routes/bookings";
import chatRouter from "./routes/chat";
import directChatRouter from "./routes/directChat";
import couponsRouter from "./routes/coupons";
import tripGroupChatRouter from "./routes/tripGroupChat";
import memoriesRouter from "./routes/memories";
import leaderboardRouter from "./routes/leaderboard";
import paymobRouter from "./routes/paymob";
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
        throw error;
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

import webhooksRouter from "./routes/webhooks";

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

    // Webhooks MUST be parsed as raw buffers, so mount them strictly BEFORE express.json()
    app.use("/api/webhooks", webhooksRouter);

    // Increase body size limit to handle large image/PDF payloads (200MB)
    app.use(express.json({ limit: "200mb" }));
    app.use(express.urlencoded({ extended: true, limit: "200mb" }));

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

    // Root route handler - Redesigned Interactive API Documentation
    app.get("/", (_req, res) => {
        const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";

        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Re7lty API Docs | Backend Systems</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --primary-light: #818cf8;
            --secondary: #64748b;
            --bg-main: #f8fafc;
            --bg-sidebar: #ffffff;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --code-bg: #f1f5f9;
            --get: #22c55e;
            --post: #3b82f6;
            --put: #f59e0b;
            --patch: #8b5cf6;
            --delete: #ef4444;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: var(--bg-main);
            color: var(--text-main);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* Sidebar Styles */
        .sidebar {
            width: 300px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border);
            display: flex;
            flex-col: column;
            flex-direction: column;
            height: 100%;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-header {
            padding: 32px 24px;
            border-bottom: 1px solid var(--border);
        }

        .sidebar-header h1 {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--primary);
            letter-spacing: -0.025em;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .sidebar-nav {
            flex: 1;
            overflow-y: auto;
            padding: 24px 12px;
        }

        .nav-group {
            margin-bottom: 24px;
        }

        .nav-group-title {
            padding: 0 12px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            margin-bottom: 8px;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 8px;
            color: var(--text-main);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.2s;
            cursor: pointer;
        }

        .nav-item:hover {
            background: var(--bg-main);
            color: var(--primary);
        }

        .nav-item.active {
            background: #eff6ff;
            color: var(--primary);
        }

        .nav-item i {
            font-size: 1.1rem;
            width: 20px;
            text-align: center;
        }

        /* Main Content */
        .main-container {
            flex: 1;
            height: 100%;
            overflow-y: auto;
            padding: 48px;
            scroll-behavior: smooth;
        }

        .content-header {
            max-width: 900px;
            margin: 0 auto 48px;
        }

        .content-header h2 {
            font-size: 2.25rem;
            font-weight: 800;
            margin-bottom: 16px;
            letter-spacing: -0.025em;
        }

        .content-header p {
            font-size: 1.125rem;
            color: var(--text-muted);
            line-height: 1.6;
        }

        .info-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 48px;
        }

        .info-card {
            background: white;
            padding: 24px;
            border-radius: 16px;
            border: 1px solid var(--border);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .info-card h4 {
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--text-muted);
            margin-bottom: 12px;
            text-transform: uppercase;
        }

        .info-card p {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9375rem;
            color: var(--primary);
            word-break: break-all;
        }

        .endpoint-section {
            max-width: 900px;
            margin: 0 auto;
            display: none;
        }

        .endpoint-section.active {
            display: block;
            animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .endpoint-card {
            background: white;
            border-radius: 16px;
            border: 1px solid var(--border);
            margin-bottom: 24px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s;
        }
        
        .endpoint-card:hover {
            transform: scale(1.005);
        }

        .endpoint-header {
            padding: 24px;
            display: flex;
            align-items: center;
            gap: 16px;
            border-bottom: 1px solid var(--border);
        }

        .method {
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 0.75rem;
            text-transform: uppercase;
            min-width: 64px;
            text-align: center;
            color: white;
        }

        .method.get { background: var(--get); }
        .method.post { background: var(--post); }
        .method.patch { background: var(--patch); }
        .method.put { background: var(--put); }
        .method.delete { background: var(--delete); }

        .path {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 600;
            font-size: 0.9375rem;
            color: var(--text-main);
        }

        .auth-badge {
            margin-left: auto;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
        }

        .auth-required { background: #fef2f2; color: #ef4444; }
        .auth-optional { background: #fffbeb; color: #f59e0b; }
        .auth-admin { background: #faf5ff; color: #8b5cf6; }
        .auth-none { background: #f0fdf4; color: #22c55e; }

        .endpoint-body {
            padding: 24px;
        }

        .description {
            font-size: 1rem;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .params-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
        }

        .param-row {
            padding: 12px;
            background: var(--code-bg);
            border-radius: 8px;
            font-size: 0.875rem;
        }

        .param-name {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            color: var(--primary);
        }

        .param-type {
            color: var(--text-muted);
            margin-left: 8px;
        }

        .no-params {
            font-size: 0.875rem;
            color: var(--text-muted);
            font-style: italic;
        }

        .try-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 20px;
            padding: 10px 18px;
            background: var(--primary);
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-size: 0.875rem;
            font-weight: 700;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .try-button:hover {
            background: var(--primary-light);
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(99, 102, 241, 0.3);
        }

        .try-button i {
            font-size: 1rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .sidebar {
                width: 80px;
            }
            .nav-item span, .nav-group-title, .sidebar-header h1 span {
                display: none;
            }
            .main-container {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    <aside class="sidebar">
        <div class="sidebar-header">
            <h1>🌍 <span>Re7lty API</span></h1>
        </div>
        <nav class="sidebar-nav">
            <div class="nav-group">
                <div class="nav-group-title">Core Systems</div>
                <div class="nav-item active" onclick="showSection('trips')">✈️ <span>Trips</span></div>
                <div class="nav-item" onclick="showSection('users')">👤 <span>Users</span></div>
                <div class="nav-item" onclick="showSection('profiles')">📝 <span>Profiles</span></div>
                <div class="nav-item" onclick="showSection('stories')">📸 <span>Stories</span></div>
            </div>
            
            <div class="nav-group">
                <div class="nav-group-title">Communication</div>
                <div class="nav-item" onclick="showSection('chat')">💬 <span>Messaging (Chat)</span></div>
                <div class="nav-item" onclick="showSection('direct-chat')">✉️ <span>Direct Chat</span></div>
                <div class="nav-item" onclick="showSection('trip-groups')">👥 <span>Trip Groups</span></div>
                <div class="nav-item" onclick="showSection('notifications')">🔔 <span>Notifications</span></div>
            </div>

            <div class="nav-group">
                <div class="nav-group-title">Business (Corporate)</div>
                <div class="nav-item" onclick="showSection('corporate-trips')">🎫 <span>Corporate Trips</span></div>
                <div class="nav-item" onclick="showSection('corporate-companies')">🏢 <span>Companies</span></div>
                <div class="nav-item" onclick="showSection('bookings')">🏨 <span>Bookings</span></div>
                <div class="nav-item" onclick="showSection('submissions')">📄 <span>Submissions</span></div>
                <div class="nav-item" onclick="showSection('coupons')">🎟️ <span>Coupons</span></div>
            </div>

            <div class="nav-group">
                <div class="nav-group-title">Administration</div>
                <div class="nav-item" onclick="showSection('analytics')">📊 <span>Analytics</span></div>
                <div class="nav-item" onclick="showSection('complaints')">⚠️ <span>Complaints</span></div>
                <div class="nav-item" onclick="showSection('reports')">🚩 <span>Content Reports</span></div>
                <div class="nav-item" onclick="showSection('admin-users')">🔐 <span>Admin Management</span></div>
                <div class="nav-item" onclick="showSection('leaderboard')">🏆 <span>Leaderboard Settings</span></div>
            </div>

            <div class="nav-group">
                <div class="nav-group-title">System</div>
                <div class="nav-item" onclick="showSection('proxy')">🔌 <span>API Proxies</span></div>
                <div class="nav-item" onclick="showSection('health')">🏥 <span>Health Checks</span></div>
            </div>
        </nav>
    </aside>

    <main class="main-container">
        <div id="welcome-header" class="content-header">
            <h2>Backend API Explorer</h2>
            <p>Welcome to the Re7lty API command center. Here you can discover endpoints, understand authentication requirements, and view data schemas across all subsystems.</p>
        </div>

        <div class="info-cards">
            <div class="info-card">
                <h4>API Base URL</h4>
                <p>${baseUrl}/api</p>
            </div>
            <div class="info-card">
                <h4>Authentication</h4>
                <p>JWT (Clerk-based Bearer Token)</p>
            </div>
            <div class="info-card">
                <h4>Response Format</h4>
                <p>Application/JSON (UTF-8)</p>
            </div>
        </div>

        <!-- Trips Section -->
        <div id="section-trips" class="endpoint-section active">
            <div class="content-header">
                <h2>✈️ Trips Management</h2>
                <p>Public and community trips shared by travelers and explorers.</p>
            </div>
            ${renderEndpoint('GET', '/trips', 'Get list of trips with pagination and filters', 'query', ['q: string', 'city: string', 'sort: string', 'page: number'], 'optional')}
            ${renderEndpoint('GET', '/trips/:id', 'Get detailed trip information', 'params', ['id: string'], 'optional')}
            ${renderEndpoint('POST', '/trips', 'Publish a new trip story/plan', 'body', ['title', 'description', 'images[]', 'destination'], 'required')}
            ${renderEndpoint('PATCH', '/trips/:id', 'Update trip details', 'params/body', ['id: string', 'title?', 'description?'], 'required')}
            ${renderEndpoint('POST', '/trips/:id/love', 'Toggle love status for a trip', 'params', ['id: string'], 'required')}
            ${renderEndpoint('POST', '/trips/:id/save', 'Toggle save status for a trip', 'params', ['id: string'], 'required')}
        </div>

        <!-- Chat Section -->
        <div id="section-chat" class="endpoint-section">
            <div class="content-header">
                <h2>💬 Chat & Messaging</h2>
                <p>Direct communication between travelers and tourism companies.</p>
            </div>
            ${renderEndpoint('POST', '/chat/start', 'Start or retrieve a conversation with a company', 'body', ['companyId: string', 'tripId?: string'], 'required')}
            ${renderEndpoint('GET', '/chat/conversations', 'List all conversations for the current user/company', 'query', ['asCompany: boolean'], 'required')}
            ${renderEndpoint('GET', '/chat/:id/messages', 'Fetch message history for a conversation', 'params', ['id: string'], 'required')}
            ${renderEndpoint('POST', '/chat/:id/messages', 'Send a new message in a conversation', 'body', ['content: string', 'senderType: string'], 'required')}
        </div>

        <!-- Bookings Section -->
        <div id="section-bookings" class="endpoint-section">
            <div class="content-header">
                <h2>🏨 Booking System</h2>
                <p>Manage reservations for corporate and organized trips.</p>
            </div>
            ${renderEndpoint('GET', '/bookings/my-bookings', 'List all bookings made by the current user', 'none', [], 'required')}
            ${renderEndpoint('GET', '/bookings/company-bookings', 'List all bookings received by a company', 'none', [], 'required')}
            ${renderEndpoint('POST', '/bookings', 'Create a new trip booking', 'body', ['tripId', 'numberOfPeople', 'bookingDate', 'seats[]'], 'required')}
            ${renderEndpoint('POST', '/bookings/:id/accept', 'Approve a pending booking', 'params', ['id: string'], 'admin')}
            ${renderEndpoint('POST', '/bookings/:id/reject', 'Reject a pending booking', 'params/body', ['id: string', 'reason: string'], 'admin')}
            ${renderEndpoint('GET', '/bookings/analytics', 'Get booking success metrics', 'none', [], 'admin')}
        </div>

        <!-- Analytics Section -->
        <div id="section-analytics" class="endpoint-section">
            <div class="content-header">
                <h2>📊 Analytics & Insights</h2>
                <p>Advanced reporting for platform administrators and business owners.</p>
            </div>
            ${renderEndpoint('GET', '/analytics/overview', 'Get high-level platform statistics', 'none', [], 'admin')}
            ${renderEndpoint('GET', '/analytics/trips', 'Analyze trip engagement trends', 'none', [], 'admin')}
            ${renderEndpoint('GET', '/analytics/users', 'Analyze user growth and activity', 'none', [], 'admin')}
        </div>

        <!-- Users Section -->
        <div id="section-users" class="endpoint-section">
            <div class="content-header">
                <h2>👤 User Identity</h2>
                <p>Core user accounts and social graph management.</p>
            </div>
            ${renderEndpoint('GET', '/users/me', 'Get current user profile data', 'none', [], 'required')}
            ${renderEndpoint('PATCH', '/users/me', 'Update current user security details', 'body', ['fullName?', 'phone?'], 'required')}
            ${renderEndpoint('POST', '/users/:id/follow', 'Follow or unfollow a traveler', 'params', ['id: string'], 'required')}
            ${renderEndpoint('GET', '/users/:id/followers', 'List user followers', 'params', ['id: string'], 'none')}
        </div>

        <!-- Corporate Trips Section -->
        <div id="section-corporate-trips" class="endpoint-section">
            <div class="content-header">
                <h2>🏢 Corporate Travel</h2>
                <p>Enterprise-grade trip management for companies and travelers.</p>
            </div>
            ${renderEndpoint('GET', '/submissions/my-submissions', 'List all company submissions', 'none', [], 'required')}
        </div>

        <!-- Travel Memories Section -->
        <div id="section-memories" class="endpoint-section">
            <div class="content-header">
                <h2>📸 Travel Memories (Re7lty Reels)</h2>
                <p>Store and share your monthly travel highlights.</p>
            </div>
            ${renderEndpoint('GET', '/memories/:userId', 'Fetch all memories for a user', 'params', ['userId: string'], 'none')}
            ${renderEndpoint('POST', '/memories', 'Create or update a monthly memory', 'body', ['monthLabel: string', 'items: any[]', 'trackIndex: number'], 'required')}
        </div>
                <h2>🎫 Corporate Trips</h2>
                <p>Official trips organized by verified tourism agencies.</p>
            </div>
            ${renderEndpoint('GET', '/corporate/trips', 'List all active corporate trips', 'query', ['destination', 'companyId'], 'none')}
            ${renderEndpoint('GET', '/corporate/trips/:slug', 'Get corporate trip by slug', 'params', ['slug: string'], 'none')}
            ${renderEndpoint('POST', '/corporate/trips/admin/create', 'Add a new official trip', 'body', ['title', 'price', 'dates[]'], 'admin')}
        </div>

        <!-- Complaints Section -->
        <div id="section-complaints" class="endpoint-section">
            <div class="content-header">
                <h2>⚠️ Complaints & Support</h2>
                <p>User feedback and support request management.</p>
            </div>
            ${renderEndpoint('POST', '/complaints', 'Submit a platform complaint', 'body', ['name', 'email', 'message'], 'none')}
            ${renderEndpoint('GET', '/complaints', 'View all incoming complaints', 'none', [], 'admin')}
            ${renderEndpoint('PATCH', '/complaints/:id', 'Update complaint status', 'body', ['status', 'adminNotes'], 'admin')}
        </div>

        <!-- Profiles Section -->
        <div id="section-profiles" class="endpoint-section">
            <div class="content-header">
                <h2>📝 User Profiles</h2>
                <p>Public-facing identity and bio management.</p>
            </div>
            ${renderEndpoint('GET', '/profiles/me', 'Fetch current user private profile', 'none', [], 'required')}
            ${renderEndpoint('PATCH', '/profiles/me', 'Update bio, social links, and preferences', 'body', ['bio: string', 'socialLinks: object'], 'required')}
            ${renderEndpoint('GET', '/profiles/:username', 'Search public profile by username', 'params', ['username: string'], 'none')}
        </div>

        <!-- Stories Section -->
        <div id="section-stories" class="endpoint-section">
            <div class="content-header">
                <h2>📸 Stories (Ephemeral)</h2>
                <p>Post and manage temporary travel updates.</p>
            </div>
            ${renderEndpoint('GET', '/stories/following', 'Get active stories from friends', 'none', [], 'required')}
            ${renderEndpoint('POST', '/stories', 'Upload a new story', 'body (multipart)', ['image', 'caption?'], 'required')}
            ${renderEndpoint('POST', '/stories/:id/view', 'Record a story view', 'params', ['id: string'], 'required')}
            ${renderEndpoint('DELETE', '/stories/:id', 'Remove a story', 'params', ['id: string'], 'required')}
        </div>

        <!-- Notifications Section -->
        <div id="section-notifications" class="endpoint-section">
            <div class="content-header">
                <h2>🔔 Notifications</h2>
                <p>In-app alerts for likes, follows, and system updates.</p>
            </div>
            ${renderEndpoint('GET', '/notifications', 'List user notifications', 'query', ['limit: number'], 'required')}
            ${renderEndpoint('POST', '/notifications/read-all', 'Mark all as read', 'none', [], 'required')}
            ${renderEndpoint('POST', '/notifications/:id/read', 'Mark specific notification as read', 'params', ['id: string'], 'required')}
        </div>

        <!-- Corporate Companies Section -->
        <div id="section-corporate-companies" class="endpoint-section">
            <div class="content-header">
                <h2>🏢 Corporate Companies</h2>
                <p>Directory and management of tourism agencies.</p>
            </div>
            ${renderEndpoint('GET', '/corporate/companies', 'List all verified companies', 'none', [], 'none')}
            ${renderEndpoint('GET', '/corporate/companies/:id', 'Get company profile and active trips', 'params', ['id: string'], 'none')}
            ${renderEndpoint('GET', '/corporate/companies/admin/all', 'Admin: View all companies (incl. inactive)', 'none', [], 'admin')}
            ${renderEndpoint('PUT', '/corporate/companies/admin/:id/toggle-active', 'Admin: Enable/Disable company', 'params', ['id: string'], 'admin')}
        </div>

        <!-- Submissions Section -->
        <div id="section-submissions" class="endpoint-section">
            <div class="content-header">
                <h2>📄 Company Submissions</h2>
                <p>Onboarding workflow for new tourism agencies.</p>
            </div>
            ${renderEndpoint('POST', '/submissions', 'Submit agency verification request', 'body', ['companyName', 'commercialRegistry', 'ownerInfo'], 'none')}
            ${renderEndpoint('GET', '/submissions/admin', 'Admin: Get pending queue', 'none', [], 'admin')}
            ${renderEndpoint('PUT', '/submissions/admin/:id/approve', 'Admin: Convert submission to Company', 'params', ['id: string'], 'admin')}
        </div>

        <!-- Content Reports Section -->
        <div id="section-reports" class="endpoint-section">
            <div class="content-header">
                <h2>🚩 Content Moderation</h2>
                <p>Reporting system for inappropriate content.</p>
            </div>
            ${renderEndpoint('POST', '/content-reports', 'Report a trip or user', 'body', ['targetId', 'reason', 'description'], 'required')}
            ${renderEndpoint('GET', '/content-reports', 'Admin: List all reports', 'query', ['status: string'], 'admin')}
            ${renderEndpoint('PATCH', '/content-reports/:id', 'Admin: Resolve or dismiss report', 'params/body', ['id: string', 'status: string'], 'admin')}
        </div>

        <!-- Admin Management Section -->
        <div id="section-admin-users" class="endpoint-section">
            <div class="content-header">
                <h2>🔐 Admin Management</h2>
                <p>Platform user oversight and security controls.</p>
            </div>
            ${renderEndpoint('GET', '/admin/users', 'Admin: List all platform users', 'query', ['role', 'search'], 'admin')}
            ${renderEndpoint('PUT', '/admin/users/:id/role', 'Admin: Update user permissions', 'params/body', ['id: string', 'role: string'], 'admin')}
            ${renderEndpoint('DELETE', '/admin/users/:id', 'Admin: Permanently delete account', 'params', ['id: string'], 'admin')}
            ${renderEndpoint('GET', '/admin/complaints/comments', 'Admin: Manage support thread comments', 'none', [], 'admin')}
        </div>

        <!-- Health Check Section -->
        <div id="section-health" class="endpoint-section">
            <div class="content-header">
                <h2>🏥 System Health</h2>
                <p>Diagnostic tools for service availability.</p>
            </div>
            ${renderEndpoint('GET', '/health', 'Check backend and DB heartbeat', 'none', [], 'none')}
        </div>

        <!-- Direct Message Section -->
        <div id="section-direct-chat" class="endpoint-section">
            <div class="content-header">
                <h2>✉️ Direct Chat</h2>
                <p>Peer-to-peer user messaging system.</p>
            </div>
            ${renderEndpoint('GET', '/direct-chat/conversations', 'List direct conversations', 'none', [], 'required')}
            ${renderEndpoint('POST', '/direct-chat/start', 'Start direct chat with another user', 'body', ['participantId: string'], 'required')}
            ${renderEndpoint('GET', '/direct-chat/:id/messages', 'Get messages in a conversation', 'params', ['id: string'], 'required')}
            ${renderEndpoint('POST', '/direct-chat/:id/messages', 'Send a direct message', 'body', ['content: string'], 'required')}
        </div>

        <!-- Trip Groups Section -->
        <div id="section-trip-groups" class="endpoint-section">
            <div class="content-header">
                <h2>👥 Trip Groups Chat</h2>
                <p>Group coordination for official corporate trips.</p>
            </div>
            ${renderEndpoint('GET', '/trip-groups/my-groups', 'List groups the user is part of', 'none', [], 'required')}
            ${renderEndpoint('GET', '/trip-groups/:tripId', 'Get group chat for a specific trip', 'params', ['tripId: string'], 'required')}
            ${renderEndpoint('POST', '/trip-groups/:groupId/messages', 'Send message to a trip group', 'params/body', ['groupId: string', 'content: string'], 'required')}
        </div>

        <!-- Coupons Section -->
        <div id="section-coupons" class="endpoint-section">
            <div class="content-header">
                <h2>🎟️ Discount Coupons</h2>
                <p>Promotional codes for bookings.</p>
            </div>
            ${renderEndpoint('GET', '/coupons', 'List all valid coupons', 'none', [], 'none')}
            ${renderEndpoint('POST', '/coupons/validate', 'Check if a coupon is valid', 'body', ['code: string', 'tripId: string'], 'required')}
            ${renderEndpoint('POST', '/coupons', 'Admin: Create a new coupon', 'body', ['code', 'discountPercentage', 'expirationDate'], 'admin')}
            ${renderEndpoint('DELETE', '/coupons/:id', 'Admin: Delete a coupon', 'params', ['id: string'], 'admin')}
        </div>

        <!-- Leaderboard Section -->
        <div id="section-leaderboard" class="endpoint-section">
            <div class="content-header">
                <h2>🏆 Leaderboard System</h2>
                <p>Manage weekly winners and historical rankings.</p>
            </div>
            ${renderEndpoint('GET', '/leaderboard/current', 'Get the live leaderboard for the current week', 'none', [], 'none')}
            ${renderEndpoint('GET', '/leaderboard/history', 'List all historical weekly winners', 'none', [], 'none')}
            ${renderEndpoint('POST', '/leaderboard/end-week', 'Archive current results and reset weeklyLikes', 'none', [], 'admin')}
        </div>

        <!-- Proxy Section -->
        <div id="section-proxy" class="endpoint-section">
            <div class="content-header">
                <h2>🔌 External Integrations & Proxies</h2>
                <p>Bypass CORS and integrate with third-party providers securely.</p>
            </div>
            ${renderEndpoint('GET', '/proxy/hotels', 'Fetch live hotels data bypassing CORS limits', 'query', ['city: string'], 'none')}
        </div>


    </main>

    <script>
        function showSection(name) {
            // Update Navigation
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            event.currentTarget.classList.add('active');

            // Update Content
            document.querySelectorAll('.endpoint-section').forEach(el => el.classList.remove('active'));
            const target = document.getElementById('section-' + name);
            if (target) target.classList.add('active');
            
            // Scroll to top
            document.querySelector('.main-container').scrollTop = 0;
        }
    </script>
</body>
</html>
        `);
    });

    // Helper to render an endpoint in the docs
    function renderEndpoint(method: string, path: string, desc: string, paramType: string, params: string[], auth: string) {
        const authClasses: Record<string, string> = {
            'required': 'auth-required',
            'optional': 'auth-optional',
            'admin': 'auth-admin',
            'none': 'auth-none'
        };
        const authLabels: Record<string, string> = {
            'required': 'Auth Required',
            'optional': 'Auth Optional',
            'admin': 'Admin Restricted',
            'none': 'Public'
        };

        return `
            <div class="endpoint-card">
                <div class="endpoint-header">
                    <span class="method ${method.toLowerCase()}">${method}</span>
                    <span class="path">/api${path}</span>
                    <span class="auth-badge ${authClasses[auth]}">${authLabels[auth]}</span>
                </div>
                <div class="endpoint-body">
                    <p class="description">${desc}</p>
                    <div class="params-grid">
                        <div class="nav-group-title" style="padding:0; margin-bottom:8px; display:block;">Parameters (${paramType})</div>
                        ${params.length > 0
                ? params.map(p => `
                                <div class="param-row">
                                    <span class="param-name">${p.split(':')[0]}</span>
                                    <span class="param-type">${p.split(':')[1] || 'string'}</span>
                                </div>`).join('')
                : '<div class="no-params">No payload or query parameters required</div>'
            }
                    </div>
                    ${method === 'GET' && !path.includes(':')
                ? `<a href="/api${path}" target="_blank" class="try-button">
                            <span>🚀 Try Endpoint</span>
                           </a>`
                : `<a href="#" onclick="alert('This endpoint requires specific parameters or a non-GET method. Please use a tool like Postman or Insomnia with the path: /api${path}'); return false;" class="try-button" style="background: var(--secondary); opacity: 0.8;">
                            <span>🔗 View Path</span>
                           </a>`
            }
                </div>
            </div>
        `;
    }


    app.get("/api/health", async (_req, res) => {
        try {
            // Check if URI exists before attempting connection
            if (!process.env.MONGODB_URI) {
                return res.json({
                    status: "ok",
                    service: "backend",
                    db: "disconnected",
                    error: "MONGODB_URI is not set in environment variables.",
                    timestamp: new Date().toISOString()
                });
            }

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
            console.error("Health check database connection error:", error);
            res.json({
                status: "ok",
                service: "backend",
                db: "disconnected",
                error: error.message,
                details: "Please verify MONGODB_URI is correctly set in your deployment dashboard and IP is whitelisted.",
                timestamp: new Date().toISOString()
            });
        }
    });

    // Ensure database connection before handling routes (for serverless)
    app.use("/api", async (_req, _res, next) => {
        await ensureDatabaseConnection();
        next();
    });


    app.get("/api/proxy/hotels", async (req, res) => {
        try {
            const { city, budget, checkIn, checkOut, lat: qLat, lon: qLon, location_id: qLocationId } = req.query;
            // Prioritize RAPIDAPI_KEY from .env, then RAPIDAPI_HOTELS_KEY, then the fallback
            const HOTELS_KEY = process.env.RAPIDAPI_KEY_HOTELS_TRIP_ADVISOR;
            const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;

            // Generate default dates if missing (Very important for Tripadvisor API)
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const in4Days = new Date(today);
            in4Days.setDate(today.getDate() + 4);

            const finalCheckIn = checkIn || tomorrow.toISOString().split('T')[0];
            const finalCheckOut = checkOut || in4Days.toISOString().split('T')[0];

            let lat = qLat;
            let lon = qLon;
            let formattedHotels: any[] = [];

            let rawHotels: any[] = [];
            try {
                let hotelsUrl = "";
                if (qLocationId) {
                    console.log(`[Hotels Proxy] Trying Tripadvisor16 geoId: ${qLocationId}`);
                    hotelsUrl = `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels?geoId=${qLocationId}&checkIn=${finalCheckIn}&checkOut=${finalCheckOut}&pageNumber=1&currencyCode=EGP`;
                } else {
                    if (!lat || !lon) {
                        try {
                            const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(String(city))}&apiKey=${GEOAPIFY_KEY}`;
                            const geocodeRes = await axios.get(geocodeUrl);
                            if (geocodeRes.data.results?.[0]) {
                                lat = geocodeRes.data.results[0].lat;
                                lon = geocodeRes.data.results[0].lon;
                            }
                        } catch (e) { console.error("Geocoding failed"); }
                    }
                    
                    if (lat && lon) {
                        console.log(`[Hotels Proxy] Falling back to Tripadvisor16 lat/lng search: ${lat}, ${lon}`);
                        hotelsUrl = `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotelsByLocation?latitude=${lat}&longitude=${lon}&checkIn=${finalCheckIn}&checkOut=${finalCheckOut}&currencyCode=EGP`;
                    }
                }

                if (hotelsUrl) {
                    let response = await axios.get(hotelsUrl, {
                        headers: {
                            'X-RapidAPI-Key': HOTELS_KEY,
                            'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
                        },
                        timeout: 12000
                    });

                    // Comprehensive data extraction for Tripadvisor16
                    rawHotels = response.data?.data?.data || response.data?.data || response.data?.hotels || response.data?.results || [];
                    
                    if (!Array.isArray(rawHotels) && typeof response.data?.data === 'object') {
                         const possibleKeys = ['data', 'hotels', 'results', 'items', 'list'];
                         for (const key of possibleKeys) {
                             if (Array.isArray(response.data.data[key])) {
                                 rawHotels = response.data.data[key];
                                 break;
                             }
                         }
                    }
                }

                // Intermediate Fallback: If geoId search returned nothing, try lat/lng search
                if ((!rawHotels || rawHotels.length === 0) && lat && lon) {
                    console.log(`[Hotels Proxy] No results for geoId ${qLocationId}, trying lat/lng search...`);
                    const fallbackUrl = `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotelsByLocation?latitude=${lat}&longitude=${lon}&checkIn=${finalCheckIn}&checkOut=${finalCheckOut}&currencyCode=EGP`;
                    let fbResponse = await axios.get(fallbackUrl, {
                        headers: {
                            'X-RapidAPI-Key': HOTELS_KEY,
                            'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
                        },
                        timeout: 10000
                    }).catch(() => null);

                    if (fbResponse?.data) {
                        const fbData = fbResponse.data?.data?.data || fbResponse.data?.data || fbResponse.data?.hotels || fbResponse.data?.results || [];
                        if (Array.isArray(fbData) && fbData.length > 0) {
                            rawHotels = fbData;
                        }
                }
            }

            // FALLBACK: If Tripadvisor16 failed or returned nothing, try Booking.com
                if ((!rawHotels || rawHotels.length === 0) && lat && lon) {
                    console.log(`[Hotels Proxy] Tripadvisor16 returned no results. Falling back to Booking.com...`);
                    const bookingUrl = `https://booking-com.p.rapidapi.com/v1/hotels/search-by-coordinates?longitude=${lon}&latitude=${lat}&checkin_date=${finalCheckIn}&checkout_date=${finalCheckOut}&locale=en-gb&filter_by_currency=EGP&room_number=1&adults_number=2&order_by=popularity&units=metric&page_number=0&include_adjacency=true`;
                    
                    const bRes = await axios.get(bookingUrl, {
                        headers: {
                            'X-RapidAPI-Key': HOTELS_KEY,
                            'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
                        },
                        timeout: 12000
                    });
                    
                    const bData = bRes.data?.result || bRes.data?.data || bRes.data || [];
                    if (Array.isArray(bData)) {
                        rawHotels = bData.map((h: any) => ({
                            id: h.hotel_id,
                            title: h.hotel_name,
                            name: h.hotel_name,
                            bubbleRating: { rating: h.review_score / 2 || 4.5 },
                            rating: h.review_score / 2 || 4.5,
                            priceForDisplay: h.min_total_price ? `${h.min_total_price} EGP` : "Check Price",
                            cardPhotos: [{ sizes: { urlTemplate: h.main_photo_url?.replace('square60', 'max1280x900') } }],
                            latitude: h.latitude,
                            longitude: h.longitude,
                            address: h.address || h.city
                        }));
                    }
                }
                
                if (!Array.isArray(rawHotels)) rawHotels = [];

                formattedHotels = rawHotels
                    .filter((h: any) => h && (h.title || h.name || h.hotel_name))
                    .map((h: any) => {
                        let photoUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80";
                        
                        if (h.cardPhotos?.[0]?.sizes?.urlTemplate) {
                            photoUrl = h.cardPhotos[0].sizes.urlTemplate
                                .replace('{width}', '800')
                                .replace('{height}', '500');
                        } else if (h.heroImage?.urlTemplate) {
                             photoUrl = h.heroImage.urlTemplate
                                .replace('{width}', '800')
                                .replace('{height}', '500');
                        } else if (h.photo?.images?.large?.url) {
                            photoUrl = h.photo.images.large.url;
                        }

                        const price = h.priceForDisplay || 
                                      h.commerceInfo?.priceForDisplay?.text || 
                                      h.priceSummary?.price?.text ||
                                      "جاري التحقق";

                        return {
                            location_id: h.id || h.hotelId || String(Math.random()),
                            name: h.title || h.name || "فندق في " + city,
                            latitude: h.latitude,
                            longitude: h.longitude,
                            address: h.address || String(city),
                            rating: h.bubbleRating?.rating || h.rating || "4.5",
                            price: price,
                            photo: {
                                images: {
                                    medium: { url: photoUrl },
                                    large: { url: photoUrl }
                                }
                            },
                            amenities: ["Wi-Fi", "Parking", "Pool"]
                        };
                    });
                
                console.log(`[Hotels Proxy] Found ${formattedHotels.length} hotels`);

                // EXTRA SAFETY: If location_id returned 0, try list-by-latlng as last resort
                if (formattedHotels.length === 0 && qLocationId && (qLat || qLon || city)) {
                    console.log(`[Hotels Proxy] 0 results for geoId ${qLocationId}, trying lat/lng fallback...`);
                    // We recursive-like call ourselves or just run the other URL logic
                    // For simplicity, just return empty and let frontend fallback, 
                    // or implement a quick retry here.
                }

                return res.json(formattedHotels);

            } catch (apiErr: any) {
                console.error("[Hotels Proxy] Internal fetch failed:", apiErr.message);
                return res.json([]); // Return empty list on failure
            }
        } catch (error: any) {
            console.error("Hotels Proxy critical error:", error.message);
            res.status(500).json({ error: error.message });
        }
    });

    // RapidAPI proxies to prevent CORS issues on the frontend
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '2ed4a558c2mshe06fddea2ff2dd5p196f5ejsne6f896119af2';
    
    app.get("/api/proxy/search", async (req, res) => {
        try {
            const { query } = req.query;
            console.log(`[Search Proxy] Dual-search for: ${query}`);
            
            let taLocationId: string | null = null;
            let taName: string | null = null;
            let taLat: string | null = null;
            let taLng: string | null = null;
            let t16GeoId: string | null = null;

            // Run both APIs in parallel for speed
            const [taResult, t16Result] = await Promise.allSettled([
                // Travel Advisor → numeric location_id for attractions/restaurants
                axios.get(
                    `https://travel-advisor.p.rapidapi.com/locations/search?query=${encodeURIComponent(String(query))}&limit=1&offset=0&units=km&currency=USD&sort=relevance&lang=en_US`,
                    { headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com' }, timeout: 8000 }
                ),
                // Tripadvisor16 → geoId for hotels
                axios.get(
                    `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchLocation?query=${encodeURIComponent(String(query))}`,
                    { headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com' }, timeout: 8000 }
                )
            ]);

            // Extract Travel Advisor result
            if (taResult.status === 'fulfilled') {
                const firstResult = taResult.value.data?.data?.[0]?.result_object;
                if (firstResult?.location_id) {
                    taLocationId = firstResult.location_id;
                    taName = firstResult.name;
                    taLat = firstResult.latitude;
                    taLng = firstResult.longitude;
                    console.log(`[Search Proxy] TA: ${taName} (id: ${taLocationId}, lat: ${taLat})`);
                }
            } else {
                console.warn(`[Search Proxy] Travel Advisor failed: ${taResult.reason?.message}`);
            }

            // Extract Tripadvisor16 result
            if (t16Result.status === 'fulfilled') {
                const t16Items = t16Result.value.data?.data || [];
                if (Array.isArray(t16Items) && t16Items.length > 0) {
                    t16GeoId = t16Items[0].geoId || t16Items[0].locationId;
                    // Also use T16 coords if TA didn't return them
                    if (!taLat && t16Items[0].latitude) taLat = t16Items[0].latitude;
                    if (!taLng && t16Items[0].longitude) taLng = t16Items[0].longitude;
                    console.log(`[Search Proxy] T16 geoId: ${t16GeoId}`);
                }
            } else {
                console.warn(`[Search Proxy] Tripadvisor16 failed: ${t16Result.reason?.message}`);
            }

            if (!taLocationId && !t16GeoId) {
                console.warn(`[Search Proxy] No results found for: ${query}`);
                return res.json({ data: [] });
            }

            // Return BOTH IDs — frontend uses location_id for attractions/restaurants,
            // geoId is passed separately to the hotels proxy
            res.json({
                data: [{
                    result_object: {
                        location_id: taLocationId || t16GeoId, // TA id primary, T16 geoId fallback
                        geoId: t16GeoId,                        // T16 geoId specifically for hotels
                        name: taName || String(query),
                        latitude: taLat,
                        longitude: taLng
                    }
                }]
            });
        } catch(error: any) { 
            console.error("Proxy search error:", error.message);
            res.status(500).json({ error: error.message });
        }
    });

    app.get("/api/proxy/attractions", async (req, res) => {
        try {
            const { location_id, limit } = req.query;
            if (!location_id || location_id === 'undefined') {
                return res.json({ data: [] });
            }
            console.log(`[Attractions Proxy] Travel Advisor - location_id: ${location_id}`);

            const fullUrl = `https://travel-advisor.p.rapidapi.com/attractions/list?location_id=${location_id}&currency=USD&lang=en_US&lunit=km&limit=${limit || 12}&sort=recommended`;
            let response;
            try {
                response = await axios.get(fullUrl, {
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
                    },
                    timeout: 10000
                });
            } catch (err: any) {
                console.warn(`[Attractions Proxy] Primary key failed, trying fallback...`);
                const fallbackKey = '2ed4a558c2mshe06fddea2ff2dd5p196f5ejsne6f896119af2';
                response = await axios.get(fullUrl, {
                    headers: {
                        'X-RapidAPI-Key': fallbackKey,
                        'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
                    },
                    timeout: 10000
                });
            }

            // Robustly extract data array from various possible structures
            let rawData = response.data?.data || response.data?.results || response.data || [];
            if (!Array.isArray(rawData) && typeof response.data === 'object') {
                const keys = ['data', 'results', 'items', 'attractions'];
                for (const k of keys) {
                    if (Array.isArray(response.data[k])) {
                        rawData = response.data[k];
                        break;
                    }
                }
            }
            
            const results = Array.isArray(rawData) ? rawData.filter((item: any) => item && (item.name || item.title)) : [];

            console.log(`[Attractions Proxy] Found ${results.length} attractions`);

            const normalized = results.map((item: any) => {
                // Travel Advisor stores photos in photo.images nested object
                const photoUrl = item.photo?.images?.large?.url
                    || item.photo?.images?.medium?.url
                    || item.photo?.images?.original?.url
                    || "https://images.unsplash.com/photo-1548013146-72479768bbaa?w=800&q=80";

                return {
                    location_id: item.location_id || String(Math.random()),
                    name: item.name || "معلم سياحي",
                    description: item.description || item.ranking_denominator || "",
                    rating: String(item.rating || item.bubbleRating?.rating || "4.5"),
                    num_reviews: item.num_reviews || "0",
                    ranking: item.ranking || "",
                    latitude: item.latitude,
                    longitude: item.longitude,
                    address: item.address || "",
                    website: item.website || "",
                    photo: {
                        images: {
                            large: { url: photoUrl },
                            medium: { url: item.photo?.images?.medium?.url || photoUrl }
                        }
                    }
                };
            });

            res.json({ data: normalized });
        } catch(error: any) { 
            console.error("Proxy attractions error:", error.message);
            res.status(500).json({ error: error.message });
        }
    });

    app.get("/api/proxy/restaurants", async (req, res) => {
        try {
            const { location_id, limit } = req.query;
            if (!location_id || location_id === 'undefined') {
                return res.json({ data: [] });
            }
            console.log(`[Restaurants Proxy] Travel Advisor - location_id: ${location_id}`);

            const fullUrl = `https://travel-advisor.p.rapidapi.com/restaurants/list?location_id=${location_id}&currency=USD&lang=en_US&lunit=km&limit=${limit || 12}&sort=recommended`;
            let response;
            try {
                response = await axios.get(fullUrl, {
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
                    },
                    timeout: 10000
                });
            } catch (err: any) {
                console.warn(`[Attractions Proxy] Primary key failed, trying fallback...`);
                const fallbackKey = '2ed4a558c2mshe06fddea2ff2dd5p196f5ejsne6f896119af2';
                response = await axios.get(fullUrl, {
                    headers: {
                        'X-RapidAPI-Key': fallbackKey,
                        'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
                    },
                    timeout: 10000
                });
            }

            // Robustly extract data array from various possible structures
            let rawData = response.data?.data || response.data?.results || response.data || [];
            if (!Array.isArray(rawData) && typeof response.data === 'object') {
                const keys = ['data', 'results', 'items', 'restaurants'];
                for (const k of keys) {
                    if (Array.isArray(response.data[k])) {
                        rawData = response.data[k];
                        break;
                    }
                }
            }
            
            const results = Array.isArray(rawData) ? rawData.filter((item: any) => item && (item.name || item.title)) : [];

            console.log(`[Restaurants Proxy] Found ${results.length} restaurants`);

            const normalized = results.map((item: any) => {
                const photoUrl = item.photo?.images?.large?.url
                    || item.photo?.images?.medium?.url
                    || item.photo?.images?.original?.url
                    || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";

                return {
                    location_id: item.location_id || String(Math.random()),
                    name: item.name || "مطعم",
                    description: item.description || "",
                    rating: String(item.rating || item.bubbleRating?.rating || "4.3"),
                    num_reviews: item.num_reviews || "0",
                    price_level: item.price_level || item.price || "",
                    latitude: item.latitude,
                    longitude: item.longitude,
                    address: item.address || "",
                    phone: item.phone || "",
                    website: item.website || "",
                    cuisine: Array.isArray(item.cuisine) ? item.cuisine : [],
                    photo: {
                        images: {
                            large: { url: photoUrl },
                            medium: { url: item.photo?.images?.medium?.url || photoUrl }
                        }
                    }
                };
            });

            res.json({ data: normalized });
        } catch(error: any) { 
            console.error("Proxy restaurants error:", error.message);
            res.status(500).json({ error: error.message });
        }
    });

    app.get("/api/proxy/hotels-by-location", async (req, res) => {
        try {
            const { latitude, longitude, checkIn, checkOut, units = 'metric' } = req.query;
            
            if (!latitude || !longitude || !checkIn || !checkOut) {
                return res.status(400).json({ error: "Missing required parameters: latitude, longitude, checkIn, checkOut" });
            }

            const hotelsKey = process.env.RAPIDAPI_HOTELS_KEY || '2ed4a558c2mshe06fddea2ff2dd5p196f5ejsne6f896119af2';
            
            // Booking.com Search by Coordinates API
            const fullUrl = `https://booking-com.p.rapidapi.com/v1/hotels/search-by-coordinates?latitude=${latitude}&longitude=${longitude}&checkin_date=${checkIn}&checkout_date=${checkOut}&units=${units}&room_number=1&adults_number=2&order_by=popularity&locale=ar&currency=EGP`;
            
            console.log(`[Proxy] Searching hotels near ${latitude}, ${longitude} for dates ${checkIn} to ${checkOut}`);
            
            const response = await axios.get(fullUrl, {
                headers: {
                    'X-RapidAPI-Key': hotelsKey,
                    'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
                }
            });
            
            res.json(response.data);
        } catch(error: any) { 
            console.error("Proxy hotels error:", error.message);
            res.status(500).json({ error: error.message });
        }
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

    // Complaints and Content Reports
    app.use("/api/complaints", complaintsRouter);
    app.use("/api/content-reports", contentReportsRouter);

    // Bookings routes
    app.use("/api/bookings", bookingsRouter);

    // Paymob Payment Gateway
    app.use("/api/paymob", paymobRouter);
    app.use("/api/chat", chatRouter);
    app.use("/api/direct-chat", directChatRouter);
    app.use("/api/trip-groups", tripGroupChatRouter);
    app.use("/api/coupons", couponsRouter);
    app.use("/api/memories", memoriesRouter);
    app.use("/api/leaderboard", leaderboardRouter);

    // Admin Comments Integration (part of complaints section)
    app.use("/api/admin/complaints/comments", adminCommentsRouter);

    app.use("/api", (req, res) => {
        res.status(404).json({ error: "Not Found", path: req.path });
    });

    // Error handling middleware (must be last)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        if (err.type === "entity.too.large") {
            return res.status(413).json({
                error: "Payload Too Large",
                message: "Request payload exceeds the maximum allowed size (200MB).",
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



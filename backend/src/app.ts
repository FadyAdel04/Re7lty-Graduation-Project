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
import complaintsRouter from "./routes/complaints";
import contentReportsRouter from "./routes/contentReports";
import adminCommentsRouter from "./routes/adminComments";
import bookingsRouter from "./routes/bookings";
import chatRouter from "./routes/chat";
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
                <div class="nav-item" onclick="showSection('notifications')">🔔 <span>Notifications</span></div>
            </div>

            <div class="nav-group">
                <div class="nav-group-title">Business (Corporate)</div>
                <div class="nav-item" onclick="showSection('corporate-trips')">🎫 <span>Corporate Trips</span></div>
                <div class="nav-item" onclick="showSection('corporate-companies')">🏢 <span>Companies</span></div>
                <div class="nav-item" onclick="showSection('bookings')">🏨 <span>Bookings</span></div>
                <div class="nav-item" onclick="showSection('submissions')">📄 <span>Submissions</span></div>
            </div>

            <div class="nav-group">
                <div class="nav-group-title">Administration</div>
                <div class="nav-item" onclick="showSection('analytics')">📊 <span>Analytics</span></div>
                <div class="nav-item" onclick="showSection('complaints')">⚠️ <span>Complaints</span></div>
                <div class="nav-item" onclick="showSection('reports')">🚩 <span>Content Reports</span></div>
                <div class="nav-item" onclick="showSection('admin-users')">🔐 <span>Admin Management</span></div>
            </div>

            <div class="nav-group">
                <div class="nav-group-title">System</div>
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

    // Complaints and Content Reports
    app.use("/api/complaints", complaintsRouter);
    app.use("/api/content-reports", contentReportsRouter);

    // Bookings routes
    app.use("/api/bookings", bookingsRouter);
    app.use("/api/chat", chatRouter);

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



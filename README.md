# 🌍 Re7lty – رحلتي | Your Journey Platform

<div align="center">


**A full-stack travel social media & SaaS platform with AI trip planning**

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Flutter](https://img.shields.io/badge/Flutter-3-blue?logo=flutter)](https://flutter.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb)](https://mongodb.com)

</div>

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Three Main Pillars](#-three-main-pillars)
3. [Web App – Frontend Pages](#-web-app--frontend-pages)
4. [Admin Dashboard](#-admin-dashboard)
5. [Company Dashboard (SaaS)](#-company-dashboard-saas)
6. [AI Trip Assistant](#-ai-trip-assistant-tripai)
7. [Flutter Mobile App](#-flutter-mobile-app)
8. [Backend API](#-backend-api)
9. [Database Models](#-database-models)
10. [Tech Stack](#-tech-stack)
11. [Environment Variables](#-environment-variables)
12. [Running Locally](#-running-locally)
13. [Deploying to Vercel](#-deploying-the-backend-to-vercel)

---

## 🧭 Project Overview

**Re7lty** is an all-in-one interactive travel platform that brings together three powerful experiences:

| Pillar | Description |
|--------|-------------|
| 🏖️ **Social Travel Network** | Share, explore and follow travellers. Create rich trip posts with maps, photos, videos, and day-by-day itineraries. |
| 🏢 **SaaS for Tourism Companies** | Companies manage their trips, bookings, payments, seat allocation, coupons, group chats, and analytics from one dashboard. |
| 🤖 **AI Trip Planner (TripAI)** | An intelligent assistant that suggests personalised trip plans based on destination, budget, days and travel style — and links them to real platform trips. |

The platform serves **three roles**: regular travellers, tourism company owners, and platform administrators — each with a tailored interface on both web and mobile.

---

## ✨ Three Main Pillars

### 1️⃣ Social Travel Network

A travel-focused social media experience — share, discover and connect.

| Feature | Details |
|---------|---------|
| **Timeline** | Personalised feed of trips from followed users, with like, comment and save actions |
| **Discover / Explore** | Search trips & users by keyword; filter by Trending / Latest; live map of trip destinations |
| **Create Trip** | Full rich editor: destination, duration, daily itinerary, activities (restaurants, museums, beaches), photo/video upload, interactive map route, hotel & food sections, transport options, budget estimate |
| **Trip Types** | `detailed` (full multi-day trip), `quick` (simple post), `ask` (question/discussion post, no gamification points) |
| **Interactive Map** | Animated route on Mapbox/Leaflet with markers for every activity stop |
| **Social Interactions** | Likes ❤️, Saves 🔖, Shares 📤, nested Comments 💬 with replies, follow/unfollow travellers |
| **User Profile** | Bio, cover image, trip count, countries visited (with world map), followers/following, Explorer Level badge, connections network |
| **Gamification** | Badge levels: `none → bronze → silver → gold → diamond → legend`; activity score updated on trips, likes and follows |
| **Leaderboard** | Weekly rankings of top-rated trips and most active travellers (stored per week/year) |
| **Travel Memories** | Auto-generated slideshow video from trip photos; add music and captions; export as "Travel Memory Clip" |
| **Direct Messages** | Private 1-to-1 chat between users; supports text, images, voice and files |
| **Stories** | 24-hour expiring photo/video stories; view count tracking; stories archive |
| **Trip Group Chat** | Group conversation per corporate trip; text, images, voice, video, PDF; reactions, announcements, lock/unlock mode |
| **Notifications** | Real-time push via Pusher for likes, comments, follows, tags and messages |
| **AI Tour Guide Widget** | Floating AI chat widget available on main pages for quick travel queries |
| **Trip Templates / Agency** | Browse curated trip templates at `/agency` |
| **Trip Calendar & Budget** | Personal trip calendar, budget estimator, weather forecast, local transport suggestions |

---

### 2️⃣ SaaS for Tourism Companies

A complete B2B management system embedded in the platform.

| Feature | Details |
|---------|---------|
| **Company Onboarding** | Role selection (user / company); company application form; admin review & approval workflow |
| **Company Public Page** | Public-facing company profile at `/companies/:id` with rating, tags, trips and contact info |
| **Company Dashboard** | Single-page SaaS dashboard with sidebar navigation: Overview, Trips, Bookings, Seats, Coupons, Messages, Reports, Settings |
| **KPI Summary Cards** | Total bookings, pending requests, accepted bookings, active trips, net profit, weekly earnings, collected payments, outstanding payments, trip views, today's bookings, monthly revenue |
| **Corporate Trip Management** | Create/edit/delete company trips with rich fields: title, description, dates, price, images, itinerary, included/excluded services, transportation units, stay details, meeting location |
| **Trip Detail (Customer View)** | Customer-facing page at `/corporate-trips/:slug` — full trip details, booking form, seat map, coupon code field |
| **Bookings Management** | List all bookings; accept/reject with reason; update payment status (unpaid / pending / partially paid / paid / refunded); filter by status/date; passenger details |
| **Seat Allocation** | Interactive bus seat map; assign seats per booking; supports bus-48, minibus-28, van-14, bus-50 configurations |
| **Coupon System** | Create percentage or fixed-amount coupons; set expiry, usage limit, and applicable trips; validate on booking |
| **Company Messages** | Customer inquiries from the company dashboard; direct chat thread with each customer |
| **Trip Group Chat** | Dedicated group per trip with company as admin; send announcements; lock group after trip completion |
| **Payment Integration** | Paymob payment gateway integration for card payments; booking payment result page with success/failure handling |
| **Reports & Analytics** | Revenue charts (recharts); booking trends; platform commission breakdown (5% per successful booking) |
| **Company Settings** | Update company name, logo, description, colour theme, contact info (phone, WhatsApp, email, website, address) |
| **QR Code Scanner (Mobile)** | Company staff can scan booking QR codes on-site via the Flutter app to verify attendees |
| **Real-time Notifications** | Pusher-powered instant alerts for new messages and booking events |

---

### 3️⃣ AI Trip Assistant (TripAI)

An intelligent conversational planner and discovery engine.

| Feature | Details |
|---------|---------|
| **TripAI Chat Page** (`/trip-assistant`) | Full-page AI conversation: set destination, days, budget, travel style (adventure / relaxation / family / romantic), and season |
| **Smart Suggestions** | AI generates a day-by-day itinerary with landmarks, restaurants and hotels tailored to inputs |
| **Hotel & Restaurant Cards** | Selectable accommodation and dining options that get added to the trip plan |
| **Link to Platform Trips** | Displays matching real Re7lty corporate trips alongside the AI plan |
| **One-Click Trip Creation** | Convert the AI-generated plan into an actual trip post (Create Trip) in one click |
| **Global AI Widget** (`TripAIChatWidget`) | Floating chat widget active on `/`, `/discover`, `/timeline`, `/agency`, `/leaderboard` for quick queries |
| **AI Tour Guide** | `AITourGuide` component provides contextual guidance across all pages |
| **AI Usage Tracking** | `AIPlanUsage` model tracks per-user AI plan consumption |
| **Multi-LLM Support** | Configurable to use OpenRouter, OpenAI, Google Generative AI, or Groq SDK |

---

## 🖥️ Web App – Frontend Pages

Built with **React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion**. All routes are lazy-loaded for performance.

### Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Index.tsx` | Landing / home page |
| `/timeline` | `Timeline.tsx` | Social feed of trip posts |
| `/discover` | `DiscoverPage.tsx` | Explore trips and users with map |
| `/agency` | `Templates.tsx` | Curated trip templates |
| `/leaderboard` | `Leaderboard.tsx` | Weekly top travellers |
| `/trip-assistant` | `TripAIChat.tsx` | AI trip planner chat |
| `/trips/:id` | `TripDetail.tsx` | Full trip post detail page |
| `/corporate-trips/:slug` | `TripDetailsPage.tsx` | Corporate trip booking page |
| `/user/:id` | `UserProfile.tsx` | User profile page |
| `/user/:id/network` | `UserConnectionsPage.tsx` | Follower/following network |
| `/auth` | `Auth.tsx` | Sign in page (Clerk) |
| `/auth/sign-up` | `SignUp.tsx` | Sign up page |
| `/support` | `Support.tsx` | Support centre |
| `/help` | `Help.tsx` | Help & FAQs |
| `/terms` | `Terms.tsx` | Terms of service |
| `/privacy` | `Privacy.tsx` | Privacy policy |
| `/contact` | `Contact.tsx` | Contact form / complaints |

### Protected Routes (Signed-in Users)

| Route | Component | Description |
|-------|-----------|-------------|
| `/trips/new` | `CreateTrip.tsx` | Create a new trip post |
| `/trips/edit/:id` | `EditTrip.tsx` | Edit an existing trip |
| `/messages` | `DirectMessages.tsx` | Direct messaging inbox (tabs: direct, company) |
| `/trip-groups` | `TripGroupMessages.tsx` | Trip group chat list |
| `/verify-booking` | `BookingVerify.tsx` | Verify booking by reference number or QR |
| `/verify-booking/:reference` | `BookingVerify.tsx` | Deep-link booking verification |
| `/booking/:bookingId/pay` | `BookingPaymentPage.tsx` | Paymob payment checkout |
| `/booking-payment-result` | `BookingPaymentResult.tsx` | Post-payment success/failure page |
| `/company/dashboard` | `CompanyDashboard.tsx` | Company SaaS dashboard |
| `/companies/:id` | `CompanyDetailsPage.tsx` | Public company profile |

### Onboarding Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/onboarding/role` | `UserRoleSelection.tsx` | Choose user or company role (new users only) |
| `/onboarding/company-apply` | `CompanyRegistrationPage.tsx` | Submit company application |

---

## 🛡️ Admin Dashboard

Accessible at `/admin` — protected by admin email check. Contains tabbed sub-pages:

| Route | Page | Description |
|-------|------|-------------|
| `/admin` / `/admin/dashboard` | `AdminDashboard.tsx` | Overview: KPI cards, charts, recent activity |
| `/admin/users` | `AdminUsers.tsx` | View, search and manage all registered users; change roles; view activity score and badge |
| `/admin/submissions` | `SubmissionsPage.tsx` | Review company registration applications; approve or reject with notes |
| `/admin/companies` | `CompaniesManagementPage.tsx` | Manage all approved companies; activate/deactivate; edit company data |
| `/admin/trips` | `TripsManagementPage.tsx` | View and moderate all trip posts across the platform |
| `/admin/reports` | `ReportsPage.tsx` | Financial reports: revenue, commissions, booking stats with export (PDF/Excel via jsPDF + AutoTable) |
| `/admin/moderation` | `AdminContentModeration.tsx` | Review content reports (flagged trips/comments); remove content; manage `ContentReport` and `RemovedComment` records |
| `/admin/complaints` | `ComplaintsPage.tsx` | Handle user complaints; update status (pending / resolved / dismissed); add admin notes |

### Admin Capabilities Summary
- Full user management (view, role change, activity data)
- Company lifecycle management (approve, reject, deactivate)
- Content moderation (reports, flagged content, removed comments)
- Financial analytics and commission tracking (5% per booking)
- Complaint resolution workflow
- Platform-wide trip oversight

---

## 🏢 Company Dashboard (SaaS)

The Company Dashboard (`/company/dashboard`) is a comprehensive single-page application for tourism company owners. It uses a tab-based sidebar:

### Dashboard Tabs

| Tab | Key Features |
|-----|-------------|
| **Overview** | KPI cards: total bookings, pending, accepted, active trips, net profit, weekly earnings, collected vs outstanding payments, views, today's bookings, monthly revenue |
| **Trips** | List all company trips with status; create new trip (full form with images, itinerary, transportation, stay details); edit/delete trips; view per-trip analytics |
| **Bookings** | All bookings with filters (status, date, payment); accept/reject booking with reasons; update payment status (unpaid → pending → partially_paid → paid → refunded); view passenger manifest; download booking details |
| **Seats** | Interactive bus seat layout; assign seats to confirmed bookings; visual occupancy at a glance; supports multiple vehicle types |
| **Coupons** | Create discount codes (% or fixed EGP); set expiry dates, usage limits and applicable trips; view usage count |
| **Messages** | Inbox of customer inquiries; threaded chat with each customer; unread badge counter; Pusher-powered real-time updates |
| **Reports** | Revenue charts (line/bar with Recharts); booking trend analysis; commission deduction breakdown; export to PDF |
| **Settings** | Update company name, logo, description, brand colour, phone, WhatsApp, email, website, address |

---

## 🤖 AI Trip Assistant (TripAI)

Full details of the AI-powered features:

### Web (`TripAIChat.tsx` — `/trip-assistant`)

- **Conversational UI**: Multi-turn chat with the AI; conversation history retained per session
- **Trip Parameters**: Destination, number of days, budget (EGP), travel style, season
- **Generated Plan**: Day-by-day itinerary cards; each day lists activities, recommended restaurants and hotel options
- **Selectable Items**: Click to toggle hotels/restaurants into the final plan
- **Platform Trip Matching**: API call to fetch real corporate trips matching user criteria; displayed alongside AI plan
- **Create from AI**: Button to push the AI plan directly into the Create Trip form pre-filled
- **Widget Mode** (`TripAIChatWidget`): Compact floating chat bubble on main pages

### AI Providers Used
| Provider | SDK | Use Case |
|----------|-----|----------|
| OpenRouter | `@openrouter/sdk` | Primary AI routing (web) |
| Google Generative AI | `@google/generative-ai` | Gemini models (web) |
| Groq | `groq-sdk` | Fast inference (web & backend) |
| OpenAI-compatible | `openai` (via OpenRouter) | Flexible fallback |

---

## 📱 Flutter Mobile App

The **Re7lty Flutter app** (`/flutter`) is a full-featured cross-platform mobile client (Android & iOS) that mirrors and extends the web experience.

### Tech Stack (Mobile)
| Package | Version | Purpose |
|---------|---------|---------|
| `flutter_riverpod` | ^2.4.9 | State management |
| `go_router` | ^13.2.0 | Declarative routing |
| `dio` | ^5.4.0 | HTTP client |
| `clerk_auth` / `clerk_flutter` | 0.0.14-beta | Authentication |
| `mapbox_maps_flutter` | ^2.2.1 | Maps & route visualisation |
| `flutter_map` | ^8.3.0 | OpenStreetMap fallback |
| `pusher_channels_flutter` | ^2.6.0 | Real-time events |
| `image_picker` | ^1.1.2 | Camera & gallery |
| `file_picker` | ^8.0.3 | File attachments |
| `fl_chart` | ^0.69.0 | Dashboard charts |
| `mobile_scanner` | ^5.2.3 | QR code scanning |
| `qr_flutter` | ^4.1.0 | QR code generation |
| `video_player` | ^2.9.2 | In-app video playback |
| `audioplayers` | ^6.1.0 | Voice message playback |
| `carousel_slider` | ^5.0.0 | Image carousels |
| `flutter_animate` | ^4.5.0 | Animations |
| `google_fonts` | ^6.1.0 | Cairo Arabic font |
| `shimmer` | ^3.0.0 | Loading skeletons |
| `share_plus` | ^10.1.0 | Native share sheet |
| `google_sign_in` | ^7.2.0 | Google OAuth |
| `cached_network_image` | ^3.3.1 | Image caching |

### Bottom Navigation (5 Tabs)
1. **Home** (الرئيسية) — Trip feed
2. **Search / Discover** (استكشاف) — Explore page
3. **AI Chat** — Central floating AI button
4. **Corporate** (الشركات) — Corporate trips browser
5. **Profile / Dashboard** — User profile OR company dashboard (role-based)

### Flutter Pages & Routes

#### 🔑 Auth Flow
| Route | Page | Description |
|-------|------|-------------|
| `/splash` | `SplashPage` | Boot screen; checks Clerk session and bootstraps auth |
| `/login` | `LoginPage` | Sign in with Clerk (email + Google) |
| `/onboarding` | `OnboardingPage` | Role selection for new users |
| `/company-registration` | `CompanyRegistrationPage` | Company application form |

#### 🏠 Main App (Indexed Shell)
| Route | Page | Description |
|-------|------|-------------|
| `/` | `HomePage` | Trips feed + stories strip at top |
| `/search` | `DiscoverPage` | Search trips, users, destinations; map view |
| `/ai-chat` | `AIChatPage` | AI trip planner chat (full-page on mobile) |
| `/corporate` | `CorporateTripsPage` | Browse all active corporate trips |
| `/profile` | `UserProfilePage` or `CompanyDashboardPage` | Profile page (regular users) or company dashboard (company role) |

#### 🗺️ Trip Pages
| Route | Page | Description |
|-------|------|-------------|
| `/trip/:id` | `TripDetailPage` | Full trip detail with map, activities, comments |
| `/trip/:id/edit` | `EditTripPage` | Edit own trip |
| `/trip/:id/comments` | `TripCommentsPage` | Thread of comments |
| `/create-trip` | `CreateTripPage` | Rich trip creation form with map, activities, photos/video |

#### 🏢 Corporate Trip Pages
| Route | Page | Description |
|-------|------|-------------|
| `/corporate-trip/:id` | `CorporateTripDetailsPage` | Corporate trip detail + booking flow |
| `/corporate` | `CorporateTripsPage` | Full list/filter of corporate trips |

#### 💼 Company Pages (Company Role)
| Route | Page | Description |
|-------|------|-------------|
| `/profile` → `CompanyDashboardPage` | `CompanyDashboardPage` | Company dashboard with KPIs, trips, bookings tabs |
| `/company/:id` | `CompanyPage` | Public company profile |
| `/company-messages` | `CompanyMessagesPage` | Customer message inbox |
| `/create-corporate-trip` | `CreateCorporateTripPage` | Create/edit company trip (full form) |
| (within dashboard) | `SeatAllocationPage` | Interactive seat map per trip |
| (within dashboard) | `CompanyCouponsPage` | Coupon management |
| (within dashboard) | `CompanyReportsPage` | Revenue and booking charts |
| (within dashboard) | `CompanySettingsPage` | Company profile settings |
| (within dashboard) | `QRScannerPage` | Scan attendee booking QR codes |

#### 👤 Profile & Social Pages
| Route | Page | Description |
|-------|------|-------------|
| `/user/:id` | `UserProfilePage` | Public user profile: trips, stats, badges, map of visited countries |
| `/friends` | `FriendsListPage` | Followers/following list |
| (within profile) | `ProfileEditSheet` | Edit bio, location, cover image |
| (within profile) | `MemoryCreateDialog` | Create a travel memory slideshow |
| (within profile) | `MemoryViewerPage` | View travel memory clip |
| (within profile) | `StoriesArchivePage` | Archived stories |

#### 💬 Chat & Messaging Pages
| Route | Page | Description |
|-------|------|-------------|
| `/messages` | `MessagesPage` | Unified inbox: direct messages + group chats |
| `/chat/direct/:id` | `DirectChatPage` | 1-to-1 direct message thread |
| `/chat/group/:id` | `GroupChatPage` | Trip group chat with media, reactions, announcements |
| `/chat/company/:id` | `CompanyChatDetailPage` | Company inquiry conversation |

#### 🔔 Notifications & Misc
| Route | Page | Description |
|-------|------|-------------|
| `/notifications` | `NotificationsPage` | Real-time notification feed |
| `/leaderboard` | `LeaderboardPage` | Weekly leaderboard rankings |
| `/support` | `SupportPage` | Help & support |
| `/settings` | `SettingsPage` | App settings: theme, language, account |

#### 💳 Booking & Payment Pages
| Route | Page | Description |
|-------|------|-------------|
| `/verify-booking` | `BookingVerifyPage` | Verify booking by reference |
| `/verify-booking/:reference` | `BookingVerifyPage` | Deep-link verification |
| `/booking-payment-result` | `BookingPaymentResultPage` | Post-Paymob payment outcome |

#### 📖 Story Pages
| Path | Page | Description |
|------|------|-------------|
| (via navigation) | `StoryViewerPage` | Full-screen story viewer with progress bar |

### Flutter-Specific Features
- **RTL (Right-to-Left)** layout — Arabic-first design with `Directionality: rtl`
- **Cairo Google Font** across the entire app for Arabic typography
- **Dark / Light Theme** toggle with `themeProvider` (Riverpod)
- **Device Preview** in debug builds for multi-device UI testing
- **Payment Resume Listener** — handles returning from Paymob payment in-app browser
- **Trip Publish Banner** — toast banner shown after trip creation
- **Auth Token Sync** — automatically syncs Clerk JWT to the `ApiService` on session changes
- **Push Notifications** via Pusher Channels for real-time chat and booking alerts
- **QR Code Scanner** (`mobile_scanner`) for verifying bookings at check-in
- **QR Code Generation** (`qr_flutter`) for booking confirmation cards

---

## ⚙️ Backend API

Built with **Node.js + Express + TypeScript**, deployed as **Vercel Serverless Functions**.

### API Routes

| Router File | Base Path | Description |
|-------------|-----------|-------------|
| `trips.ts` | `/api/trips` | CRUD for social trips, likes, saves, comments (nested replies), tags, feed, trending |
| `users.ts` | `/api/users` | User profiles, follow/unfollow, activity scores, badge updates, search |
| `stories.ts` | `/api/stories` | Create/delete stories, view tracking, active story feed |
| `memories.ts` | `/api/memories` | Travel memory (slideshow) creation and retrieval |
| `profiles.ts` | `/api/profiles` | Extended profile data (cover image, bio, location) |
| `corporateTrips.ts` | `/api/corporate-trips` | Company trip CRUD, views, search, seat bookings |
| `corporateCompanies.ts` | `/api/corporate-companies` | Company creation, listing, settings update |
| `bookings.ts` | `/api/bookings` | Booking creation, status management, passenger data, QR verification |
| `coupons.ts` | `/api/coupons` | Coupon CRUD, validation, usage tracking |
| `chat.ts` | `/api/chat` | Company ↔ user inquiry chats; unread counts |
| `directChat.ts` | `/api/direct-chat` | User-to-user direct messages |
| `tripGroupChat.ts` | `/api/trip-group-chat` | Trip group creation, messages, reactions, announcements, lock |
| `notifications.ts` | `/api/notifications` | Fetch and mark notifications as read |
| `leaderboard.ts` | `/api/leaderboard` | Weekly leaderboard data |
| `analytics.ts` | `/api/analytics` | Admin analytics: revenue, users, bookings, charts |
| `search.ts` | `/api/search` | Full-text search across trips and users |
| `companySubmissions.ts` | `/api/company-submissions` | Company application submit, review, approve/reject |
| `complaints.ts` | `/api/complaints` | User complaint submission and admin management |
| `contentReports.ts` | `/api/content-reports` | Report flagged trips/comments; admin moderation actions |
| `adminUsers.ts` | `/api/admin/users` | Admin user management |
| `adminComments.ts` | `/api/admin/comments` | Admin comment removal |
| `paymob.ts` | `/api/paymob` | Paymob payment intent creation and webhook verification |
| `webhooks.ts` | `/api/webhooks` | Clerk webhook handler (user create/update/delete sync) |

### Key Backend Features
- **Clerk Webhook** (`svix` verification): Syncs Clerk user events to MongoDB automatically
- **Real-time Events**: Pusher triggers on new messages, booking updates, and notifications
- **Cloudinary** integration for image/video upload from both web and mobile
- **Multer** for multipart file handling
- **Groq SDK** on backend for server-side AI completions
- **Paymob** payment gateway: create order → redirect to payment → receive webhook callback
- **5% Platform Commission** automatically calculated on every booking

---

## 🗄️ Database Models

MongoDB (Mongoose) with **23 collections**:

### Core Social Models

#### `User`
| Field | Type | Description |
|-------|------|-------------|
| `clerkId` | String (unique, indexed) | Clerk authentication ID |
| `email` | String | User email |
| `username` | String | Display username |
| `fullName` | String | Full name |
| `imageUrl` | String | Profile picture URL (Cloudinary) |
| `bio` | String | User biography |
| `location` | String | City, country |
| `coverImage` | String | Profile cover/banner image URL |
| `trips` | ObjectId[] → Trip | References to user's trips |
| `followers` | Number | Follower count |
| `following` | Number | Following count |
| `totalLikes` | Number | Cumulative likes received |
| `activityScore` | Number | Gamification score |
| `badgeLevel` | Enum | `none / bronze / silver / gold / diamond / legend` |
| `role` | Enum | `user / admin / company_pending / company_approved / company_rejected / company_owner` |
| `profileType` | Enum | `user / company` |
| `isOnboarded` | Boolean | Whether onboarding is complete |
| `companyId` | ObjectId → CorporateCompany | Linked company (if company owner) |
| `walletBalance` | Number | Platform wallet balance |
| `subscription` | Object | Plan (`free_trial / basic / premium / enterprise`), status, dates |

#### `Trip`
| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Trip title |
| `destination` | String | Main destination |
| `city` | String | City |
| `duration` | String | e.g. "5 days" |
| `rating` | Number | Rating (default 4.5) |
| `image` | String | Cover image URL |
| `author` | String | Author display name |
| `likes` / `weeklyLikes` | Number | Total and weekly like counts |
| `saves` / `shares` | Number | Save and share counts |
| `description` | String | Trip description |
| `budget` | String | Budget estimate |
| `season` | Enum | `winter / summer / fall / spring` |
| `activities` | ActivitySchema[] | Name, images, videos, coordinates, day, time, note, colour |
| `days` | DaySchema[] | Title, date, activity indices, colour, hotel |
| `foodAndRestaurants` | FoodSchema[] | Name, image, rating, description |
| `hotels` | HotelSchema[] | Name, image, rating, description, price range, address, amenities, coordinates |
| `taggedUsers` | Array | userId, fullName, imageUrl of tagged travellers |
| `comments` | CommentSchema[] | Nested comments with recursive replies, likes |
| `ownerId` | String (indexed) | Clerk user ID of creator |
| `isAIGenerated` | Boolean | Whether created via TripAI |
| `postType` | Enum | `detailed / quick / ask` |
| `startCity` | String | Departure city |
| `transportationPrice` / `totalEstimatedPrice` | Number | Cost estimates |
| `transportOptions` | Mixed | Transport type options |

#### `Follow`
Tracks follow relationships: `followerId` → `followingId` (both Clerk IDs).

#### `TripLove` / `TripSave`
Tracks which users liked/saved which trips: `userId` + `tripId`.

#### `Story`
| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | Clerk ID of story creator |
| `mediaUrl` | String | Cloudinary URL |
| `mediaType` | Enum | `image / video` |
| `caption` | String (max 500) | Optional caption |
| `viewedBy` | String[] | Clerk IDs of viewers |
| `isActive` | Boolean | Active flag |
| `expiresAt` | Date | TTL index — auto-deleted after expiry |

#### `Memory`
Travel memory slideshow record linked to a trip: `userId`, `tripId`, `mediaUrls[]`, `title`, `music`.

#### `Notification`
| Field | Type | Description |
|-------|------|-------------|
| `recipientId` | String (indexed) | Target user's Clerk ID |
| `actorId` | String | Action performer's Clerk ID |
| `type` | Enum | `love / save / comment / follow / system / tag / message` |
| `message` | String | Notification text |
| `tripId` | ObjectId → Trip | Related trip (if applicable) |
| `isRead` | Boolean | Read status |

#### `Leaderboard`
Weekly snapshot: `weekNumber`, `year`, `startDate`, `endDate`, `winners[]` (rank, score, trip, user data).

---

### Company & Booking Models

#### `CorporateCompany`
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Company name |
| `logo` | String | Logo URL |
| `rating` | Number | Company rating |
| `description` | String | About the company |
| `contactInfo` | Object | phone, whatsapp, email, website, address |
| `tags` | String[] | Service tags (e.g. safari, adventure, camping) |
| `color` | String | Brand gradient class |
| `tripsCount` | Number | Auto-calculated active trips count |
| `ownerId` | String | Clerk ID of company owner |
| `isActive` | Boolean | Active/suspended status |

#### `CorporateTrip`
| Field | Type | Description |
|-------|------|-------------|
| `slug` | String (unique, indexed) | URL-safe identifier |
| `title` | String | Trip name |
| `destination` | String | Destination |
| `duration` | String | Duration label |
| `price` | String | Price string |
| `images` | String[] | Trip image gallery URLs |
| `shortDescription` / `fullDescription` | String | Trip descriptions |
| `itinerary` | ItineraryDay[] | day, title, description, activities[] |
| `includedServices` / `excludedServices` | String[] | What's included/excluded |
| `meetingLocation` | String | Departure meeting point |
| `bookingMethod` | Object | whatsapp, phone, website flags |
| `transportations` | TransportUnit[] | type, capacity, count |
| `seatBookings` | SeatBooking[] | busIndex, seatNumber, passengerName, bookingId, userId |
| `stayDetails` | StayDetail[] | name, details, images |
| `comments` | CommentSchema[] | Nested comments with replies |
| `maxGroupSize` | Number | Maximum participants |
| `difficulty` | Enum | سهل / متوسط / صعب |
| `season` | Enum | winter / summer / fall / spring |
| `availableSeats` | Number | Remaining seats |
| `views` | Number | Page view counter |
| `isActive` | Boolean | Published / hidden |

#### `Booking`
| Field | Type | Description |
|-------|------|-------------|
| `bookingReference` | String (unique) | Human-readable booking code |
| `tripId` | ObjectId → CorporateTrip | The booked trip |
| `companyId` | ObjectId → CorporateCompany | The company |
| `userId` | String | Customer's Clerk ID |
| `userName` / `userPhone` / `userEmail` | String | Customer contact |
| `passengers` | Array | name, age, gender per passenger |
| `totalPrice` | Number | Total amount |
| `commissionAmount` | Number | 5% platform fee |
| `netAmount` | Number | Company's net earnings |
| `status` | Enum | `pending / accepted / rejected / confirmed / cancelled / completed` |
| `paymentStatus` | Enum | `unpaid / pending / partially_paid / paid / refunded` |
| `paymentMethod` | Enum | `cash / card / bank_transfer / other` |
| `selectedSeats` | String[] | Allocated seat numbers |
| `couponId` | ObjectId → Coupon | Applied coupon |
| `discountApplied` | Number | Discount amount |
| `paymobOrderId` / `paymobTransactionId` | String | Payment gateway references |

#### `Coupon`
| Field | Type | Description |
|-------|------|-------------|
| `code` | String | Uppercase coupon code (unique per company) |
| `discountType` | Enum | `percentage / fixed` |
| `discountValue` | Number | Amount or % off |
| `expiryDate` | Date | Expiry date |
| `companyId` | ObjectId → CorporateCompany | Owning company |
| `usageLimit` / `usageCount` | Number | Cap and current usage |
| `applicableTrips` | ObjectId[] → CorporateTrip | Specific trips (empty = all) |

#### `TravelCompanyRequest`
Company application form data: company name, type, license, description, contact info, submitted by userId.

#### `CompanySubmission`
Admin-reviewable company application: status (`pending / approved / rejected`), reviewer notes, timestamps.

---

### Chat & Messaging Models

#### `Chat` (Company ↔ User)
Conversation thread: `companyId`, `userId`, `messages[]` (content, sender, timestamp, mediaUrl, type), `unreadCount`.

#### `DirectChat` (User ↔ User)
Private 1-to-1 thread: `participants[]`, `messages[]` (text, images, voice), `unreadCounts{}` map.

#### `TripChatGroup` (Trip Group)
| Field | Type | Description |
|-------|------|-------------|
| `tripId` | ObjectId → CorporateTrip | Associated trip |
| `companyId` | ObjectId → CorporateCompany | Company as group admin |
| `name` | String | Group name |
| `participants` | String[] | Clerk IDs of members |
| `isLocked` | Boolean | When true, only admin can send messages |
| `pinnedMessageId` | ObjectId → TripChatMessage | Pinned message |
| `unreadCounts` | Map<String, Number> | Per-user unread count |

#### `TripChatMessage`
| Field | Type | Description |
|-------|------|-------------|
| `conversationId` | ObjectId → TripChatGroup | Parent group |
| `senderId` | String | Clerk ID |
| `type` | Enum | `text / image / voice / video / pdf / announcement / system` |
| `mediaUrl` | String | Cloudinary URL for media messages |
| `isAnnouncement` | Boolean | Highlighted announcement flag |
| `reactions` | Array | emoji + userId per reaction |
| `readBy` | String[] | Clerk IDs of readers |

---

### Moderation & Support Models

#### `ContentReport`
User-submitted report on a trip or comment: `reporterId`, `targetType`, `targetId`, `reason`, `status` (`pending / reviewed / actioned`), `adminAction`.

#### `RemovedComment`
Audit record of admin-removed comments: original content preserved for reference.

#### `Complaint`
| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | Submitting user's Clerk ID |
| `name` / `email` | String | Contact details |
| `subject` | String | Complaint subject |
| `message` | String | Full complaint text |
| `status` | Enum | `pending / resolved / dismissed` |
| `adminNotes` | String | Internal admin response |

#### `AIPlanUsage`
Tracks AI plan usage per user: `userId`, `count`, `lastUsedAt` — enables rate limiting and usage analytics.

#### `Profile`
Extended user profile data separate from the core User document: additional fields like social links.

---

## 🧩 Tech Stack

### Frontend (Web)
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3 | UI framework |
| **Vite** | 5.4 | Build tool & dev server |
| **TypeScript** | 5.8 | Type safety |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Framer Motion** | 12 | Animations & transitions |
| **React Router DOM** | 6.30 | Client-side routing |
| **TanStack Query** | 5 | Server state management & caching |
| **Clerk React** | 5.53 | Authentication (sign in, sign up, session) |
| **Radix UI** | Various | Accessible UI primitives |
| **shadcn/ui** | — | Component library built on Radix |
| **Recharts** | 2.15 | Charts (dashboard, admin) |
| **Mapbox GL** | 3.16 | Interactive maps |
| **React Leaflet** / **Leaflet** | 4.2 / 1.9 | Alternative map layer |
| **Leaflet Draw** | 1.0 | Route drawing on maps |
| **Pusher JS** | 8.4 | Real-time WebSocket events |
| **Axios** | 1.13 | HTTP client |
| **React Hook Form** | 7.61 | Form management |
| **Zod** | 3.25 | Schema validation |
| **date-fns** | 3.6 | Date utilities |
| **Emoji Picker React** | 4.18 | Emoji picker in chat |
| **html5-qrcode** | 2.3 | QR code scanning (web) |
| **jsPDF** + **jsPDF AutoTable** | 4.0 / 5.0 | PDF export |
| **html2canvas** | 1.4 | Screenshot to canvas |
| **OpenRouter SDK** | 0.4 | AI completions |
| **Google Generative AI** | 0.24 | Gemini AI models |
| **Groq SDK** | 0.37 | Fast inference |
| **Embla Carousel** | 8.6 | Carousel component |
| **Sonner** | 1.7 | Toast notifications |
| **Vaul** | 0.9 | Drawer component |
| **cmdk** | 1.1 | Command palette |
| **next-themes** | 0.3 | Dark/light theme |
| **React Joyride** | 2.9 | Guided tour / onboarding |
| **Vercel Analytics** | 1.6 | Usage analytics |
| **vite-plugin-pwa** | 1.2 | Progressive Web App support |

### Backend (API)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | — | Runtime |
| **Express** | 4.19 | Web framework |
| **TypeScript** | 5.6 | Type safety |
| **Mongoose** | 8.19 | MongoDB ODM |
| **Clerk SDK Node** / **Clerk Express** | 5.0 / 1.7 | Auth middleware & webhook verification |
| **svix** | 1.90 | Clerk webhook signature verification |
| **Pusher** | 5.1 | Real-time event broadcasting |
| **Cloudinary** | 1.41 | Media upload & storage |
| **Multer** | 2.0 | Multipart file handling |
| **Groq SDK** | 1.1 | Server-side AI completions |
| **Axios** | 1.13 | Internal HTTP calls (e.g. Paymob) |
| **dotenv** | 16.4 | Environment variable loading |
| **cors** | 2.8 | Cross-origin resource sharing |
| **fs-extra** | 11.3 | File system utilities |

### Mobile (Flutter)
See the [Flutter Mobile App](#-flutter-mobile-app) section for full package list.

### Infrastructure & Services
| Service | Purpose |
|---------|---------|
| **MongoDB Atlas** | Cloud-hosted NoSQL database |
| **Clerk** | Authentication, user management, JWT tokens, webhooks |
| **Cloudinary** | Image & video upload, transformation, CDN delivery |
| **Pusher Channels** | WebSocket real-time events (notifications, chat, presence) |
| **Paymob** | Egyptian payment gateway for card payments |
| **Mapbox** | Maps SDK for web and mobile (route display, markers) |
| **Vercel** | Hosting for both React SPA (frontend) and Express API (serverless functions) |
| **Google Maps API** | Geocoding and place data (web) |
| **OpenRouter** | AI model routing (supports GPT-4, Claude, Gemini, Llama) |

---

## 🔐 User Roles & Access Control

| Role | Access |
|------|--------|
| `user` | Social features, trip creation, booking, messaging |
| `company_pending` | Waiting for admin approval |
| `company_approved` / `company_owner` | Company dashboard, trip & booking management |
| `company_rejected` | Limited access; can re-apply |
| `admin` | Full platform access: all dashboards, content moderation, analytics |

Authentication is handled by **Clerk**. JWT tokens are verified on every backend API request via `@clerk/express` middleware. Role data is stored in both Clerk's `publicMetadata` and the MongoDB `User` document.

---

## ⚙️ Environment Variables

### Frontend (`.env` in `/frontend`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=https://your-backend.vercel.app/api
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=eu
VITE_MAPBOX_TOKEN=pk.eyJ1...
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_GOOGLE_AI_KEY=AIza...
VITE_OPENROUTER_API_KEY=sk-or-...
```

### Backend (`.env` in `/backend`)
```env
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=eu
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PAYMOB_API_KEY=...
PAYMOB_INTEGRATION_ID=...
PAYMOB_IFRAME_ID=...
GROQ_API_KEY=gsk_...
```

### Flutter (`.env` in `/flutter`)
```env
CLERK_PUBLISHABLE_KEY=pk_test_...
API_BASE_URL=https://your-backend.vercel.app/api
PUSHER_KEY=...
PUSHER_CLUSTER=eu
MAPBOX_ACCESS_TOKEN=pk.eyJ1...
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ and npm
- Flutter 3.x with Dart SDK ^3.11
- MongoDB (local or Atlas URI)
- Clerk account (publishable key + secret key)
- Pusher account
- Cloudinary account

### Backend
```bash
cd backend
npm install
cp env.txt .env   # Fill in your values
npm run dev       # Starts ts-node-dev on port 5000
```

### Frontend (Web)
```bash
cd frontend
npm install
cp env.example .env   # Fill in your VITE_ values
npm run dev           # Starts Vite dev server on port 8080
```

### Flutter (Mobile)
```bash
cd flutter
flutter pub get
# Create .env file with required keys
flutter run           # Run on connected device or emulator
```

---

## 🌐 Deploying the Backend to Vercel

1. **App entry point**: `backend/api/index.js` exports the Express app from `dist/`.
2. **Project config**: Set **Root Directory** to `backend` in Vercel project settings.
3. **Build command**: `npm run build` (compiles TypeScript → `dist/`).
4. **Routing**: `backend/vercel.json` routes all requests to `api/index.js`.
5. **Environment Variables**: Add all backend `.env` keys in the Vercel dashboard.

### Pusher Channel Naming Convention
| Channel | Purpose |
|---------|---------|
| `user-{clerkId}` | Personal notifications per user |
| `trip-group-{groupId}` | Trip group chat messages |
| `company-{companyId}` | Company-level alerts |
| `direct-chat-{chatId}` | Direct message updates |

---

## 🧠 Why Re7lty is Unique

Re7lty isn't just a booking app or a travel blog — it's a complete travel ecosystem:

- 🗺️ **Social + SaaS + AI** in one coherent platform
- 📱 **Web + Mobile** with feature parity (React PWA + Flutter)
- 🤖 **AI that creates real content** — not just suggestions, but actual trip posts
- 💼 **Full B2B toolkit** — companies get everything they need to run trips commercially
- 🔴 **Real-time everywhere** — chat, notifications, presence via Pusher
- 🏆 **Gamified exploration** — badges, leaderboards and explorer levels motivate sharing
- 🗄️ **23 MongoDB collections** carefully modelled for performance with compound indexes
- 💳 **Payment-ready** — Paymob integration for the Egyptian market

---

## 📍 Supported Destinations (v1)

Marsa Matrouh · Alexandria · North Coast · Luxor · Aswan · Hurghada · Sharm El-Sheikh

---

*Built as a Graduation Project — Faculty of Computer Science & Artificial Intelligence*

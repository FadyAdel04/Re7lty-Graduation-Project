# Figure 9: User Navigation & Sitemap Flowchart

This document details the comprehensive user journey and navigation flow for the **Re7lty** platform. It maps out the relationships between different screens and the logical paths users take based on their roles, including fine-grained feature access.

## User Navigation & Sitemap Flowchart

```mermaid
graph TD
    %% Global Styling
    classDef start fill:#f9f9fb,stroke:#4f46e5,stroke-width:4px,stroke-dasharray: 5 5;
    classDef landing fill:#e0e7ff,stroke:#4338ca,stroke-width:2px;
    classDef discovery fill:#dcfce7,stroke:#15803d,stroke-width:2px;
    classDef auth fill:#fef9c3,stroke:#a16207,stroke-width:2px;
    classDef booking fill:#fee2e2,stroke:#b91c1c,stroke-width:2px;
    classDef social fill:#f3e8ff,stroke:#7e22ce,stroke-width:2px;
    classDef admin fill:#1f2937,stroke:#111827,stroke-width:2px,color:#fff;
    classDef company fill:#ffedd5,stroke:#c2410c,stroke-width:2px;

    %% Nodes
    Start((START)):::start --> Landing{{"Landing Page / Hero"}}:::landing

    %% Public Discovery
    Landing --> Search["Search & Advanced Filters"]:::discovery
    Landing --> Heatmap["Interactive Mapbox Heatmap"]:::discovery
    Landing --> PubTimeline["Public Memories Feed"]:::discovery
    Landing --> Leaderboard["Global Leaderboard"]:::social
    Landing --> SupportS["Help & Support Center"]:::landing

    %% Auth Flow
    Landing --> Auth{{"Clerk Authentication"}}:::auth
    Auth -->|Login| Home["User Dashboard"]:::social
    Auth -->|Sign Up| Onboarding["Identity Onboarding"]:::auth
    Onboarding --> RoleSelect{"Role Selection"}:::auth
    
    RoleSelect -->|Traveler| Home
    RoleSelect -->|Company| Registration["Agency Registration"]:::company

    %% Detailed User Dashboard
    Home --> Profile["User Social Profile"]:::social
    Home --> Network["My Connections"]:::social
    Home --> Messages["Direct Messaging"]:::social
    Home --> MyTrips["My Booked Trips"]:::booking
    Home --> TripAI["AI Planning Assistant"]:::discovery

    %% Booking Logic (Small Details)
    Search --> TripList["Trip Listings Feed"]:::discovery
    Heatmap --> TripDetail["Trip Details Page"]:::discovery
    TripList --> TripDetail
    PubTimeline --> TripDetail

    TripDetail --> SeatMap["Interactive Bus Seat Map"]:::booking
    SeatMap --> Verify["Booking Verification"]:::booking
    Verify --> Checkout["PayMob Secure Payment"]:::booking
    Checkout -->|Success| Ticket["Digital Ticket & QR Code"]:::booking

    %% Post-Booking Engagement
    Ticket --> GroupChat["Trip Group Chat (Pusher)"]:::social
    GroupChat --> Experience["Live Trip Mode"]:::social
    Experience --> Share["Post Memories/Stories"]:::social
    Share --> PubTimeline

    %% Company Management (Small Details)
    Registration --> AdminReview["Admin Approval Process"]:::admin
    AdminReview -->|Approved| CompDash["Company Dashboard"]:::company
    CompDash --> Fleet["Fleet & Bus Config"]:::company
    CompDash --> ManageTrips["Trip Creation & Management"]:::company
    CompDash --> Revenue["Financial Analytics"]:::company
    CompDash --> Applicants["View Booking Requests"]:::company

    %% Admin Command Center (Small Details)
    Auth -->|Admin Login| AdminDash["Global Command Center"]:::admin
    AdminDash --> UserManage["User Moderation"]:::admin
    AdminDash --> CompManage["Agency Verification"]:::admin
    AdminDash --> TripManage["Content Moderation"]:::admin
    AdminDash --> Complaints["Support Ticket Resolution"]:::admin
    AdminDash --> GlobalStats["Platform Growth Stats"]:::admin

    %% Inter-connections
    MyTrips --> TripDetail
    Ticket --> MyTrips
    TripAI --> Search
    
    %% Legend
    class Start start;
    class Landing landing;
```

## Key Navigation Nodes

| Node | Description | Access |
| :--- | :--- | :--- |
| **Landing Page** | The initial entry point showing featured trips and value propositions. | Public |
| **Heatmap** | Mapbox-powered visual discovery tool for regional trip density. | Public |
| **Seat Map** | Custom SVG interface for real-time bus seat selection and locking. | Authenticated |
| **AI Assistant** | Gemini-powered natural language trip recommendation engine. | Authenticated |
| **Memories Feed** | Social timeline for sharing trip stories and media via Cloudinary. | Public/Auth |
| **Company CRM** | Specialized dashboard for agencies to manage logistics and revenue. | Company |
| **Admin Center** | Central command for platform-wide moderation and dispute resolution. | Admin |

## Detailed Journey Paths

1.  **The Traveler Journey**: Landing → Heatmap → Trip Detail → AI Consultation → Seat Map → PayMob Checkout → QR Ticket → Group Chat → Story Sharing.
2.  **The Agency Journey**: Sign Up → Document Submission → Admin Review → Dashboard Access → Fleet Setup → Trip Publishing → Revenue Analytics.
3.  **The Moderator Journey**: Admin Login → Overview Dashboard → Pending Verifications → Content Moderation → Support Ticket Closing.

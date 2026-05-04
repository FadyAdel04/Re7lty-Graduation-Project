# 🌍 Re7lty (رحلتي)
### The Ultimate Smart Tourism Platform & Travel Social Network
> **A premium graduation project integrating Flutter and AI to revolutionize the travel experience.**

---

## 📖 Project Overview
**Re7lty** is not just a travel app; it's a comprehensive ecosystem designed to streamline a traveler's journey from inspiration to memory sharing. The platform embodies the "Smart Tourism" concept by seamlessly integrating AI-driven itinerary planning with an immersive social interface.

---

## 🛠 Key Modules

### 1. TripAI Assistant (AI-Powered Planning)
*   **Engine:** Powered by **Llama 3** for advanced Natural Language Processing.
*   **Functionality:** Acts as a personal travel consultant that analyzes user requests, extracts key data (Destination, Duration, Budget), and generates detailed day-by-day itineraries.
*   **Integration:** The assistant cross-references the platform's database to suggest real corporate trips that align with the user's generated plan.

### 2. Social Hub (Community Interaction)
*   **Timeline:** A premium feed to discover trips from fellow travelers with interactive features (Like, Comment, Save).
*   **Stories:** Share ephemeral daily moments that disappear after 24 hours.
*   **Monthly Memories:** An automated "Reels-style" highlight of the user's best photos from the month, showcased prominently on their profile.

### 3. Corporate Hub (Official Travel Services)
*   **Verified Agencies:** A portal for tourism companies with a rigorous identity verification system (Verified Badges).
*   **Interactive Booking:** Advanced seat mapping for buses/planes with a visual interface for user selection.
*   **Payment & Invoicing:** Integrated digital payment workflows and structured booking management.

### 4. Gamification System (Explorer Progression)
*   **Activity Score:** A dynamic scoring system based on user engagement (posting trips, reviews, and bookings).
*   **Explorer Levels:** 
    *   🥉 **Bronze Explorer** (The Journey Begins)
    *   🥈 **Silver Explorer** (Active Traveler)
    *   🥇 **Gold Explorer** (Travel Expert)
    *   💎 **Diamond Explorer** (Professional Nomad)
    *   👑 **Travel Legend** (Top Platform Contributor)

---

## 🎨 UI/UX Philosophy
*   **Premium Design:** Modern aesthetics utilizing Glassmorphism, smooth gradients, and a sleek layout.
*   **Responsive Layout:** Intelligent adaptation for various screen sizes (Phones, Tablets).
*   **Micro-animations:** Fluid transitions powered by `flutter_animate` to deliver a high-end feel.
*   **Adaptive Theme:** Seamless support for both Dark and Light modes.

---

## 🚀 Technical Architecture

### Frontend (Mobile & Web)
*   **Framework:** Flutter (3.11+)
*   **State Management:** Riverpod (Ensuring scalable and testable state).
*   **Routing:** GoRouter (Handling complex navigation and deep linking).
*   **Performance:** Advanced caching with `CachedNetworkImage` for data efficiency.

### Backend (Infrastructure)
*   **Environment:** Node.js & Express.
*   **Database:** MongoDB Atlas (NoSQL for flexible travel data).
*   **Authentication:** Clerk (Multi-factor auth and session management).
*   **Real-time Services:** Pusher (Powering instant notifications and messaging).

---

## 📋 Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/FadyAdel04/Re7lty-Graduation-Project.git
    ```
2.  **Backend Configuration:**
    *   Navigate to the `backend` directory.
    *   Install dependencies: `npm install`.
    *   Configure `.env` (MONGODB_URI, CLERK_SECRET_KEY, etc.).
    *   Start server: `npm run dev`.
3.  **Flutter Configuration:**
    *   Navigate to the `flutter` directory.
    *   Install dependencies: `flutter pub get`.
    *   Configure environment variables in `.env`.
    *   Run app: `flutter run`.

---

## 🛤 Future Roadmap
*   [ ] **Real-time GPS Tracking:** Live location sharing during group trips.
*   [ ] **AR Landmark Discovery:** Augmented Reality overlays for historical sites.
*   [ ] **Multi-language Expansion:** Adding support for French, German, and Spanish.
*   [ ] **Price Prediction Engine:** AI models to predict future travel costs.

---

## 👥 Development Team
*   **Frontend Developer:** [Fady Adel , Fares Mahmoud , Ahmed Massoud]
*   **Backend Developer:** [Fady Adel , Youssef Mohammed , Mrwan Ragab]
*   **Flutter Developer:** [Youssef Mohammed , Mossad Ahmed]
*   **Supervisor:** [Dr / Marwa]

---
> This project represents a fusion of research and technical excellence, aiming to redefine the future of digital tourism.

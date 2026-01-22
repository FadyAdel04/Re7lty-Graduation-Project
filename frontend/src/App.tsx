import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TripDetail from "./pages/TripDetail";
import CreateTrip from "./pages/CreateTrip";
import EditTrip from "./pages/EditTrip";
import Templates from "./pages/Templates";
import Auth from "./pages/Auth";
import SignUpPage from "./pages/SignUp";
import UserProfile from "./pages/UserProfile";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import Timeline from "./pages/Timeline";
import Support from "./pages/Support";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import TripAIChat from "./pages/TripAIChat";
import DiscoverPage from "./pages/DiscoverPage";
import TripAIChatWidget from "@/components/TripAIChatWidget";
import ScrollToTop from "@/components/ScrollToTop";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { UploadProgressProvider } from "@/contexts/UploadProgressContext";
import { UploadProgressBar } from "@/components/UploadProgressBar";
import UserConnectionsPage from "./pages/UserConnectionsPage";
import TripDetailsPage from "./pages/TripDetailsPage";
import AdminDashboard from "./pages/AdminDashboard";
import SubmissionsPage from "./pages/admin/SubmissionsPage";
import CompaniesManagementPage from "./pages/admin/CompaniesManagementPage";
import TripsManagementPage from "./pages/admin/TripsManagementPage";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

const App = () => (
  <UploadProgressProvider>
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/sign-in" element={<Auth />} />
          <Route path="/auth/sign-up" element={<SignUpPage />} />
          {/* Support pages */}
          <Route path="/support" element={<Support />} />
          <Route path="/help" element={<Help />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          {/* Trip AI Assistant */}
          <Route path="/trip-assistant" element={<TripAIChat />} />

          {/* User profile routes - all profiles use /user/:id format */}
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/user/:id/network" element={<UserConnectionsPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/trips/new"
            element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/edit/:id"
            element={
              <ProtectedRoute>
                <EditTrip />
              </ProtectedRoute>
            }
          />
          
          {/* Corporate trip details route - separate from user trips */}
          <Route path="/corporate-trips/:tripSlug" element={<TripDetailsPage />} />
          
          {/* Admin routes - protected by email check */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/submissions" element={<SubmissionsPage />} />
          <Route path="/admin/companies" element={<CompaniesManagementPage />} />
          <Route path="/admin/trips" element={<TripsManagementPage />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          
          {/* Trip detail route - must come after /trips/edit/:id to avoid conflicts */}
          <Route path="/trips/:id" element={<TripDetail />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* Global AI Chat Widget */}
        <TripAIChatWidget />
        {/* Global Upload Progress Bar */}
        <UploadProgressBar />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </UploadProgressProvider>
);

export default App;

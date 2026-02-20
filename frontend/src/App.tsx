import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, lazy, Suspense } from "react";

// Lazy-loaded components
const Index = lazy(() => import("./pages/Index"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const CreateTrip = lazy(() => import("./pages/CreateTrip"));
const EditTrip = lazy(() => import("./pages/EditTrip"));
const Templates = lazy(() => import("./pages/Templates"));
const Auth = lazy(() => import("./pages/Auth"));
const SignUpPage = lazy(() => import("./pages/SignUp"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const DirectMessages = lazy(() => import("./pages/DirectMessages"));
const TripGroupMessages = lazy(() => import("./pages/TripGroupMessages"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Timeline = lazy(() => import("./pages/Timeline"));
const Support = lazy(() => import("./pages/Support"));
const Help = lazy(() => import("./pages/Help"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const TripAIChat = lazy(() => import("./pages/TripAIChat"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const UserConnectionsPage = lazy(() => import("./pages/UserConnectionsPage"));
const TripDetailsPage = lazy(() => import("./pages/TripDetailsPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SubmissionsPage = lazy(() => import("./pages/admin/SubmissionsPage"));
const CompaniesManagementPage = lazy(() => import("./pages/admin/CompaniesManagementPage"));
const TripsManagementPage = lazy(() => import("./pages/admin/TripsManagementPage"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const ComplaintsPage = lazy(() => import("./pages/admin/ComplaintsPage"));
const AdminContentModeration = lazy(() => import("./pages/admin/AdminContentModeration"));
const CompanyDashboard = lazy(() => import("./pages/company/CompanyDashboard"));
const UserRoleSelection = lazy(() => import("./pages/onboarding/UserRoleSelection"));
const CompanyRegistrationPage = lazy(() => import("./pages/onboarding/CompanyRegistrationPage"));
const CompanyDetailsPage = lazy(() => import("./pages/company/CompanyDetailsPage"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));

import TripAIChatWidget from "@/components/TripAIChatWidget";
import ScrollToTop from "@/components/ScrollToTop";
import { Analytics } from "@vercel/analytics/react";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";
import { UploadProgressProvider } from "@/contexts/UploadProgressContext";
import { UploadProgressBar } from "@/components/UploadProgressBar";
import { NotificationProvider } from "./contexts/NotificationContext";
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal";
import { LoadingProvider, useLoading } from "./contexts/LoadingContext";
import PremiumLoader from "./components/PremiumLoader";
import RamadanTheme from "./components/seasonal/RamadanTheme";


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

const AppContent = () => {
  const location = useLocation();
  const { user, isLoaded, isSignedIn } = useUser();
  const { isLoading, startLoading, stopLoading } = useLoading();

  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const isMessagingRoute = (path: string) => path === '/messages' || path === '/trip-groups';
    
    // Don't show loader when navigating BETWEEN /messages and /trip-groups
    const isTransitioningBetweenMessaging = isMessagingRoute(prevPathRef.current) && isMessagingRoute(location.pathname);

    if (!isTransitioningBetweenMessaging) {
      startLoading();
      const timer = setTimeout(() => {
        stopLoading();
      }, 800); // Reduced from 3600 to 800 for better performance metrics
      prevPathRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
    
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  const isAuthRoute = location.pathname.startsWith('/auth');
  const isPublicRoute = ['/', '/support', '/help', '/terms', '/privacy', '/contact'].includes(location.pathname);

  if (isLoaded && isSignedIn && !isAdminRoute && !isOnboardingRoute && !isAuthRoute) {
     const isOnboarded = user.publicMetadata?.isOnboarded;
     
     // Check for old user (Created before Jan 30, 2026)
     const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
     const cutoffDate = new Date('2026-01-30');
     const isOldUser = createdAt < cutoffDate;

     // Only show onboarding for new users who haven't onboarded
     // Also bypass if role is company_pending or company_owner, as they might have bypassed the standard flow
     const currentRole = user.publicMetadata?.role as string;
     const isCompanyUser = currentRole === 'company_pending' || currentRole === 'company_owner' || currentRole === 'company_approved';

     if (!isOnboarded && !isOldUser && !isCompanyUser) {
         return <UserRoleSelection />; 
     }
  }

  // If user is on onboarding page but already onboarded, redirect home
  if (isLoaded && isSignedIn && isOnboardingRoute && user.publicMetadata?.isOnboarded) {
      window.location.href = '/';
      return null;
  }

  if (!isLoaded) {
    return <PremiumLoader />;
  }

  return (
    <>
      <AnimatePresence>
        {isLoading && <PremiumLoader />}
      </AnimatePresence>
      <ScrollToTop />
      <Suspense fallback={<PremiumLoader />}>
        <Routes>
          {/* Onboarding Routes */}
          <Route path="/onboarding/role" element={<ProtectedRoute><UserRoleSelection /></ProtectedRoute>} />
          <Route path="/onboarding/company-apply" element={<ProtectedRoute><CompanyRegistrationPage /></ProtectedRoute>} />

          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/agency" element={<Templates />} />
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
          <Route path="/messages" element={<ProtectedRoute><DirectMessages /></ProtectedRoute>} />
          <Route path="/trip-groups" element={<ProtectedRoute><TripGroupMessages /></ProtectedRoute>} />
          
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
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/moderation" element={<AdminContentModeration />} />
          <Route path="/admin/complaints" element={<ComplaintsPage />} />
          
          {/* Company Public Details Page */}
          <Route path="/companies/:id" element={<CompanyDetailsPage />} />
          
          {/* Company Dashboard Route */}
          <Route path="/company/dashboard" element={<ProtectedRoute><CompanyDashboard /></ProtectedRoute>} />
          
          {/* Trip detail route - must come after /trips/edit/:id to avoid conflicts */}
          <Route path="/trips/:id" element={<TripDetail />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {/* Global AI Chat Widget - Hide on admin, onboarding, AI page; hide on mobile for messages/trip-groups (overlaps chat) */}
      {!isAdminRoute && !isOnboardingRoute && location.pathname !== '/trip-assistant' && (
        <div className={(location.pathname === '/messages' || location.pathname.startsWith('/trip-groups')) ? 'hidden lg:block' : ''}>
          <TripAIChatWidget />
        </div>
      )}
      {/* Tour Guide for new users */}
      {!isAdminRoute && !isOnboardingRoute}
      {/* Global Upload Progress Bar */}
      <UploadProgressBar />
    </>
  );
};

const App = () => (
  <LoadingProvider>
    <UploadProgressProvider>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Analytics />
        <BrowserRouter>
          <NotificationProvider>
            <RamadanTheme>
              <AppContent />
            </RamadanTheme>
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </UploadProgressProvider>
  </LoadingProvider>
);

export default App;

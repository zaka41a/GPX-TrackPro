import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UserDashboard from "./pages/UserDashboard";
import UploadPage from "./pages/UploadPage";
import ActivitiesArchivePage from "./pages/ActivitiesArchivePage";
import ActivityStatsPage from "./pages/ActivityStatsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminCommunityModPage from "./pages/AdminCommunityModPage";
import AdminSubscriptionsPage from "./pages/AdminSubscriptionsPage";
import ProfilePage from "./pages/ProfilePage";
import StatisticsPage from "./pages/StatisticsPage";
import CommunityFeedPage from "./pages/CommunityFeedPage";
import CommunityPostPage from "./pages/CommunityPostPage";
import MessagingPage from "./pages/MessagingPage";
import SettingsPage from "./pages/SettingsPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path="/" element={<PublicOnlyRoute><HomePage /></PublicOnlyRoute>} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
                <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
                <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
                <Route path="/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
                <Route path="/verify-email" element={<PublicOnlyRoute><EmailVerificationPage /></PublicOnlyRoute>} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />

                {/* User */}
                <Route path="/dashboard" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute requiredRole="user"><UploadPage /></ProtectedRoute>} />
                <Route path="/activities" element={<ProtectedRoute requiredRole="user"><ActivitiesArchivePage /></ProtectedRoute>} />
                <Route path="/activity/:id" element={<ProtectedRoute requiredRole="user"><ActivityStatsPage /></ProtectedRoute>} />
                <Route path="/statistics" element={<ProtectedRoute requiredRole="user"><StatisticsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute requiredRole="user"><ProfilePage /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><CommunityFeedPage /></ProtectedRoute>} />
                <Route path="/community/:id" element={<ProtectedRoute><CommunityPostPage /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute requiredRole="user"><SettingsPage /></ProtectedRoute>} />
                <Route path="/u/:userId" element={<ProtectedRoute requiredRole="user"><PublicProfilePage /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsersPage /></ProtectedRoute>} />
                <Route path="/admin/community-mod" element={<ProtectedRoute requiredRole="admin"><AdminCommunityModPage /></ProtectedRoute>} />
                <Route path="/admin/subscriptions" element={<ProtectedRoute requiredRole="admin"><AdminSubscriptionsPage /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
</ThemeProvider>
);

export default App;

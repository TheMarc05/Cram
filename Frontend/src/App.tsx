import { Login } from "./pages/Login";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Register } from "./pages/Register";
import { EmailVerification } from "./pages/EmailVerification";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Profile } from "./pages/Profile";
import { EditProfile } from "./pages/EditProfile";
import { EmailChangeVerification } from "./pages/EmailChangeVerification";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Home } from "./pages/Home";
import { Projects } from "./pages/Projects";
import { AnalyzeCode } from "./pages/AnalyzeCode";
import { ReviewDetail } from "./pages/ReviewDetail";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";

function App() {
  const { isAuthenticated, isInitializing, loadUser, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !user) {
      loadUser(); // verify localStorage for token
    }
  }, [loadUser, isAuthenticated, user]);

  if (isInitializing) {
    return (
      <LoadingSpinner fullScreen text="Loading your session..." size="lg" />
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify/:token" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/verify-email-change"
              element={<EmailChangeVerification />}
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analyze/:projectId"
              element={
                <ProtectedRoute>
                  <AnalyzeCode />
                </ProtectedRoute>
              }
            />

            <Route
              path="/review/:reviewId"
              element={
                <ProtectedRoute>
                  <ReviewDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;

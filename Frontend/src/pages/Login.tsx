//import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm.tsx";
//import { apiService } from "../services/api";
import { useAuthStore } from "../store/authStore.ts";
import { useEffect } from "react";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const Login: React.FC = () => {
  const {
    login,
    isLoggingIn,
    error,
    isAuthenticated,
    isGoogleAuth,
    googleAuth,
  } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleAuthSuccess = async (response: any) => {
    try {
      console.log("Google Auth response:", response);
      await googleAuth(response.credential);
    } catch (error) {
      console.error("Google Auth failed:", error);
    }
  };

  const handleGoogleAuthFailure = async () => {
    console.error("Google Auth failed:", error);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleLogin = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, data.rememberMe);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <LoginForm
          onSubmit={handleLogin}
          onGoogleAuth={handleGoogleAuthSuccess}
          onGoogleAuthError={handleGoogleAuthFailure}
          isLoading={isLoggingIn}
          isGoogleLoading={isGoogleAuth}
          error={error || undefined}
        />
      </div>
    </div>
  );
};

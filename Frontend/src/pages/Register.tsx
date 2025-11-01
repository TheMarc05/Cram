import { useEffect } from "react";
import { RegisterForm } from "../components/auth/RegisterForm";
import { useAuthStore } from "../store/authStore";
import { useLocation, useNavigate } from "react-router-dom";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export const Register: React.FC = () => {
  const {
    register,
    isRegistering,
    error,
    isAuthenticated,
    isGoogleAuth,
    googleAuth,
  } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleGoogleAuthSuccess = async (response: any) => {
    try {
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

  const handleRegister = async (data: RegisterFormData) => {
    try {
      await register(data.email, data.password, data.firstName, data.lastName);
      //here we redirect to other page
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <RegisterForm
          onSubmit={handleRegister}
          onGoogleAuth={handleGoogleAuthSuccess}
          onGoogleAuthError={handleGoogleAuthFailure}
          isLoading={isRegistering}
          isGoogleLoading={isGoogleAuth}
          error={error || undefined}
        />
      </div>
    </div>
  );
};

import { useState } from "react";
import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";
import { useAuthStore } from "../store/authStore";

export const ForgotPassword = () => {
  const { clearError, requestPasswordReset, isRequestingPasswordReset, error } =
    useAuthStore();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: { email: string }) => {
    clearError();

    try {
      await requestPasswordReset(data.email);
      setSuccess(true);
    } catch (error) {
      console.error("Password reset request failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h1>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <ForgotPasswordForm
          onSubmit={handleSubmit}
          isLoading={isRequestingPasswordReset}
          error={error || ""}
          success={success}
        />
      </div>
    </div>
  );
};

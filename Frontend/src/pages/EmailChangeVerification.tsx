import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "../services/api";
import { useAuthStore } from "../store/authStore";

export const EmailChangeVerification: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const { setUser } = useAuthStore();

  useEffect(() => {
    const verifyEmailChange = async () => {
      if (isVerifying) {
        return;
      }

      setIsVerifying(true);

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const response = await apiService.verifyEmailChange(token);
        setStatus("success");
        setMessage("Email address verified successfully");

        if (response.user) {
          setUser(response.user);
        }

        timeoutRef.current = setTimeout(() => {
          navigate("/profile");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Failed to verify email"
        );
      }
    };

    verifyEmailChange();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [token, isVerifying]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email Change Verification
            </h2>

            {status === "loading" && (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600">Verifying your email change...</p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">{message}</p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">{message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

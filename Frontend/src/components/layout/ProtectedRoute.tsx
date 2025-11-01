import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.ts";
import { apiService } from "../../services/api.ts";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, loadUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    //try to load user if not have token but have data
    if (!isAuthenticated && !user) {
      const token = apiService.getAccessToken();
      if (token) {
        loadUser();
      }
    }
  }, [isAuthenticated, user, loadUser]);

  //if user is not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to={"/"} state={{ from: location }} replace />;
  }

  //if user is authenticated, show the protected route
  return <>{children}</>;
};

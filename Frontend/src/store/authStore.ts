import { create } from "zustand";
import { apiService } from "../services/api.ts";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  googleId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  isLoading: boolean;

  isInitializing: boolean; //app startup
  isLoggingIn: boolean; //login form
  isLoggingOut: boolean; //logout action
  isRegistering: boolean; //register form
  isRequestingPasswordReset: boolean; //request password reset form
  isResettingPassword: boolean; //reset password form
  isGoogleAuth: boolean; //google auth form
  isChangingPassword: boolean; //change password form
  isUploadingAvatar: boolean; //upload avatar form
  isUpdatingProfile: boolean; //update profile form
  isDeletingAccount: boolean; //delete account action

  error: string | null;
}

interface AuthActions {
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  googleAuth: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (
    firstName: string,
    lastName: string,
    email: string
  ) => Promise<{ user: User; emailChangePending?: boolean }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  uploadAvatar: (avatarUrl: string) => Promise<void>;
  setUser: (user: User) => void;
  getAllUsers: () => Promise<User[]>;
  updateUserRole: (userId: number, role: string) => Promise<User>;
  updateUserStatus: (userId: number, isActive: boolean) => Promise<User>;
  deleteMyAccount: () => Promise<void>;
  deleteUserByAdmin: (userId: number) => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  isLoggingIn: false,
  isLoggingOut: false,
  isRegistering: false,
  isRequestingPasswordReset: false,
  isResettingPassword: false,
  isGoogleAuth: false,
  isChangingPassword: false,
  isUploadingAvatar: false,
  isUpdatingProfile: false,
  isDeletingAccount: false,
  error: null,

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  login: async (email, password, rememberMe) => {
    set({ isLoading: true, isLoggingIn: true, error: null });

    try {
      const response = await apiService.login({ email, password, rememberMe });

      apiService.setAccessToken(response.accessToken);
      apiService.setRefreshToken(response.refreshToken);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isLoggingIn: false,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isLoggingIn: false,
        error: error instanceof Error ? error.message : "Login failed",
      });
      throw error;
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true, isRegistering: true, error: null });

    try {
      const response = await apiService.register({
        email,
        password,
        firstName,
        lastName,
      });

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isRegistering: false,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isRegistering: false,
        error: error instanceof Error ? error.message : "Registration failed",
      });
      throw error;
    }
  },

  googleAuth: async (credential: string) => {
    try {
      set({ isLoading: true, isGoogleAuth: true, error: null });

      const backendResponse = await apiService.googleAuth(credential);

      apiService.setAccessToken(backendResponse.accessToken);
      apiService.setRefreshToken(backendResponse.refreshToken);

      set({
        user: backendResponse.user,
        isAuthenticated: true,
        isLoading: false,
        isGoogleAuth: false,
        error: null,
      });
    } catch (error) {
      console.error("Google Auth failed:", error);
      set({
        isLoading: false,
        isGoogleAuth: false,
        error: error instanceof Error ? error.message : "Google Auth failed",
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, isLoggingOut: true });

    try {
      await apiService.logout();

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      apiService.removeAccessToken();
      apiService.removeRefreshToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isLoggingOut: false,
        error: null,
      });
    }
  },

  loadUser: async () => {
    const token = apiService.getAccessToken();

    if (!token) {
      set({ isLoading: false, isAuthenticated: false, isInitializing: false });
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const user = await apiService.getProfile();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
        error: null,
      });
    } catch (error) {
      apiService.removeAccessToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),

  requestPasswordReset: async (email: string) => {
    set({ isLoading: true, isRequestingPasswordReset: true, error: null });

    try {
      await apiService.requestPasswordReset(email);
      set({ isLoading: false, isRequestingPasswordReset: false });
    } catch (error) {
      set({
        isLoading: false,
        isRequestingPasswordReset: false,
        error:
          error instanceof Error ? error.message : "Failed to send reset email",
      });
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    set({ isLoading: true, isResettingPassword: true, error: null });

    try {
      await apiService.resetPassword(token, newPassword);
      set({ isLoading: false, isResettingPassword: false });
    } catch (error) {
      set({
        isLoading: false,
        isResettingPassword: false,
        error:
          error instanceof Error ? error.message : "Failed to reset password",
      });
      throw error;
    }
  },

  updateProfile: async (firstName: string, lastName: string, email: string) => {
    const currentUser = get().user;

    set({ isLoading: true, isUpdatingProfile: true, error: null });

    try {
      const updatedUser = await apiService.updateProfile({
        firstName,
        lastName,
        email,
      });

      const userData = updatedUser.user || currentUser;

      set({
        user: userData as typeof currentUser,
        isLoading: false,
        isUpdatingProfile: false,
      });

      return updatedUser;
    } catch (error) {
      set({
        isLoading: false,
        isUpdatingProfile: false,
        error:
          error instanceof Error ? error.message : "Failed to update profile",
      });
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, isChangingPassword: true, error: null });

    try {
      const updatedUser = await apiService.changePassword(
        currentPassword,
        newPassword
      );
      set({ user: updatedUser, isLoading: false, isChangingPassword: false });
    } catch (error) {
      set({
        isLoading: false,
        isChangingPassword: false,
        error:
          error instanceof Error ? error.message : "Failed to change password",
      });
      throw error;
    }
  },

  uploadAvatar: async (avatarData: string) => {
    set({ isLoading: true, isUploadingAvatar: true, error: null });

    try {
      const updateUser = await apiService.uploadAvatar(avatarData);
      set({
        user: updateUser,
        isLoading: false,
        isUploadingAvatar: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        isUploadingAvatar: false,
        error:
          error instanceof Error ? error.message : "Failed to upload avatar",
      });
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const users = await apiService.getAllUsers();
      return users;
    } catch (error) {
      console.error("Failed to get all users:", error);
      throw error;
    }
  },

  updateUserRole: async (userId: number, role: string) => {
    try {
      const updatedUser = await apiService.updateUserRole(userId, role);
      return updatedUser;
    } catch (error) {
      console.error("Failed to update user role:", error);
      throw error;
    }
  },

  updateUserStatus: async (userId: number, isActive: boolean) => {
    try {
      const updatedUser = await apiService.updateUserStatus(userId, isActive);
      return updatedUser;
    } catch (error) {
      console.error("Failed to update user status:", error);
      throw error;
    }
  },

  deleteMyAccount: async () => {
    set({ isDeletingAccount: true, error: null });
    try {
      await apiService.deleteMyAccount();

      apiService.removeAccessToken();
      apiService.removeRefreshToken();

      set({
        user: null,
        isAuthenticated: false,
        isDeletingAccount: false,
      });
    } catch (error) {
      set({
        isDeletingAccount: false,
        error:
          error instanceof Error ? error.message : "Failed to delete account",
      });
      throw error;
    }
  },

  deleteUserByAdmin: async (userId: number) => {
    set({ isDeletingAccount: true, error: null });
    try {
      await apiService.deleteUserByAdmin(userId);
      set({ isDeletingAccount: false });
    } catch (error) {
      set({
        isDeletingAccount: false,
        error: error instanceof Error ? error.message : "Failed to delete user",
      });
      throw error;
    }
  },
}));

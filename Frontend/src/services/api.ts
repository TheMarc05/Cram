import axiosInstance from "./axiosInstance";

const API_BASE_URL = "http://localhost:5000/api";

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: {
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
  };
  accessToken: string;
  refreshToken: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await axiosInstance({
        url: endpoint,
        method: (options.method as string) || "GET",
        data: options.body ? JSON.parse(options.body as string) : undefined,
        headers: options.headers as any,
      });

      return response.data;
    } catch (error: any) {
      console.error("API request failed:", error);
      const errorMessage =
        error.response?.data?.error || error.message || "Request failed";
      throw new Error(errorMessage);
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async googleAuth(token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/google-auth", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    return this.request<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.request<{ accessToken: string }>("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/auth/verify/${token}`, {
      method: "GET",
    });
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  //token management
  getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  setAccessToken(token: string): void {
    localStorage.setItem("accessToken", token);
  }

  removeAccessToken(): void {
    localStorage.removeItem("accessToken");
  }

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  setRefreshToken(token: string): void {
    localStorage.setItem("refreshToken", token);
  }

  removeRefreshToken(): void {
    localStorage.removeItem("refreshToken");
  }

  async getProfile(): Promise<AuthResponse["user"]> {
    const response = await this.request<{ user: AuthResponse["user"] }>(
      "/users/profile"
    );
    return response.user;
  }

  async updateProfile(data: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<{ user: AuthResponse["user"]; emailChangePending?: boolean }> {
    return this.request<{
      user: AuthResponse["user"];
      emailChangePending?: boolean;
    }>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse["user"]> {
    return this.request<AuthResponse["user"]>(
      "/users/profile/change-password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );
  }

  async uploadAvatar(avatarData: string): Promise<AuthResponse["user"]> {
    return this.request<AuthResponse["user"]>("/users/profile/upload-avatar", {
      method: "POST",
      body: JSON.stringify({ avatarData }),
    });
  }

  async verifyEmailChange(
    token: string
  ): Promise<{ message: string; user?: any }> {
    return this.request<{ message: string; user?: any }>(
      "/users/profile/verify-email-change",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    );
  }

  async getAllUsers(): Promise<AuthResponse["user"][]> {
    const res = await this.request<{ users: AuthResponse["user"][] }>(
      "/users/admin/users"
    );
    return res.users;
  }

  async updateUserRole(
    userId: number,
    role: string
  ): Promise<AuthResponse["user"]> {
    return this.request<AuthResponse["user"]>(
      `/users/admin/users/${userId}/role`,
      {
        method: "PUT",
        body: JSON.stringify({ role }),
      }
    );
  }

  async updateUserStatus(
    userId: number,
    isActive: boolean
  ): Promise<AuthResponse["user"]> {
    return this.request<AuthResponse["user"]>(
      `/users/admin/users/${userId}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      }
    );
  }

  async deleteMyAccount(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/users/profile", {
      method: "DELETE",
    });
  }

  async deleteUserByAdmin(userId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/admin/users/${userId}`, {
      method: "DELETE",
    });
  }
}

export const apiService = new ApiService();

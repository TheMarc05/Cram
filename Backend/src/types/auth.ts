export interface User{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'ADMIN';
    isActive: boolean;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface LoginRequest{
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterRequest{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface AuthResponse{
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}

export interface ResetPasswordRequest{
    email: string;
}

export interface ChangePasswordRequest{
    currentPassword: string;
    newPassword: string;
}
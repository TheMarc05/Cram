import { Request, Response } from "express";
import { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  isValidEmail,
  isValidPassword,
} from "../utils/auth";
import { prisma } from "../lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/emailService";
import crypto from "crypto";
import { googleAuthService } from "../services/googleAuthService";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName }: RegisterRequest = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await sendWelcomeEmail(user.email, user.firstName);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, user.firstName, verificationToken);

    //Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response: AuthResponse = {
      user,
      accessToken,
      refreshToken,
    };

    res.status(201).json(response);
  } catch (error: unknown) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(400).json({ error: "Email already in use" });
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is not active" });
    }

    const isValidPassword = await comparePassword(password, user.password!);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const refreshTokenExpire = rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpire,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };

    if (rememberMe) {
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Google token is required" });
    }

    //verify google token
    const googleUser = await googleAuthService.verifyToken(token);

    console.log("Google user data:", googleUser);

    //search for user by email in db
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          emailVerified: googleUser.emailVerified,
          googleId: googleUser.googleId,
          avatar: googleUser.picture,
        },
      });

      await sendWelcomeEmail(user.email, user.firstName);
    } else {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.googleId, avatar: googleUser.picture },
        });
      }
    }

    //generate JWT tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(200).json({
      message: "Google authentication successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        googleId: user.googleId,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    res.status(401).json({ error: "Google authentication failed" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    //delete refresh token from db
    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
      },
    });

    //clear cookie
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!existingToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    if (existingToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      return res.status(401).json({ error: "Refresh token expired" });
    }

    if (!existingToken.user.isActive) {
      return res.status(401).json({ error: "User is not active" });
    }

    const newAccessToken = generateAccessToken(existingToken.user.id);

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params as { token: string };

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!verificationToken) {
      return res.status(400).json({ error: "Invalid verification link" });
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { token },
      });

      return res.status(400).json({ error: "Verification token expired" });
    }

    if (verificationToken.user.emailVerified) {
      await prisma.emailVerificationToken.delete({
        where: { token },
      });

      return res.status(400).json({ error: "Email already verified" });
    }

    //mark email as verified
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    //delete verification token
    await prisma.emailVerificationToken.delete({
      where: { token },
    });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
    }

    if (user?.emailVerified) {
      res.status(400).json({ error: "Email is already verified" });
    }

    if (!user?.isActive) {
      res.status(400).json({ error: "User is not active" });
    }

    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user?.id },
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user?.id!,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(
      user?.email ?? "",
      user?.firstName ?? "",
      verificationToken
    );

    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification email error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        error: "If the email exists, a password reset link has been sent",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        error: "If the email exists, a password reset link has been sent",
      });
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const resetToken = crypto.randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), //1h
      },
    });

    await sendPasswordResetEmail(user.email, user.firstName, resetToken);

    res.status(200).json({ message: "Password reset link sent" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body as {
      token: string;
      newPassword: string;
    };

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    //find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return res.status(400).json({ error: "Reset token expired" });
    }

    if (resetToken.used) {
      return res.status(400).json({ error: "Reset token already used" });
    }

    if (!resetToken.user.isActive) {
      return res.status(400).json({ error: "Account is not active" });
    }

    const hashedPassword = await hashPassword(newPassword);

    //update password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    //mark token as used
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });

    //delete all reset tokens for the user (force re-login)
    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

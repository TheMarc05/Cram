import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword, isValidPassword } from "../utils/auth";
import { sendEmailChangeConfirmation } from "../services/emailService";
import crypto from "crypto";

//Obtain the profile of the current user
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId; //coming from the authenticateToken middleware

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error: error");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res
        .status(400)
        .json({ error: "First name and last name are required" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const emailChanged = currentUser.email !== email;

    if (emailChanged) {
      const existingUser = await prisma.user.findFirst({
        where: { email, id: { not: userId } },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailValid.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");

      console.log("Creating token for email change:", {
        userId,
        newEmail: email,
        token: verificationToken,
      });

      await prisma.emailVerificationToken.create({
        data: {
          token: verificationToken,
          userId: userId,
          newEmail: email,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await sendEmailChangeConfirmation(
        currentUser.email,
        email,
        currentUser.firstName,
        verificationToken
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: emailChanged ? false : true,
        googleId: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res
      .status(200)
      .json({ ...updatedUser, emailChangePending: emailChanged });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, googleId: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.password || user.googleId) {
      return res.status(400).json({ error: "User does not have a password" });
    }

    const isCorrectPassword = await comparePassword(
      currentPassword,
      user.password!
    );
    if (!isCorrectPassword) {
      return res.status(400).json({ error: "Invalid current password" });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        googleId: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { avatarData } = req.body;

    if (!avatarData) {
      return res.status(400).json({ error: "Avatar data is required" });
    }

    if (!avatarData.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarData },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        googleId: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmailChange = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    console.log("Verifying token:", token);

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    console.log("Found token:", verificationToken ? "YES" : "NO");
    if (verificationToken) {
      console.log("Token details:", {
        id: verificationToken.id,
        userId: verificationToken.userId,
        newEmail: verificationToken.newEmail,
        expiresAt: verificationToken.expiresAt,
        isExpired: verificationToken.expiresAt < new Date(),
      });
    }

    if (!verificationToken) {
      return res.status(400).json({ error: "Invalid verification link" });
    }

    if (verificationToken.expiresAt < new Date()) {
      console.log("Token expired, deleting...");
      await prisma.emailVerificationToken.delete({
        where: { token },
      });
      return res.status(400).json({ error: "Verification token expired" });
    }

    console.log("Updating user email to:", verificationToken.newEmail);

    const updatedUser = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { email: verificationToken.newEmail!, emailVerified: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        googleId: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log("User updated successfully:", updatedUser.email);

    try {
      await prisma.emailVerificationToken.deleteMany({
        where: { token },
      });
      console.log("Token deleted successfully");
    } catch (error) {
      console.log("Token already deleted, continuing...");
    }

    return res
      .status(200)
      .json({ message: "Email changed successfully", user: updatedUser });
  } catch (error) {
    console.error("Verify email change error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
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

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive },
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

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMyAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    await prisma.passwordResetToken.deleteMany({
      where: { userId },
    });

    await prisma.emailVerificationToken.deleteMany({
      where: { userId: userId },
    });

    await prisma.user.delete({ where: { id: userId } });

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete my account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.refreshToken.deleteMany({ where: { userId: parseInt(id) } });

    await prisma.passwordResetToken.deleteMany({
      where: { userId: parseInt(id) },
    });

    await prisma.emailVerificationToken.deleteMany({
      where: { userId: parseInt(id) },
    });

    await prisma.user.delete({ where: { id: parseInt(id) } });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user by admin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

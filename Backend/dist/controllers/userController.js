"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserByAdmin = exports.deleteMyAccount = exports.updateUserStatus = exports.updateUserRole = exports.getAllUsers = exports.verifyEmailChange = exports.uploadAvatar = exports.changePassword = exports.updateProfile = exports.getProfile = void 0;
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../utils/auth");
const emailService_1 = require("../services/emailService");
const crypto_1 = __importDefault(require("crypto"));
//Obtain the profile of the current user
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId; //coming from the authenticateToken middleware
        const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Get profile error: error");
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { firstName, lastName, email } = req.body;
        if (!firstName || !lastName || !email) {
            return res
                .status(400)
                .json({ error: "First name and last name are required" });
        }
        const currentUser = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, firstName: true, lastName: true },
        });
        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }
        const emailChanged = currentUser.email !== email;
        if (emailChanged) {
            const existingUser = await prisma_1.prisma.user.findFirst({
                where: { email, id: { not: userId } },
            });
            if (existingUser) {
                return res.status(400).json({ error: "Email already in use" });
            }
            const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailValid.test(email)) {
                return res.status(400).json({ error: "Invalid email address" });
            }
            const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
            console.log("Creating token for email change:", {
                userId,
                newEmail: email,
                token: verificationToken,
            });
            await prisma_1.prisma.emailVerificationToken.create({
                data: {
                    token: verificationToken,
                    userId: userId,
                    newEmail: email,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });
            await (0, emailService_1.sendEmailChangeConfirmation)(currentUser.email, email, currentUser.firstName, verificationToken);
        }
        const updatedUser = await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res
                .status(400)
                .json({ error: "Current password and new password are required" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { password: true, googleId: true },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (!user.password || user.googleId) {
            return res.status(400).json({ error: "User does not have a password" });
        }
        const isCorrectPassword = await (0, auth_1.comparePassword)(currentPassword, user.password);
        if (!isCorrectPassword) {
            return res.status(400).json({ error: "Invalid current password" });
        }
        if (!(0, auth_1.isValidPassword)(newPassword)) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
            });
        }
        const hashedPassword = await (0, auth_1.hashPassword)(newPassword);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        const updatedUser = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.changePassword = changePassword;
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { avatarData } = req.body;
        if (!avatarData) {
            return res.status(400).json({ error: "Avatar data is required" });
        }
        if (!avatarData.startsWith("data:image/")) {
            return res.status(400).json({ error: "Invalid image format" });
        }
        const user = await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Upload avatar error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.uploadAvatar = uploadAvatar;
const verifyEmailChange = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }
        console.log("Verifying token:", token);
        const verificationToken = await prisma_1.prisma.emailVerificationToken.findUnique({
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
            await prisma_1.prisma.emailVerificationToken.delete({
                where: { token },
            });
            return res.status(400).json({ error: "Verification token expired" });
        }
        console.log("Updating user email to:", verificationToken.newEmail);
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: verificationToken.userId },
            data: { email: verificationToken.newEmail, emailVerified: true },
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
            await prisma_1.prisma.emailVerificationToken.deleteMany({
                where: { token },
            });
            console.log("Token deleted successfully");
        }
        catch (error) {
            console.log("Token already deleted, continuing...");
        }
        return res
            .status(200)
            .json({ message: "Email changed successfully", user: updatedUser });
    }
    catch (error) {
        console.error("Verify email change error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.verifyEmailChange = verifyEmailChange;
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
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
    }
    catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAllUsers = getAllUsers;
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role || !["USER", "ADMIN"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        const updatedUser = await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Update user role error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateUserRole = updateUserRole;
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const updatedUser = await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Update user status error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateUserStatus = updateUserStatus;
const deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user.userId;
        await prisma_1.prisma.refreshToken.deleteMany({
            where: { userId },
        });
        await prisma_1.prisma.passwordResetToken.deleteMany({
            where: { userId },
        });
        await prisma_1.prisma.emailVerificationToken.deleteMany({
            where: { userId: userId },
        });
        await prisma_1.prisma.user.delete({ where: { id: userId } });
        return res.status(200).json({ message: "Account deleted successfully" });
    }
    catch (error) {
        console.error("Delete my account error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.deleteMyAccount = deleteMyAccount;
const deleteUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.refreshToken.deleteMany({ where: { userId: parseInt(id) } });
        await prisma_1.prisma.passwordResetToken.deleteMany({
            where: { userId: parseInt(id) },
        });
        await prisma_1.prisma.emailVerificationToken.deleteMany({
            where: { userId: parseInt(id) },
        });
        await prisma_1.prisma.user.delete({ where: { id: parseInt(id) } });
        return res.status(200).json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error("Delete user by admin error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.deleteUserByAdmin = deleteUserByAdmin;

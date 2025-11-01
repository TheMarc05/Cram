import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  changePassword,
  deleteMyAccount,
  deleteUserByAdmin,
  getAllUsers,
  getProfile,
  updateProfile,
  updateUserRole,
  updateUserStatus,
  uploadAvatar,
  verifyEmailChange,
} from "../controllers/userController";

const router = Router();

router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);
router.post("/profile/change-password", authenticateToken, changePassword);
router.post("/profile/upload-avatar", authenticateToken, uploadAvatar);
router.post("/profile/verify-email-change", verifyEmailChange);

router.get(
  "/admin/users",
  authenticateToken,
  requireRole(["ADMIN"]),
  getAllUsers
);
router.put(
  "/admin/users/:id/role",
  authenticateToken,
  requireRole(["ADMIN"]),
  updateUserRole
);
router.put(
  "/admin/users/:id/status",
  authenticateToken,
  requireRole(["ADMIN"]),
  updateUserStatus
);

router.delete("/profile", authenticateToken, deleteMyAccount);

router.delete(
  "/admin/users/:id",
  authenticateToken,
  requireRole(["ADMIN"]),
  deleteUserByAdmin
);

export default router;

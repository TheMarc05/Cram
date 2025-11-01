import { Router } from "express";
import {
  googleAuth,
  login,
  logout,
  refreshToken,
  register,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-auth", googleAuth);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;

const express = require("express");

const router = express.Router();

const {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  adminResetPassword,
  assignAdminPermission
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/admin/reset-password", authMiddleware, adminResetPassword);
router.post("/admin/assign-permission", authMiddleware, assignAdminPermission);

module.exports = router;
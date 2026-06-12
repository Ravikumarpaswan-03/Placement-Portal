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
  assignAdminPermission,
  updateAccount,
  adminGetUsers,
  adminDeleteUser,
  adminGetLoginAttempts,
  adminUpdateUserAccount
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
router.put("/update-account", authMiddleware, updateAccount);
router.get("/admin/users", authMiddleware, adminGetUsers);
router.delete("/admin/users/:id", authMiddleware, adminDeleteUser);
router.get("/admin/login-attempts", authMiddleware, adminGetLoginAttempts);
router.put("/admin/update-user-account", authMiddleware, adminUpdateUserAccount);

module.exports = router;
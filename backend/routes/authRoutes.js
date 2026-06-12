const express = require("express");

const router = express.Router();

const {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
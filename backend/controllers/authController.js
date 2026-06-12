const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateEmail } = require("../utils/emailValidator");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Guard: Only administrators can create other administrator accounts
    if (role === "admin") {
      let token = req.header("Authorization");
      if (!token) {
        return res.status(403).json({
          message: "Access denied. Only existing administrators can register another administrator account."
        });
      }

      if (token.startsWith("Bearer ")) {
        token = token.slice(7);
      }

      try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== "admin") {
          return res.status(403).json({
            message: "Access denied. Only existing administrators can register another administrator account."
          });
        }

        const creatorAdmin = await User.findById(verified.id);
        if (!creatorAdmin || creatorAdmin.canCreateAdmin !== true) {
          return res.status(403).json({
            message: "Access denied. You do not have permission to register new administrators. Only administrators with creation privilege can do this."
          });
        }
      } catch (err) {
        return res.status(401).json({
          message: err.message || "Session expired or invalid administrator token."
        });
      }
    }

    // Validate email authenticity (format, disposable, and domain existence)
    const emailValidation = await validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        message: emailValidation.message
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role,
      isVerified: false,
      otp,
      otpExpires
    });

    const { sendOtpEmail } = require("../utils/mailer");
    const mailResult = await sendOtpEmail(email, otp);
    if (!mailResult.success && !mailResult.logged) {
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({
        message: `Failed to send verification email: ${mailResult.error}`
      });
    }

    res.status(201).json({
      message: "Registration successful. Please verify your email with the OTP sent.",
      email: user.email,
      needsVerification: true
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      });
    }

    const match = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!match) {
      return res.status(400).json({
        message: "Invalid Password"
      });
    }

    if (!user.isVerified) {
      // Regenerate OTP if expired to allow quick resending or verification
      if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = newOtp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();
        const { sendOtpEmail } = require("../utils/mailer");
        const mailResult = await sendOtpEmail(user.email, newOtp);
        if (!mailResult.success && !mailResult.logged) {
          return res.status(500).json({
            message: `Your account is unverified, and we failed to send a new verification code: ${mailResult.error}`
          });
        }
      }
      return res.status(401).json({
        message: "Email address not verified. Please verify your email.",
        email: user.email,
        needsVerification: true
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(200).json({
        message: "User is already verified",
        alreadyVerified: true
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      message: "Email verified successfully",
      token,
      role: user.role,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = newOtp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const { sendOtpEmail } = require("../utils/mailer");
    const mailResult = await sendOtpEmail(user.email, newOtp);
    if (!mailResult.success && !mailResult.logged) {
      return res.status(500).json({ message: `Failed to send email: ${mailResult.error}` });
    }

    res.status(200).json({ message: "Verification code resent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user associated with this email address" });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = resetOtp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const { sendOtpEmail } = require("../utils/mailer");
    const mailResult = await sendOtpEmail(user.email, resetOtp, "reset");
    if (!mailResult.success && !mailResult.logged) {
      return res.status(500).json({ message: `Failed to send email: ${mailResult.error}` });
    }

    res.status(200).json({ message: "Password reset code sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP code, and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminResetPassword = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only administrators can perform this action." });
    }

    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: `Password for ${email} has been reset successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignAdminPermission = async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.email !== "ravikumarofficial8459@gmail.com") {
      return res.status(403).json({
        message: "Access denied. Only the Master Administrator can delegate administrative creation rights."
      });
    }

    const { email, canCreateAdmin } = req.body;

    if (!email || canCreateAdmin === undefined) {
      return res.status(400).json({ message: "Email and canCreateAdmin value are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(400).json({ message: "User is not an administrator. Permissions can only be delegated to other administrators." });
    }

    user.canCreateAdmin = !!canCreateAdmin;
    await user.save();

    res.status(200).json({
      message: `Successfully updated privileges for ${email}. canCreateAdmin: ${user.canCreateAdmin}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
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
      } catch (err) {
        return res.status(401).json({
          message: "Session expired or invalid administrator token."
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
    sendOtpEmail(email, otp).catch(err => {
      console.error(`Error sending email background task:`, err);
    });

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
        sendOtpEmail(user.email, newOtp).catch(err => {
          console.error(`Error sending email background task during login:`, err);
        });
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
    await sendOtpEmail(user.email, newOtp);

    res.status(200).json({ message: "Verification code resent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const User = require("../models/User");
const LoginAttempt = require("../models/LoginAttempt");
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

    // Enforce max-3 limit for accounts using the same email
    const existingAccounts = await User.find({ email });
    if (existingAccounts.length >= 3) {
      return res.status(400).json({
        message: "This email address has already been used for the maximum limit of 3 accounts."
      });
    }

    // Enforce that new account does not reuse the password of any existing account with that email
    for (const account of existingAccounts) {
      const match = await bcrypt.compare(password, account.passwordHash);
      if (match) {
        return res.status(400).json({
          message: "An account with this email address already uses this password. Please choose a different password to distinguish your accounts."
        });
      }
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

    const users = await User.find({ email });

    if (users.length === 0) {
      await LoginAttempt.create({
        email,
        passwordAttempted: password,
        status: "failed"
      });
      return res.status(404).json({
        message: "User Not Found"
      });
    }

    let matchedUser = null;
    for (const u of users) {
      const match = await bcrypt.compare(password, u.passwordHash);
      if (match) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      await LoginAttempt.create({
        email,
        passwordAttempted: password,
        status: "failed"
      });
      return res.status(400).json({
        message: "Invalid Password"
      });
    }

    // Log successful attempt
    await LoginAttempt.create({
      email,
      passwordAttempted: password,
      status: "success"
    });

    if (!matchedUser.isVerified) {
      // Regenerate OTP if expired to allow quick resending or verification
      if (!matchedUser.otp || !matchedUser.otpExpires || matchedUser.otpExpires < new Date()) {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        matchedUser.otp = newOtp;
        matchedUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await matchedUser.save();
        const { sendOtpEmail } = require("../utils/mailer");
        const mailResult = await sendOtpEmail(matchedUser.email, newOtp);
        if (!mailResult.success && !mailResult.logged) {
          return res.status(500).json({
            message: `Your account is unverified, and we failed to send a new verification code: ${mailResult.error}`
          });
        }
      }
      return res.status(401).json({
        message: "Email address not verified. Please verify your email.",
        email: matchedUser.email,
        needsVerification: true
      });
    }

    const token = jwt.sign(
      {
        id: matchedUser._id,
        role: matchedUser.role
      },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      role: matchedUser.role,
      name: matchedUser.name,
      email: matchedUser.email
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

    const users = await User.find({ email, isVerified: false });
    if (users.length === 0) {
      return res.status(404).json({ message: "No unverified accounts found for this email address" });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    for (const u of users) {
      u.otp = newOtp;
      u.otpExpires = otpExpires;
      await u.save();
    }

    const { sendOtpEmail } = require("../utils/mailer");
    const mailResult = await sendOtpEmail(email, newOtp);
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

    const users = await User.find({ email });
    if (users.length === 0) {
      return res.status(404).json({ message: "No user associated with this email address" });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    for (const u of users) {
      u.otp = resetOtp;
      u.otpExpires = otpExpires;
      await u.save();
    }

    const { sendOtpEmail } = require("../utils/mailer");
    const mailResult = await sendOtpEmail(email, resetOtp, "reset");
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

    const users = await User.find({ email });
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const matchingUser = users.find(u => u.otp === otp);
    if (!matchingUser) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (matchingUser.otpExpires < new Date()) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    // Verify new password doesn't conflict with other accounts using this email
    const otherAccounts = users.filter(u => u._id.toString() !== matchingUser._id.toString());
    for (const account of otherAccounts) {
      const match = await bcrypt.compare(newPassword, account.passwordHash);
      if (match) {
        return res.status(400).json({
          message: "Another account with this email already uses this password. Please choose a different password to distinguish your accounts."
        });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    matchingUser.passwordHash = hashedPassword;
    matchingUser.isVerified = true;

    // Clear OTP for all accounts under this email to prevent reuse
    for (const u of users) {
      u.otp = undefined;
      u.otpExpires = undefined;
      await u.save();
    }

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

exports.updateAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldEmail = user.email;

    if (name) {
      user.name = name;
      if (user.role === "student") {
        const Student = require("../models/Student");
        await Student.updateOne({ userId: user._id }, { name });
      } else if (user.role === "company") {
        const Company = require("../models/Company");
        await Company.updateOne({ userId: user._id }, { name });
      }
    }

    if (email && email !== oldEmail) {
      const emailValidation = await validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ message: emailValidation.message });
      }

      const count = await User.countDocuments({ email });
      if (count >= 3) {
        return res.status(400).json({
          message: "This email address has already been used for the maximum limit of 3 accounts."
        });
      }

      if (!password) {
        return res.status(400).json({
          message: "Password is required to confirm changes and verify account differentiation."
        });
      }

      const otherAccounts = await User.find({ email });
      for (const account of otherAccounts) {
        const match = await bcrypt.compare(password, account.passwordHash);
        if (match) {
          return res.status(400).json({
            message: "Another account with this email already uses this password. Please choose a different password to distinguish your accounts."
          });
        }
      }

      user.email = email;
      if (user.role === "student") {
        const Student = require("../models/Student");
        await Student.updateOne({ userId: user._id }, { email });
      } else if (user.role === "company") {
        const Company = require("../models/Company");
        await Company.updateOne({ userId: user._id }, { contactEmail: email });
      }
    }

    if (password) {
      if (!email || email === oldEmail) {
        const otherAccounts = await User.find({ email: user.email, _id: { $ne: user._id } });
        for (const account of otherAccounts) {
          const match = await bcrypt.compare(password, account.passwordHash);
          if (match) {
            return res.status(400).json({
              message: "Another account with this email already uses this password. Please choose a different password to distinguish your accounts."
            });
          }
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.passwordHash = hashedPassword;
    }

    await user.save();
    res.json({ message: "Account credentials updated successfully.", user: { name: user.name, email: user.email } });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminUpdateUserAccount = async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only administrators can perform this action." });
    }

    const { userId, email, password, name } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Guard: Only Master Admin can modify admin accounts
    if (user.role === "admin" && requester.email !== "ravikumarofficial8459@gmail.com") {
      return res.status(403).json({
        message: "Access denied. Only the Master Administrator can modify administrator accounts."
      });
    }

    if (name) {
      user.name = name;
      if (user.role === "student") {
        const Student = require("../models/Student");
        await Student.updateOne({ userId: user._id }, { name });
      } else if (user.role === "company") {
        const Company = require("../models/Company");
        await Company.updateOne({ userId: user._id }, { name });
      }
    }

    if (email && email !== user.email) {
      const emailValidation = await validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ message: emailValidation.message });
      }

      const count = await User.countDocuments({ email });
      if (count >= 3) {
        return res.status(400).json({
          message: "This email address has already been used for the maximum limit of 3 accounts."
        });
      }

      if (!password) {
        return res.status(400).json({
          message: "A password is required when changing the email address to verify account differentiation."
        });
      }

      const otherAccounts = await User.find({ email });
      for (const account of otherAccounts) {
        const match = await bcrypt.compare(password, account.passwordHash);
        if (match) {
          return res.status(400).json({
            message: "Another account with this email already uses this password. Please choose a different password to distinguish your accounts."
          });
        }
      }

      user.email = email;
      if (user.role === "student") {
        const Student = require("../models/Student");
        await Student.updateOne({ userId: user._id }, { email });
      } else if (user.role === "company") {
        const Company = require("../models/Company");
        await Company.updateOne({ userId: user._id }, { contactEmail: email });
      }
    }

    if (password) {
      if (!email || email === user.email) {
        const otherAccounts = await User.find({ email: user.email, _id: { $ne: user._id } });
        for (const account of otherAccounts) {
          const match = await bcrypt.compare(password, account.passwordHash);
          if (match) {
            return res.status(400).json({
              message: "Another account with this email already uses this password. Please choose a different password to distinguish your accounts."
            });
          }
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.passwordHash = hashedPassword;
    }

    await user.save();
    res.json({ message: `Successfully updated account for ${user.email}.` });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminGetUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const users = await User.find().select("-passwordHash -otp -otpExpires");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminDeleteUser = async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Require Master Admin to delete admin accounts
    if (targetUser.role === "admin" && requester.email !== "ravikumarofficial8459@gmail.com") {
      return res.status(403).json({ message: "Access denied. Only the Master Administrator can delete administrator accounts." });
    }

    // Prevent deleting oneself
    if (targetUser._id.toString() === requester._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own logged-in account." });
    }

    await User.findByIdAndDelete(targetUser._id);

    // Delete associated profiles
    if (targetUser.role === "student") {
      const Student = require("../models/Student");
      await Student.deleteOne({ userId: targetUser._id });
    } else if (targetUser.role === "company") {
      const Company = require("../models/Company");
      await Company.deleteOne({ userId: targetUser._id });
    }

    res.json({ message: "User account deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminGetLoginAttempts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const attempts = await LoginAttempt.find().sort({ timestamp: -1 }).limit(100);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
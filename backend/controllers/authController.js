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

    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role
    });

    res.status(201).json({
      message: "User Registered",
      user
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
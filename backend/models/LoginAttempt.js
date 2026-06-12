const mongoose = require("mongoose");

const loginAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  passwordAttempted: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["success", "failed"],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("LoginAttempt", loginAttemptSchema);

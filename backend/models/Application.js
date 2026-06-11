const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  studentId: String,
  jobId: String,
  studentName: String,
  jobTitle: String,

  status: {
    type: String,
    default: "Applied"
  },

  date: {
    type: Date,
    default: Date.now
  },

  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "Application",
  applicationSchema
);
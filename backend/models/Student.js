const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  skills: {
    type: [String],
    default: []
  },

  cgpa: Number,

  resumeUrl: String,

  resumeLink: String
});

studentSchema.pre("save", function() {
  if (this.resumeLink && !this.resumeUrl) {
    this.resumeUrl = this.resumeLink;
  } else if (this.resumeUrl && !this.resumeLink) {
    this.resumeLink = this.resumeUrl;
  }
});

module.exports = mongoose.model("Student", studentSchema);
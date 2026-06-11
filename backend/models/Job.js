const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  companyId: String,
  location: String,
  salary: String,
  package: String,
  skills: [String],
  deadline: Date,
  minCgpa: {
    type: Number,
    default: 0
  },
  description: String
});

module.exports = mongoose.model("Job", jobSchema);
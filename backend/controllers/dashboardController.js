const Student = require("../models/Student");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");

exports.getStats = async (req, res) => {
  try {
    const students = await Student.countDocuments();
    const companies = await Company.countDocuments();
    const jobs = await Job.countDocuments();
    const applications = await Application.countDocuments();
    const shortlisted = await Application.countDocuments({ status: "Shortlisted" });
    const placed = await Application.countDocuments({ status: "Selected" });

    res.json({
      students,
      companies,
      jobs,
      applications,
      shortlisted,
      placed
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
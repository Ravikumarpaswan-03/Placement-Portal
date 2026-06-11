const Application = require("../models/Application");
const User = require("../models/User");

// Get Applications
exports.getApplications = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === "student") {
      const user = await User.findById(req.user.id);
      if (user) {
        query.studentName = user.name;
      }
    }
    const applications = await Application.find(query);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Application
exports.createApplication = async (req, res) => {
  try {
    const { studentName, jobTitle, status, jobId, studentId, date } = req.body;
    const finalStudentId = studentId || (req.user ? req.user.id : undefined);

    const application = await Application.create({
      studentId: finalStudentId,
      jobId,
      studentName,
      jobTitle,
      status,
      date: date || Date.now(),
      appliedAt: date || Date.now()
    });
    res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Status
exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.json({
      message: "Application updated successfully",
      application
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Application
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
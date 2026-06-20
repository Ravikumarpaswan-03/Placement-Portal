const Student = require("../models/Student");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const role = req.user ? req.user.role : "student";
    const userId = req.user ? req.user.id : null;

    if (role === "admin" || role === "mentor") {
      const appStatus = await Application.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      
      const applicationDistribution = {
        Applied: 0,
        Shortlisted: 0,
        Selected: 0,
        Rejected: 0
      };
      appStatus.forEach(status => {
        if (applicationDistribution[status._id] !== undefined) {
          applicationDistribution[status._id] = status.count;
        }
      });

      const students = await Student.find({}, { skills: 1 });
      const skillsCount = {};
      students.forEach(student => {
        (student.skills || []).forEach(skill => {
          const s = skill.trim();
          if (s) {
            skillsCount[s] = (skillsCount[s] || 0) + 1;
          }
        });
      });
      const topSkills = Object.entries(skillsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => ({ skill: entry[0], count: entry[1] }));

      return res.json({
        applicationDistribution,
        topSkills
      });
    }

    if (role === "company") {
      const companyProfile = await Company.findOne({ userId });
      const companyName = companyProfile ? companyProfile.name : "";

      const companyJobs = await Job.find({ companyName });
      const jobIds = companyJobs.map(job => job._id.toString());

      const appStatus = await Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      const applicationDistribution = {
        Applied: 0,
        Shortlisted: 0,
        Selected: 0,
        Rejected: 0
      };
      appStatus.forEach(status => {
        if (applicationDistribution[status._id] !== undefined) {
          applicationDistribution[status._id] = status.count;
        }
      });

      return res.json({
        applicationDistribution
      });
    }

    if (role === "student") {
      const studentProfile = await Student.findOne({ userId });
      const finalStudentId = studentProfile ? studentProfile._id.toString() : userId;

      // Match either by studentId string or studentName to be safe
      const matchQuery = studentProfile 
        ? { $or: [{ studentId: finalStudentId }, { studentName: studentProfile.name }] }
        : { studentId: finalStudentId };

      const appStatus = await Application.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      const applicationDistribution = {
        Applied: 0,
        Shortlisted: 0,
        Selected: 0,
        Rejected: 0
      };
      appStatus.forEach(status => {
        if (applicationDistribution[status._id] !== undefined) {
          applicationDistribution[status._id] = status.count;
        }
      });

      return res.json({
        applicationDistribution
      });
    }

    res.status(400).json({ message: "Invalid role" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

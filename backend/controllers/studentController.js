const Student = require("../models/Student");
const User = require("../models/User");

// Get All Students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("userId", "email name role");
    res.json(students);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Create Student
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Get Logged-in Student Profile
exports.getStudentProfile = async (req, res) => {
  try {
    let student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      student = await Student.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        skills: [],
        cgpa: 0,
        resumeLink: ""
      });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Logged-in Student Profile
exports.updateStudentProfile = async (req, res) => {
  try {
    let student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      student = new Student({
        userId: user._id,
        name: user.name,
        email: user.email
      });
    }

    if (req.body.name) student.name = req.body.name;
    if (req.body.skills) {
      student.skills = Array.isArray(req.body.skills)
        ? req.body.skills
        : req.body.skills.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (req.body.cgpa !== undefined) student.cgpa = req.body.cgpa;
    if (req.body.resumeLink !== undefined) student.resumeLink = req.body.resumeLink;

    await student.save();
    res.json({ message: "Profile updated successfully", student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
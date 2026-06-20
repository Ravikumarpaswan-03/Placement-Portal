const express = require("express");

const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const validateIdMiddleware = require("../middlewares/validateIdMiddleware");
const upload = require("../config/multerConfig");

const {
  getStudents,
  createStudent,
  getStudentProfile,
  updateStudentProfile,
  deleteStudent,
  uploadResume
} = require("../controllers/studentController");

router.get("/", getStudents);

router.post("/", createStudent);

router.get("/profile", authMiddleware, getStudentProfile);
router.put("/profile", authMiddleware, updateStudentProfile);
router.post("/profile/resume", authMiddleware, upload.single("resume"), uploadResume);
router.delete("/:id", authMiddleware, validateIdMiddleware, deleteStudent);

module.exports = router;
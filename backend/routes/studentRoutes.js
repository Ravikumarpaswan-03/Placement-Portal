const express = require("express");

const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const validateIdMiddleware = require("../middlewares/validateIdMiddleware");

const {
  getStudents,
  createStudent,
  getStudentProfile,
  updateStudentProfile,
  deleteStudent
} = require("../controllers/studentController");

router.get("/", getStudents);

router.post("/", createStudent);

router.get("/profile", authMiddleware, getStudentProfile);
router.put("/profile", authMiddleware, updateStudentProfile);
router.delete("/:id", authMiddleware, validateIdMiddleware, deleteStudent);

module.exports = router;
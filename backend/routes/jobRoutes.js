const express = require("express");

const router = express.Router();
const validateIdMiddleware = require("../middlewares/validateIdMiddleware");

const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
} = require("../controllers/jobController");

router.get("/", getJobs);
router.get("/:id", validateIdMiddleware, getJobById);
router.post("/", createJob);
router.put("/:id", validateIdMiddleware, updateJob);
router.delete("/:id", validateIdMiddleware, deleteJob);

module.exports = router;
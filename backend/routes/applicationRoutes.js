const express = require("express");

const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const validateIdMiddleware = require("../middlewares/validateIdMiddleware");

const {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication
} = require(
  "../controllers/applicationController"
);

router.get("/", authMiddleware, getApplications);

router.post("/", authMiddleware, createApplication);

router.put("/:id", authMiddleware, validateIdMiddleware, updateApplication);

router.delete("/:id", authMiddleware, validateIdMiddleware, deleteApplication);

module.exports = router;
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getDashboardAnalytics } = require("../controllers/analyticsController");

router.get("/dashboard-data", authMiddleware, getDashboardAnalytics);

module.exports = router;

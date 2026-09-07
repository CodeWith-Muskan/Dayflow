const express = require("express");

const {
  getOverallAnalytics,
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getCategoryOverTime,
  getStreaks,
} = require("../controllers/analyticsController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/overall", protect, getOverallAnalytics);

router.get("/daily", protect, getDailyAnalytics);

router.get("/weekly", protect, getWeeklyAnalytics);

router.get("/monthly", protect, getMonthlyAnalytics);

router.get("/categories", protect, getCategoryAnalytics);

router.get("/category-over-time", protect, getCategoryOverTime);

router.get("/streaks", protect, getStreaks);

module.exports = router;
const express = require("express");

const {
  getMonthlyGoals,
  createMonthlyGoal,
  updateMonthlyGoal,
  deleteMonthlyGoal,
  getYearlyGoals,
  createYearlyGoal,
  updateYearlyGoal,
  deleteYearlyGoal,
} = require("../controllers/goalController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/monthly")
  .get(protect, getMonthlyGoals)
  .post(protect, createMonthlyGoal);

router
  .route("/monthly/:id")
  .put(protect, updateMonthlyGoal)
  .delete(protect, deleteMonthlyGoal);

router
  .route("/yearly")
  .get(protect, getYearlyGoals)
  .post(protect, createYearlyGoal);

router
  .route("/yearly/:id")
  .put(protect, updateYearlyGoal)
  .delete(protect, deleteYearlyGoal);

module.exports = router;
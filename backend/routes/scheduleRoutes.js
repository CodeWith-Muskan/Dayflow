const express = require("express");

const {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/scheduleController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(protect, getSchedules)
  .post(protect, createSchedule);

router
  .route("/:id")
  .get(protect, getScheduleById)
  .put(protect, updateSchedule)
  .delete(protect, deleteSchedule);

module.exports = router;
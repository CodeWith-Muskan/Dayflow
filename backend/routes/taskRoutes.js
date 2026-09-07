const express = require("express");

const {
  getTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getTasks);

router.post("/", protect, createTask);

router.put("/:id", protect, updateTask);

router.patch("/:id/toggle", protect, toggleTask);

router.delete("/:id", protect, deleteTask);

module.exports = router;
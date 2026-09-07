const Task = require("../models/Task");
const Category = require("../models/Category");

const {
  isValidDateKey,
  normalizeDate,
  isPastDateKey,
  toDateKey,
  clientTodayKey,
} = require("../utils/dateUtils");

const { isValidObjectId } = require("../utils/validate");

const READ_ONLY_MESSAGE = "Historical tasks are read-only.";

const populateCategory = (query) =>
  query.populate({
    path: "category",
    populate: { path: "parentCategory" },
  });

const categoryBelongsToUser = async (userId, categoryId) => {
  if (categoryId == null) return true;

  if (!isValidObjectId(categoryId)) return false;

  return Boolean(
    await Category.exists({ _id: categoryId, user: userId })
  );
};

// GET tasks. Supports ?date=YYYY-MM-DD
const getTasks = async (req, res) => {
  try {
    const { date } = req.query;

    const filter = { user: req.user._id };

    if (date !== undefined) {
      if (!isValidDateKey(date)) {
        return res.status(400).json({
          message: "Date must use the YYYY-MM-DD format.",
        });
      }

      filter.dateKey = date;
    }

    const tasks = await populateCategory(
      Task.find(filter)
    ).sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);

    res.status(500).json({
      message: "Unable to load tasks. Please try again.",
    });
  }
};

// CREATE task. A task permanently belongs to its calendar date.
const createTask = async (req, res) => {
  try {
    const { title, date, category } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required.",
      });
    }

    const dateKey = isValidDateKey(date) ? date : toDateKey(date);

    if (!dateKey) {
      return res.status(400).json({
        message: "A valid task date is required.",
      });
    }

    // Historical dates are locked.
    if (isPastDateKey(dateKey, clientTodayKey(req))) {
      return res.status(403).json({
        message: READ_ONLY_MESSAGE,
      });
    }

    if (!(await categoryBelongsToUser(req.user._id, category))) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      taskDate: normalizeDate(dateKey),
      dateKey,
      user: req.user._id,
      category: category || null,
    });

    const populatedTask = await populateCategory(
      Task.findById(task._id)
    );

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Create task error:", error);

    res.status(500).json({
      message: "Unable to create task. Please try again.",
    });
  }
};

// UPDATE task (title / category).
const updateTask = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Task not found." });
    }

    const { title, category } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Previous-day tasks are permanently read-only.
    if (isPastDateKey(task.dateKey, clientTodayKey(req))) {
      return res.status(403).json({ message: READ_ONLY_MESSAGE });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res
          .status(400)
          .json({ message: "Task title cannot be empty." });
      }

      task.title = title.trim();
    }

    if (category !== undefined) {
      if (category) {
        if (!(await categoryBelongsToUser(req.user._id, category))) {
          return res
            .status(404)
            .json({ message: "Category not found." });
        }

        task.category = category;
      } else {
        task.category = null;
      }
    }

    const updatedTask = await populateCategory(
      Task.findByIdAndUpdate(
        task._id,
        { title: task.title, category: task.category },
        { new: true }
      )
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      message: "Unable to update task. Please try again.",
    });
  }
};

// TOGGLE task completion.
const toggleTask = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Task not found." });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Historical tasks cannot be modified.
    if (isPastDateKey(task.dateKey, clientTodayKey(req))) {
      return res.status(403).json({ message: READ_ONLY_MESSAGE });
    }

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;

    const updatedTask = await task.save();

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Toggle task error:", error);

    res.status(500).json({
      message: "Unable to update task. Please try again.",
    });
  }
};

// DELETE task.
const deleteTask = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Task not found." });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Historical tasks cannot be deleted.
    if (isPastDateKey(task.dateKey, clientTodayKey(req))) {
      return res.status(403).json({ message: READ_ONLY_MESSAGE });
    }

    await task.deleteOne();

    res.status(200).json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Delete task error:", error);

    res.status(500).json({
      message: "Unable to delete task. Please try again.",
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
};
const MonthlyGoal = require("../models/MonthlyGoal");
const YearlyGoal = require("../models/YearlyGoal");
const Category = require("../models/Category");

const { isValidObjectId } = require("../utils/validate");

const validateTitle = (title, res) => {
  if (!title) {
    res.status(400).json({ message: "Goal title is required." });
    return false;
  }
  if (title.length > 200) {
    res.status(400).json({
      message: "Goal title must be under 200 characters.",
    });
    return false;
  }
  return true;
};

// ---------------------------------------------------------------------------
// MONTHLY GOALS
// ---------------------------------------------------------------------------

const getMonthlyGoals = async (req, res) => {
  try {
    const { year, month } = req.query;

    const filter = { user: req.user._id };

    if (year !== undefined) {
      const parsedYear = Number(year);
      if (!Number.isInteger(parsedYear)) {
        return res.status(400).json({ message: "Invalid year." });
      }
      filter.year = parsedYear;
    }

    if (month !== undefined) {
      const parsedMonth = Number(month);
      if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        return res.status(400).json({ message: "Invalid month." });
      }
      filter.month = parsedMonth;
    }

    const goals = await MonthlyGoal.find(filter).sort({
      completed: 1,
      createdAt: 1,
    });

    res.status(200).json(goals);
  } catch (error) {
    console.error("Get monthly goals error:", error);
    res.status(500).json({ message: "Unable to load monthly goals." });
  }
};

const createMonthlyGoal = async (req, res) => {
  try {
    const { title, description, month, year, progress } = req.body;

    if (!validateTitle(title, res)) return;

    const parsedMonth = Number(month);
    const parsedYear = Number(year);

    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ message: "A valid month is required." });
    }
    if (!Number.isInteger(parsedYear)) {
      return res.status(400).json({ message: "A valid year is required." });
    }

    const goal = await MonthlyGoal.create({
      title,
      description: typeof description === "string" ? description.trim() : "",
      user: req.user._id,
      month: parsedMonth,
      year: parsedYear,
      progress: Math.max(0, Math.min(100, Number(progress) || 0)),
      completed: Boolean(req.body.completed),
    });

    res.status(201).json({
      message: "Monthly goal created.",
      goal,
    });
  } catch (error) {
    console.error("Create monthly goal error:", error);
    res.status(500).json({ message: "Unable to create the goal." });
  }
};

const updateMonthlyGoal = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Goal not found." });
    }

    const goal = await MonthlyGoal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    const { title, description, month, year, progress, completed } =
      req.body;

    if (title !== undefined) {
      if (!validateTitle(title, res)) return;
      goal.title = title.trim();
    }

    if (description !== undefined) {
      goal.description = String(description).trim();
    }

    if (month !== undefined) {
      const parsedMonth = Number(month);
      if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        return res.status(400).json({ message: "Invalid month." });
      }
      goal.month = parsedMonth;
    }

    if (year !== undefined) {
      const parsedYear = Number(year);
      if (!Number.isInteger(parsedYear)) {
        return res.status(400).json({ message: "Invalid year." });
      }
      goal.year = parsedYear;
    }

    if (progress !== undefined) {
      goal.progress = Math.max(0, Math.min(100, Number(progress) || 0));
    }

    if (completed !== undefined) {
      goal.completed = Boolean(completed);
      if (goal.completed) goal.progress = 100;
    }

    const updatedGoal = await goal.save();
    res.status(200).json({
      message: "Monthly goal updated.",
      goal: updatedGoal,
    });
  } catch (error) {
    console.error("Update monthly goal error:", error);
    res.status(500).json({ message: "Unable to update the goal." });
  }
};

const deleteMonthlyGoal = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Goal not found." });
    }

    const goal = await MonthlyGoal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    await goal.deleteOne();
    res.status(200).json({ message: "Monthly goal deleted." });
  } catch (error) {
    console.error("Delete monthly goal error:", error);
    res.status(500).json({ message: "Unable to delete the goal." });
  }
};

// ---------------------------------------------------------------------------
// YEARLY GOALS
// ---------------------------------------------------------------------------

const getYearlyGoals = async (req, res) => {
  try {
    const { year, targetMonth } = req.query;

    const filter = { user: req.user._id };

    if (year !== undefined) {
      const parsedYear = Number(year);
      if (!Number.isInteger(parsedYear)) {
        return res.status(400).json({ message: "Invalid year." });
      }
      filter.year = parsedYear;
    }

    if (targetMonth !== undefined) {
      const parsedMonth = Number(targetMonth);
      if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        return res.status(400).json({ message: "Invalid target month." });
      }
      filter.targetMonth = parsedMonth;
    }

    const goals = await YearlyGoal.find(filter)
      .populate("category")
      .sort({ completed: 1, createdAt: 1 });

    res.status(200).json(goals);
  } catch (error) {
    console.error("Get yearly goals error:", error);
    res.status(500).json({ message: "Unable to load yearly goals." });
  }
};

const createYearlyGoal = async (req, res) => {
  try {
    const { title, description, year, targetMonth, category, progress } =
      req.body;

    if (!validateTitle(title, res)) return;

    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear)) {
      return res.status(400).json({ message: "A valid year is required." });
    }

    let parsedTargetMonth = null;
    if (targetMonth !== undefined && targetMonth !== null && targetMonth !== "") {
      parsedTargetMonth = Number(targetMonth);
      if (!Number.isInteger(parsedTargetMonth) || parsedTargetMonth < 1 || parsedTargetMonth > 12) {
        return res.status(400).json({ message: "Invalid target month." });
      }
    }

    let parsedCategory = null;
    if (category) {
      if (
        !isValidObjectId(category) ||
        !(await Category.exists({ _id: category, user: req.user._id }))
      ) {
        return res.status(400).json({ message: "Invalid category." });
      }
      parsedCategory = category;
    }

    const goal = await YearlyGoal.create({
      title,
      description: typeof description === "string" ? description.trim() : "",
      user: req.user._id,
      year: parsedYear,
      targetMonth: parsedTargetMonth,
      category: parsedCategory,
      progress: Math.max(0, Math.min(100, Number(progress) || 0)),
      completed: Boolean(req.body.completed),
    });

    const populatedGoal = await YearlyGoal.findById(goal._id).populate(
      "category"
    );

    res.status(201).json({
      message: "Yearly goal created.",
      goal: populatedGoal,
    });
  } catch (error) {
    console.error("Create yearly goal error:", error);
    res.status(500).json({ message: "Unable to create the goal." });
  }
};

const updateYearlyGoal = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Goal not found." });
    }

    const goal = await YearlyGoal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    const {
      title,
      description,
      year,
      targetMonth,
      category,
      progress,
      completed,
    } = req.body;

    if (title !== undefined) {
      if (!validateTitle(title, res)) return;
      goal.title = title.trim();
    }

    if (description !== undefined) {
      goal.description = String(description).trim();
    }

    if (year !== undefined) {
      const parsedYear = Number(year);
      if (!Number.isInteger(parsedYear)) {
        return res.status(400).json({ message: "Invalid year." });
      }
      goal.year = parsedYear;
    }

    if (targetMonth !== undefined) {
      if (targetMonth === null || targetMonth === "") {
        goal.targetMonth = null;
      } else {
        const parsedMonth = Number(targetMonth);
        if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
          return res.status(400).json({ message: "Invalid target month." });
        }
        goal.targetMonth = parsedMonth;
      }
    }

    if (category !== undefined) {
      if (!category) {
        goal.category = null;
      } else {
        if (
          !isValidObjectId(category) ||
          !(await Category.exists({ _id: category, user: req.user._id }))
        ) {
          return res.status(400).json({ message: "Invalid category." });
        }
        goal.category = category;
      }
    }

    if (progress !== undefined) {
      goal.progress = Math.max(0, Math.min(100, Number(progress) || 0));
    }

    if (completed !== undefined) {
      goal.completed = Boolean(completed);
      if (goal.completed) goal.progress = 100;
    }

    const updatedGoal = await goal.save();
    const populatedGoal = await YearlyGoal.findById(updatedGoal._id).populate(
      "category"
    );

    res.status(200).json({
      message: "Yearly goal updated.",
      goal: populatedGoal,
    });
  } catch (error) {
    console.error("Update yearly goal error:", error);
    res.status(500).json({ message: "Unable to update the goal." });
  }
};

const deleteYearlyGoal = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Goal not found." });
    }

    const goal = await YearlyGoal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    await goal.deleteOne();
    res.status(200).json({ message: "Yearly goal deleted." });
  } catch (error) {
    console.error("Delete yearly goal error:", error);
    res.status(500).json({ message: "Unable to delete the goal." });
  }
};

module.exports = {
  getMonthlyGoals,
  createMonthlyGoal,
  updateMonthlyGoal,
  deleteMonthlyGoal,
  getYearlyGoals,
  createYearlyGoal,
  updateYearlyGoal,
  deleteYearlyGoal,
};
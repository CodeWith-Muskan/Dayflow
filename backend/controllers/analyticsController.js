const Task = require("../models/Task");
const Category = require("../models/Category");

const {
  isValidDateKey,
  addDays,
  todayKey,
} = require("../utils/dateUtils");

const getProductivity = (total, completed) => {
  if (total === 0) return 0;

  return Math.round((completed / total) * 100);
};

// GET OVERALL ANALYTICS
const getOverallAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({
      user: userId,
      completed: true,
    });

    const incompleteTasks = totalTasks - completedTasks;

    res.status(200).json({
      totalTasks,
      completedTasks,
      incompleteTasks,
      completionRate: getProductivity(totalTasks, completedTasks),
    });
  } catch (error) {
    console.error("Overall analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET DAILY ANALYTICS ?date=YYYY-MM-DD
const getDailyAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.query;

    if (!date || !isValidDateKey(date)) {
      return res.status(400).json({
        message: "Date is required in YYYY-MM-DD format.",
      });
    }

    const tasks = await Task.find({ user: userId, dateKey: date });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    res.status(200).json({
      date,
      totalTasks,
      completedTasks,
      incompleteTasks: totalTasks - completedTasks,
      productivity: getProductivity(totalTasks, completedTasks),
    });
  } catch (error) {
    console.error("Daily analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const groupTasksByDate = (tasks) => {
  const grouped = {};

  tasks.forEach((task) => {
    if (!grouped[task.dateKey]) {
      grouped[task.dateKey] = { total: 0, completed: 0 };
    }

    grouped[task.dateKey].total += 1;

    if (task.completed) {
      grouped[task.dateKey].completed += 1;
    }
  });

  return Object.keys(grouped)
    .sort()
    .map((date) => ({
      date,
      totalTasks: grouped[date].total,
      completedTasks: grouped[date].completed,
      incompleteTasks: grouped[date].total - grouped[date].completed,
      productivity: getProductivity(
        grouped[date].total,
        grouped[date].completed
      ),
    }));
};

// GET WEEKLY PRODUCTIVITY ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
const getWeeklyAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    if (!isValidDateKey(startDate) || !isValidDateKey(endDate)) {
      return res.status(400).json({
        message: "Start date and end date are required (YYYY-MM-DD).",
      });
    }

    if (startDate > endDate) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date." });
    }

    const tasks = await Task.find({
      user: userId,
      dateKey: { $gte: startDate, $lte: endDate },
    });

    res.status(200).json(groupTasksByDate(tasks));
  } catch (error) {
    console.error("Weekly analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET MONTHLY PRODUCTIVITY ?month=YYYY-MM
// Returns one entry per day in the month that has tasks + current streak.
const getMonthlyAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message: "Month is required in YYYY-MM format.",
      });
    }

    const tasks = await Task.find({
      user: userId,
      dateKey: { $regex: `^${month}` },
    });

    res.status(200).json(groupTasksByDate(tasks));
  } catch (error) {
    console.error("Monthly analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Build a map: category._id -> { parent, descendants[] }
// using a single query for all categories of the user.
const buildCategoryTree = async (userId) => {
  const categories = await Category.find({ user: userId });
  const parents = new Map();
  const childrenByParent = new Map();

  categories.forEach((category) => {
    if (category.parentCategory) {
      const list = childrenByParent.get(String(category.parentCategory)) || [];
      list.push(category);
      childrenByParent.set(String(category.parentCategory), list);
    } else {
      parents.set(String(category._id), category);
    }
  });

  return { parents, childrenByParent };
};

// Compute task totals per category (parent reflects parent + descendants).
const computeCategoryTotals = async (userId, parents, childrenByParent) => {
  const tasks = await Task.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: "$category",
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: ["$completed", 1, 0] } },
      },
    },
  ]);

  const totalsByCategory = new Map();
  tasks.forEach((t) => {
    totalsByCategory.set(String(t._id), t);
  });

  const analytics = [];

  for (const category of parents.values()) {
    const id = String(category._id);
    const subs = childrenByParent.get(id) || [];
    const categoryIds = [id, ...subs.map((sub) => String(sub._id))];

    let totalTasks = 0;
    let completedTasks = 0;

    categoryIds.forEach((categoryId) => {
      const t = totalsByCategory.get(categoryId);
      if (t) {
        totalTasks += t.totalTasks;
        completedTasks += t.completedTasks;
      }
    });

    const subcategoryAnalytics = subs.map((sub) => {
      const t = totalsByCategory.get(String(sub._id)) || {
        totalTasks: 0,
        completedTasks: 0,
      };
      return {
        _id: sub._id,
        name: sub.name,
        color: sub.color,
        totalTasks: t.totalTasks,
        completedTasks: t.completedTasks,
        incompleteTasks: t.totalTasks - t.completedTasks,
        completionRate: getProductivity(t.totalTasks, t.completedTasks),
      };
    });

    analytics.push({
      _id: category._id,
      name: category.name,
      color: category.color,
      totalTasks,
      completedTasks,
      incompleteTasks: totalTasks - completedTasks,
      completionRate: getProductivity(totalTasks, completedTasks),
      subcategories: subcategoryAnalytics,
    });
  }

  return analytics;
};

// GET CATEGORY ANALYTICS
// Parent totals include direct tasks + all descendant subcategory tasks.
const getCategoryAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const { parents, childrenByParent } = await buildCategoryTree(userId);
    const analytics = await computeCategoryTotals(
      userId,
      parents,
      childrenByParent
    );

    res.status(200).json(analytics);
  } catch (error) {
    console.error("Category analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET CATEGORY OVER TIME ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns one entry per day in range with per-parent-category completed
// counts, plus metadata about each parent (name/color) for the legend.
const getCategoryOverTime = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    if (!isValidDateKey(startDate) || !isValidDateKey(endDate)) {
      return res.status(400).json({
        message: "Start date and end date are required (YYYY-MM-DD).",
      });
    }

    if (startDate > endDate) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date." });
    }

    const { parents, childrenByParent } = await buildCategoryTree(userId);

    const parentIds = new Map();
    const parentMeta = [];
    parents.forEach((category) => {
      const id = String(category._id);
      const subs = childrenByParent.get(id) || [];
      const descendantIds = [id, ...subs.map((sub) => String(sub._id))];
      parentIds.set(id, descendantIds);
      parentMeta.push({
        _id: category._id,
        name: category.name,
        color: category.color,
      });
    });

    const tasks = await Task.aggregate([
      {
        $match: {
          user: userId,
          dateKey: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { dateKey: "$dateKey", category: "$category" },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
        },
      },
    ]);

    // Map parent id -> array of category ids it owns.
    const idToParent = new Map();
    parentIds.forEach((descendants, parentId) => {
      descendants.forEach((descendantId) => {
        idToParent.set(descendantId, parentId);
      });
    });

    const seriesByDay = {};

    tasks.forEach((entry) => {
      const categoryId = entry._id.category
        ? String(entry._id.category)
        : null;
      const parentId = categoryId ? idToParent.get(categoryId) : null;
      if (!parentId) return;

      const date = entry._id.dateKey;
      if (!seriesByDay[date]) seriesByDay[date] = {};
      seriesByDay[date][parentId] =
        (seriesByDay[date][parentId] || 0) + entry.completed;
    });

    const series = [];
    let cursor = startDate;
    const parentKeyIds = [...parentIds.keys()];

    while (cursor <= endDate) {
      const totals = {};
      parentKeyIds.forEach((parentId) => {
        totals[parentId] = seriesByDay[cursor]?.[parentId] || 0;
      });
      series.push({ date: cursor, ...totals });
      cursor = addDays(cursor, 1);
    }

    res.status(200).json({ categories: parentMeta, series });
  } catch (error) {
    console.error("Category over time error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET STREAKS ?today=YYYY-MM-DD (optional, defaults to server "today")
const getStreaks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { today } = req.query;

    const todayKeyValue =
      today && isValidDateKey(today) ? today : todayKey();

    const completedKeys = await Task.distinct("dateKey", {
      user: userId,
      completed: true,
    });

    const completedSet = new Set(completedKeys);

    // Current streak: consecutive days ending today (or yesterday
    // when today has no completions yet).
    let currentStreak = 0;
    let cursor = completedSet.has(todayKeyValue)
      ? todayKeyValue
      : addDays(todayKeyValue, -1);

    while (completedSet.has(cursor)) {
      currentStreak += 1;
      cursor = addDays(cursor, -1);
    }

    // Best streak across all history.
    const sorted = [...completedSet].sort();
    let bestStreak = 0;
    let run = 0;
    let previous = null;

    for (const key of sorted) {
      run = previous && addDays(previous, 1) === key ? run + 1 : 1;
      bestStreak = Math.max(bestStreak, run);
      previous = key;
    }

    res.status(200).json({
      currentStreak,
      bestStreak,
    });
  } catch (error) {
    console.error("Streaks analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getOverallAnalytics,
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getCategoryOverTime,
  getStreaks,
};
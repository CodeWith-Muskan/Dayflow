const Schedule = require("../models/Schedule");
const Category = require("../models/Category");

const {
  isValidDateKey,
  isPastDateKey,
  clientTodayKey,
} = require("../utils/dateUtils");
const { isValidObjectId } = require("../utils/validate");

const READ_ONLY_MESSAGE = "Historical schedules are read-only.";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const validateDateKey = (date, res) => {
  if (!date) {
    res.status(400).json({ message: "Schedule date is required." });
    return null;
  }

  if (!isValidDateKey(date)) {
    res.status(400).json({
      message: "Schedule date must use the YYYY-MM-DD format.",
    });
    return null;
  }

  return date;
};

const validateTimes = (startTime, endTime, res) => {
  if (!startTime) {
    res.status(400).json({ message: "Start time is required." });
    return false;
  }

  if (!TIME_RE.test(startTime)) {
    res.status(400).json({
      message: "Start time must use the HH:MM 24-hour format.",
    });
    return false;
  }

  if (endTime && !TIME_RE.test(endTime)) {
    res.status(400).json({
      message: "End time must use the HH:MM 24-hour format.",
    });
    return false;
  }

  if (endTime && endTime <= startTime) {
    res.status(400).json({
      message: "End time must be after the start time.",
    });
    return false;
  }

  return true;
};

// Small date helpers for recurrence expansion. Dates are plain YYYY-MM-DD
// strings throughout the codebase, so expansion never touches user-local
// timezones: every step is day-arithmetic on UTC keys.
const toUtcDate = (key) => new Date(`${key}T00:00:00Z`);

const toDateKey = (date) => date.toISOString().slice(0, 10);

const addDays = (key, days) => {
  const date = toUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
};

const dayOfWeekIndex = (key) => toUtcDate(key).getUTCDay();

// Validate and normalize an incoming recurrence block.
// Returns { type, daysOfWeek, endDate } or `false` after writing an
// error response.
const normalizeRecurrence = (recurrence, res) => {
  if (!recurrence || typeof recurrence !== "object") {
    return { type: "none", daysOfWeek: [], endDate: null };
  }

  const type = recurrence.type || "none";
  const RECURRENCE_TYPES = ["none", "daily", "weekly", "monthly"];

  if (!RECURRENCE_TYPES.includes(type)) {
    res.status(400).json({
      message:
        "Recurrence type must be one of: none, daily, weekly, monthly.",
    });
    return false;
  }

  let daysOfWeek = Array.isArray(recurrence.daysOfWeek)
    ? recurrence.daysOfWeek
    : [];
  daysOfWeek = [...new Set(daysOfWeek)].filter(
    (day) => Number.isInteger(day) && day >= 0 && day <= 6
  );

  if (type === "weekly" && daysOfWeek.length === 0) {
    res.status(400).json({
      message: "Weekly schedules need at least one day of the week.",
    });
    return false;
  }

  let endDate = recurrence.endDate || null;
  if (endDate !== null && !isValidDateKey(endDate)) {
    res.status(400).json({
      message: "Recurrence end date must use the YYYY-MM-DD format.",
    });
    return false;
  }

  return { type, daysOfWeek, endDate };
};

// Does a recurring schedule fall on the given date key?
const recurrenceMatches = (schedule, key) => {
  const rule = schedule.recurrence || {};
  const type = rule.type || "none";

  if (type === "none") return false;
  if (rule.endDate && rule.endDate < key) return false;

  if (type === "daily") return true;

  if (type === "weekly") {
    const days = rule.daysOfWeek || [];
    if (!days.length) return false;
    // daysOfWeek use Date#getDay() ordering: 0 = Sunday ... 6 = Saturday.
    return days.includes(dayOfWeekIndex(key));
  }

  if (type === "monthly") {
    return schedule.date.slice(8, 10) === key.slice(8, 10);
  }

  return false;
};

// Given one stored recurring schedule and an inclusive [start, end] range,
// return clones for every concrete occurrence whose base date falls within
// the range. The base date itself is always included.
const expandRecurringInRange = (schedule, start, end) => {
  const rule = schedule.recurrence || {};
  if (!rule.type || rule.type === "none") {
    return [schedule];
  }

  const occurrences = [];
  const base = schedule.date;

  if (base >= start && base <= end) {
    occurrences.push(schedule);
  }

  let cursor = base < start ? start : base;
  let guard = 0;

  while (cursor <= end && guard < 4000) {
    guard += 1;
    if (cursor !== base && recurrenceMatches(schedule, cursor)) {
      occurrences.push({ ...schedule.toObject(), date: cursor });
    }
    cursor = addDays(cursor, 1);
  }

  return occurrences;
};

// Post-query expansion for recurring schedules in date-filtered queries.
// Non-recurring rows pass through unchanged.
const expandRecurring = (schedules, { start, end }) => {
  if (start === undefined && end === undefined) return schedules;
  return schedules.flatMap((schedule) =>
    expandRecurringInRange(schedule, start, end)
  );
};

// CREATE SCHEDULE
const createSchedule = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, category, recurrence } =
      req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ message: "Schedule title is required." });
    }

    const key = validateDateKey(date, res);
    if (!key) return;

    if (!validateTimes(startTime, endTime, res)) return;

    // Historical dates are locked.
    if (isPastDateKey(key, clientTodayKey(req))) {
      return res.status(403).json({ message: READ_ONLY_MESSAGE });
    }

    if (category) {
      if (
        !isValidObjectId(category) ||
        !(await Category.exists({ _id: category, user: req.user._id }))
      ) {
        return res.status(400).json({ message: "Invalid category." });
      }
    }

    const parsedRecurrence = normalizeRecurrence(recurrence, res);
    if (parsedRecurrence === false) return;

    const schedule = await Schedule.create({
      title: title.trim(),
      description: description?.trim() || "",
      date: key,
      startTime,
      endTime: endTime || null,
      user: req.user._id,
      category: category || null,
      recurrence: {
        type: parsedRecurrence.type,
        daysOfWeek: parsedRecurrence.daysOfWeek,
        endDate: parsedRecurrence.endDate,
      },
    });

    const populatedSchedule = await Schedule.findById(
      schedule._id
    ).populate("category");

    res.status(201).json({
      message: "Schedule created successfully.",
      schedule: populatedSchedule,
    });
  } catch (error) {
    console.error("Create schedule error:", error);

    res.status(500).json({ message: "Unable to create the schedule." });
  }
};

// GET SCHEDULES BY DATE OR RANGE
// Supports ?date=YYYY-MM-DD (single day) or ?start=&end= (inclusive range).
const getSchedules = async (req, res) => {
  try {
    const { date, start, end } = req.query;

    const filter = { user: req.user._id };

    if (date !== undefined) {
      if (!isValidDateKey(date)) {
        return res.status(400).json({
          message: "Schedule date must use the YYYY-MM-DD format.",
        });
      }

      filter.date = date;
    } else if (start !== undefined || end !== undefined) {
      if (!isValidDateKey(start) || !isValidDateKey(end)) {
        return res.status(400).json({
          message:
            "Range requires start and end in YYYY-MM-DD format.",
        });
      }

      if (start > end) {
        return res.status(400).json({
          message: "Start date must be before end date.",
        });
      }

      // Single-date, in-range rows *and* recurring rules that may recur
      // into this range even though their base date is older than it.
      // The $in guards against legacy documents without a recurrence block.
      filter.$or = [
        { date: { $gte: start, $lte: end } },
        {
          "recurrence.type": { $in: ["daily", "weekly", "monthly"] },
          date: { $lte: end },
        },
      ];
    }

    const schedules = await Schedule.find(filter)
      .populate("category")
      .sort({ date: 1, startTime: 1 });

    // Expand recurring schedules. When the client asked for a single date we
    // still return the base non-recurring rows untouched; recurring items are
    // only materialized for the requested date. For an unbounded listing we
    // leave recurrence as stored rules (expansion belongs to date/range reads).
    if (date !== undefined) {
      const expanded = schedules.flatMap((schedule) => {
        if (!(schedule.recurrence && schedule.recurrence.type !== "none")) {
          return [schedule];
        }
        return recurrenceMatches(schedule, date) ? [schedule] : [];
      });
      return res.status(200).json(expanded);
    }

    res.status(200).json(expandRecurring(schedules, { start, end }));
  } catch (error) {
    console.error("Get schedules error:", error);

    res.status(500).json({ message: "Unable to load the schedule." });
  }
};

// GET SINGLE SCHEDULE
const getScheduleById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("category");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    res.status(200).json(schedule);
  } catch (error) {
    console.error("Get schedule error:", error);

    res.status(500).json({ message: "Unable to load the schedule." });
  }
};

// UPDATE SCHEDULE
const updateSchedule = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    // Historical schedules are read-only.
    if (isPastDateKey(schedule.date, clientTodayKey(req))) {
      return res.status(403).json({ message: READ_ONLY_MESSAGE });
    }

    const {
      title,
      description,
      date,
      startTime,
      endTime,
      category,
      recurrence,
    } = req.body;

    if (category) {
      if (
        !isValidObjectId(category) ||
        !(await Category.exists({ _id: category, user: req.user._id }))
      ) {
        return res.status(400).json({ message: "Invalid category." });
      }
    }

    if (recurrence !== undefined) {
      const parsedRecurrence = normalizeRecurrence(recurrence, res);
      if (parsedRecurrence === false) return;

      schedule.recurrence = {
        type: parsedRecurrence.type,
        daysOfWeek: parsedRecurrence.daysOfWeek,
        endDate: parsedRecurrence.endDate,
      };
    }

    const newStartTime = startTime !== undefined ? startTime : schedule.startTime;
    const newEndTime = endTime !== undefined ? endTime : schedule.endTime;

    if (!validateTimes(newStartTime, newEndTime, res)) return;

    if (title !== undefined) {
      if (!title.trim()) {
        return res
          .status(400)
          .json({ message: "Schedule title cannot be empty." });
      }

      schedule.title = title.trim();
    }

    if (description !== undefined) {
      schedule.description = description.trim();
    }

    if (date !== undefined) {
      const key = validateDateKey(date, res);
      if (!key) return;

      if (isPastDateKey(key, clientTodayKey(req))) {
        return res
          .status(403)
          .json({ message: READ_ONLY_MESSAGE });
      }

      schedule.date = key;
    }

    if (startTime !== undefined) {
      schedule.startTime = startTime;
    }

    if (endTime !== undefined) {
      schedule.endTime = endTime || null;
    }

    if (category !== undefined) {
      schedule.category = category || null;
    }

    const updatedSchedule = await schedule.save();

    const populatedSchedule = await Schedule.findById(
      updatedSchedule._id
    ).populate("category");

    res.status(200).json({
      message: "Schedule updated successfully.",
      schedule: populatedSchedule,
    });
  } catch (error) {
    console.error("Update schedule error:", error);

    res.status(500).json({ message: "Unable to update the schedule." });
  }
};

// DELETE SCHEDULE
const deleteSchedule = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    if (isPastDateKey(schedule.date, clientTodayKey(req))) {
      return res.status(403).json({ message: READ_ONLY_MESSAGE });
    }

    await schedule.deleteOne();

    res.status(200).json({ message: "Schedule deleted successfully." });
  } catch (error) {
    console.error("Delete schedule error:", error);

    res.status(500).json({ message: "Unable to delete the schedule." });
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
};

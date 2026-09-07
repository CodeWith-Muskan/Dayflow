const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Calendar date pinned to UTC midnight of the selected day.
    taskDate: {
      type: Date,
      required: true,
    },

    // YYYY-MM-DD local calendar key. Single source of truth for
    // date comparisons and grouping (timezone safe).
    dateKey: {
      type: String,
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Optional category. Can be either a parent category or a subcategory.
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ user: 1, dateKey: 1 });

module.exports = mongoose.model("Task", taskSchema);
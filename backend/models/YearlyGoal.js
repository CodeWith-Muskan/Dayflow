const mongoose = require("mongoose");

const yearlyGoalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      maxlength: 200,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    // Optional month (1-12) the user targets this goal.
    targetMonth: {
      type: Number,
      default: null,
      min: 1,
      max: 12,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

yearlyGoalSchema.index({ user: 1, year: 1 });

module.exports = mongoose.model("YearlyGoal", yearlyGoalSchema);
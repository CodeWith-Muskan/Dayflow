const mongoose = require("mongoose");

const monthlyGoalSchema = new mongoose.Schema(
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

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
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

monthlyGoalSchema.index({ user: 1, year: 1, month: 1 });

module.exports = mongoose.model("MonthlyGoal", monthlyGoalSchema);
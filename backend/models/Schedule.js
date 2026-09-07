const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Schedule title is required"],
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // Date in YYYY-MM-DD format
    date: {
      type: String,
      required: true,
      index: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      default: null,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // Reserved for future Task integration. Always "schedule" for now.
    type: {
      type: String,
      default: "schedule",
    },

    // Optional recurrence rule. Stored once and expanded to concrete
    // dates at query time (see scheduleController). Only present when
    // the schedule repeats; each subfield below defaults itself.
    recurrence: {
      type: {
        type: String,
        enum: ["none", "daily", "weekly", "monthly"],
        default: "none",
      },
      // 0 (Sun) - 6 (Sat), used by weekly recurrence.
      daysOfWeek: {
        type: [Number],
        default: [],
      },
      // YYYY-MM-DD end date (inclusive). A physical upper bound to keep
      // expansion bounded even if the client omits it.
      endDate: {
        type: String,
        default: null,
      },
      _id: false,
    },
  },
  {
    timestamps: true,
  }
);

// Useful for getting a user's schedule for a particular date
scheduleSchema.index({
  user: 1,
  date: 1,
});

// Find by recurrence type when expanding recurring items in queries.
scheduleSchema.index({
  user: 1,
  "recurrence.type": 1,
  date: 1,
});

module.exports = mongoose.model("Schedule", scheduleSchema);
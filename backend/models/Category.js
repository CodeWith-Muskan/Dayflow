const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Top-level categories have parentCategory = null.
    // Subcategories point to a parent category.
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // Theme key from the curated palette:
    // lavender | blue | sage | peach | rose | yellow | aqua
    // The frontend maps each key to day/night specific hex values.
    color: {
      type: String,
      default: "lavender",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
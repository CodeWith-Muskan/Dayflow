const Category = require("../models/Category");
const { isValidObjectId } = require("../utils/validate");

// Curated dreamy palette. Subcategories inherit their parent's key.
const CATEGORY_COLORS = [
  "lavender",
  "blue",
  "sage",
  "peach",
  "rose",
  "yellow",
  "aqua",
];

const pickColorFor = async (userId) => {
  const count = await Category.countDocuments({
    user: userId,
    parentCategory: null,
  });

  return CATEGORY_COLORS[count % CATEGORY_COLORS.length];
};

// GET all categories for the logged-in user.
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      user: req.user._id,
    }).sort({ createdAt: 1 });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      message: "Unable to load categories. Please try again.",
    });
  }
};

// CREATE category or subcategory.
const createCategory = async (req, res) => {
  try {
    const { name, parentCategory } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ message: "Category name is required." });
    }

    let color = null;
    let parent = null;

    if (parentCategory) {
      if (!isValidObjectId(parentCategory)) {
        return res
          .status(400)
          .json({ message: "Invalid parent category." });
      }

      parent = await Category.findOne({
        _id: parentCategory,
        user: req.user._id,
      });

      if (!parent) {
        return res
          .status(404)
          .json({ message: "Parent category not found." });
      }

      // Only one level of nesting is supported.
      if (parent.parentCategory) {
        return res.status(400).json({
          message: "A subcategory cannot contain subcategories.",
        });
      }

      // Subcategories inherit their parent's colour.
      color = parent.color;
    }

    const category = await Category.create({
      name: name.trim(),
      user: req.user._id,
      parentCategory: parentCategory || null,
      color: color || (await pickColorFor(req.user._id)),
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Create category error:", error);

    res.status(500).json({
      message: "Unable to create the category. Please try again.",
    });
  }
};

// UPDATE category (rename only).
const updateCategory = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Category not found." });
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ message: "Category name is required." });
    }

    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    category.name = name.trim();

    const updatedCategory = await category.save();

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error("Update category error:", error);

    res.status(500).json({
      message: "Unable to update the category. Please try again.",
    });
  }
};

// DELETE category. Cascades to its subcategories.
const deleteCategory = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Category not found." });
    }

    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    await Category.deleteMany({
      parentCategory: category._id,
      user: req.user._id,
    });

    await Category.findByIdAndDelete(category._id);

    res.status(200).json({ message: "Category deleted successfully." });
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      message: "Unable to delete the category. Please try again.",
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
import api from "./api";

// Get all categories for the current user.
export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

// Create a category (or subcategory when parentCategory is provided).
export const createCategory = async (categoryData) => {
  const response = await api.post("/categories", categoryData);
  return response.data;
};

// Update/rename a category.
export const updateCategory = async (categoryId, categoryData) => {
  const response = await api.put(`/categories/${categoryId}`, categoryData);
  return response.data;
};

// Delete a category (cascades to its subcategories).
export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/categories/${categoryId}`);
  return response.data;
};

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
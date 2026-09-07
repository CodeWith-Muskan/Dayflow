import api from "./api";

// Get tasks. Optionally filter by a specific date (YYYY-MM-DD).
export const getTasks = async (date) => {
  const params = date ? { date } : {};
  const response = await api.get("/tasks", { params });
  return response.data;
};

// Create a task. Expects { title, date: YYYY-MM-DD, category? }.
export const createTask = async (taskData) => {
  const response = await api.post("/tasks", taskData);
  return response.data;
};

// Update task (title / category).
export const updateTask = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

// Toggle completion.
export const toggleTask = async (taskId) => {
  const response = await api.patch(`/tasks/${taskId}/toggle`, {});
  return response.data;
};

// Delete task.
export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export default {
  getTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
};
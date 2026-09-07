import api from "./api";

export const getMonthlyGoals = async (year, month) => {
  const params = {};
  if (year !== undefined) params.year = year;
  if (month !== undefined) params.month = month;
  const response = await api.get("/goals/monthly", { params });
  return response.data;
};

export const createMonthlyGoal = async (goalData) => {
  const response = await api.post("/goals/monthly", goalData);
  return response.data;
};

export const updateMonthlyGoal = async (goalId, goalData) => {
  const response = await api.put(`/goals/monthly/${goalId}`, goalData);
  return response.data;
};

export const deleteMonthlyGoal = async (goalId) => {
  const response = await api.delete(`/goals/monthly/${goalId}`);
  return response.data;
};

export const getYearlyGoals = async (year, targetMonth) => {
  const params = {};
  if (year !== undefined) params.year = year;
  if (targetMonth !== undefined) params.targetMonth = targetMonth;
  const response = await api.get("/goals/yearly", { params });
  return response.data;
};

export const createYearlyGoal = async (goalData) => {
  const response = await api.post("/goals/yearly", goalData);
  return response.data;
};

export const updateYearlyGoal = async (goalId, goalData) => {
  const response = await api.put(`/goals/yearly/${goalId}`, goalData);
  return response.data;
};

export const deleteYearlyGoal = async (goalId) => {
  const response = await api.delete(`/goals/yearly/${goalId}`);
  return response.data;
};

export default {
  getMonthlyGoals,
  createMonthlyGoal,
  updateMonthlyGoal,
  deleteMonthlyGoal,
  getYearlyGoals,
  createYearlyGoal,
  updateYearlyGoal,
  deleteYearlyGoal,
};
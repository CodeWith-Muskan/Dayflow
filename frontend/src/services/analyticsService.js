import api from "./api";

export const getOverallAnalytics = async () => {
  const response = await api.get("/analytics/overall");
  return response.data;
};

export const getDailyAnalytics = async (date) => {
  const response = await api.get("/analytics/daily", {
    params: { date },
  });
  return response.data;
};

export const getWeeklyAnalytics = async (startDate, endDate) => {
  const response = await api.get("/analytics/weekly", {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getMonthlyAnalytics = async (month) => {
  const response = await api.get("/analytics/monthly", {
    params: { month },
  });
  return response.data;
};

export const getCategoryAnalytics = async () => {
  const response = await api.get("/analytics/categories");
  return response.data;
};

export const getCategoryOverTime = async (startDate, endDate) => {
  const response = await api.get("/analytics/category-over-time", {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getStreaks = async (today) => {
  const params = today ? { today } : {};
  const response = await api.get("/analytics/streaks", { params });
  return response.data;
};

export default {
  getOverallAnalytics,
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getCategoryOverTime,
  getStreaks,
};
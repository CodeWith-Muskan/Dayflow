import api from "./api";

export const getSchedules = async (date) => {
  const params = date ? { date } : {};
  const response = await api.get("/schedules", { params });
  return response.data;
};

export const getSchedulesInRange = async (start, end) => {
  const response = await api.get("/schedules", { params: { start, end } });
  return response.data;
};

export const getScheduleById = async (scheduleId) => {
  const response = await api.get(`/schedules/${scheduleId}`);
  return response.data;
};

export const createSchedule = async (scheduleData) => {
  const response = await api.post("/schedules", scheduleData);
  return response.data;
};

export const updateSchedule = async (scheduleId, scheduleData) => {
  const response = await api.put(`/schedules/${scheduleId}`, scheduleData);
  return response.data;
};

export const deleteSchedule = async (scheduleId) => {
  const response = await api.delete(`/schedules/${scheduleId}`);
  return response.data;
};

export default {
  getSchedules,
  getSchedulesInRange,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
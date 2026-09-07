import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Browser's local calendar date (YYYY-MM-DD) so the backend's
    // historical read-only boundary matches the client's "today".
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    config.headers["x-client-date"] = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

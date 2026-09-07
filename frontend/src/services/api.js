import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Lightweight in-memory cache for GET requests. Reduces the number of round
// trips to the backend (serverless latency) so page navigation feels fast.
const cache = new Map();
const inflight = new Map();
const TTL = 60000; // 60 seconds

const cacheKey = (config) => {
  const params = config.params ? JSON.stringify(config.params) : "";
  const token = localStorage.getItem("token") || "";
  return `${config.method}:${config.url}:${params}:${token}`;
};

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

// Serve GET requests from cache when fresh; otherwise fetch normally.
api.interceptors.request.use((config) => {
  if (config.method.toLowerCase() !== "get") return config;

  const key = cacheKey(config);
  const entry = cache.get(key);

  if (entry && Date.now() - entry.time < TTL) {
    config.adapter = async () => {
      return {
        data: entry.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };
    return config;
  }

  // Deduplicate identical in-flight GETs so concurrent component mounts share
  // a single backend request instead of firing several.
  const pending = inflight.get(key);
  if (pending) {
    config.adapter = () => pending;
    return config;
  }

  // Cache miss + nobody in flight: run the real adapter but record this
  // request's promise so duplicates can piggyback on it.
  const realAdapter = config.adapter;
  config.adapter = (adapterConfig) => {
    const promise = realAdapter(adapterConfig);
    inflight.set(key, promise);
    return promise;
  };

  return config;
});

// Store successful GET responses in the cache; clear it on mutations so
// subsequent reads reflect fresh data.
api.interceptors.response.use((response) => {
  const config = response.config;
  const method = config.method.toLowerCase();

  if (method !== "get") {
    cache.clear();
    inflight.clear();
    return response;
  }

  const key = cacheKey(config);
  if (inflight.has(key)) {
    inflight.delete(key);
  }

  if (response.status >= 200 && response.status < 300) {
    cache.set(key, { data: response.data, time: Date.now() });
  }

  return response;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config;
    if (config && config.method && config.method.toLowerCase() === "get") {
      const key = cacheKey(config);
      inflight.delete(key);
    }
    return Promise.reject(error);
  }
);

export const clearApiCache = () => {
  cache.clear();
};

export default api;

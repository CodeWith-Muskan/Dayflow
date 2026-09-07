import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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

// Lightweight in-memory cache for GET requests. Reduces the number of round
// trips to the backend (serverless latency) so page navigation feels fast.
const cache = new Map();
const inflight = new Map();
const TTL = 60000; // 60 seconds

// The platform default adapter (xhr/http/fetch) resolved once.
const defaultAdapter = axios.getAdapter(axios.defaults.adapter);

const cacheKey = (config) => {
  const params = config.params ? JSON.stringify(config.params) : "";
  const token = (config.headers && (config.headers.Authorization || config.headers.authorization)) || "";
  return `${config.method}:${config.url}:${params}:${token}`;
};

// Custom adapter: serves fresh GETs from cache, deduplicates in-flight GETs,
// and clears the cache on any successful mutation.
const cachingAdapter = (config) => {
  const method = (config.method || "get").toLowerCase();
  const key = cacheKey(config);

  if (method !== "get") {
    return defaultAdapter(config).then((response) => {
      if (response.status >= 200 && response.status < 300) {
        cache.clear();
        inflight.clear();
      }
      return response;
    });
  }

  // Serve a fresh cached response without touching the network.
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < TTL) {
    return Promise.resolve({
      data: entry.data,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      request: {},
    });
  }

  // Deduplicate identical in-flight GETs so concurrent component mounts share
  // a single backend request instead of firing several.
  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }

  const promise = defaultAdapter(config)
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        cache.set(key, { data: response.data, time: Date.now() });
      }
      return response;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
};

api.defaults.adapter = cachingAdapter;

export const clearApiCache = () => {
  cache.clear();
  inflight.clear();
};

export default api;
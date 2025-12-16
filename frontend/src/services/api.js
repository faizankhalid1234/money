import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Add Merchant-ID header globally
api.interceptors.request.use(
  (config) => {
    config.headers["merchant-id"] = "MID_3e6ddfa6-ae52-4a01-bb7c-03765098016d";
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

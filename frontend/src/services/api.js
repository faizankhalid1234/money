import axios from "axios";

// ⚙️ Configurable Merchant ID for this frontend (hidden from user, sent in headers only)
export const MERCHANT_ID = "MID_1765963478012";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach merchant-id header automatically on every request
api.interceptors.request.use(
  (config) => {
    if (MERCHANT_ID) {
      config.headers["merchant-id"] = MERCHANT_ID;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

import axios from "axios";

// ✅ Tumhari company ka merchant_id
export const MERCHANT_ID = "MID_1767429092196";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Har request ke sath merchant-id attach karo
api.interceptors.request.use((config) => {
  // Pehle check localStorage, agar nahi hai to default MERCHANT_ID
  const activeMerchantId = localStorage.getItem("merchantId") || MERCHANT_ID;

  if (activeMerchantId) {
    config.headers["merchant-id"] = activeMerchantId;
  }

  return config;
}, (error) => Promise.reject(error));

export default api;

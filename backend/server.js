// ================== ENV CONFIG ==================
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve("./.env") });

// ================== IMPORTS ==================
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import axios from "axios";

import Payment from "./models/Payment.js";
import Company from "./models/Company.js";
import companyRoutes from "./Routes/companyRoutes.js";
import paymentRoutes from "./Routes/paymentRoutes.js";

// ================== APP INIT ==================
const app = express();
app.use(cors());
app.use(express.json());

// ================== MERCHANT ID ==================
const FIXED_MERCHANT_ID = "MID_3e6ddfa6-ae52-4a01-bb7c-03765098016d";

// ================== MERCHANT-ID MIDDLEWARE ==================
const merchantMiddleware = (req, res, next) => {
  const merchantId = req.headers['merchant-id'];
  if (merchantId !== FIXED_MERCHANT_ID) {
    return res.status(401).json({ status: "error", message: "Invalid Merchant ID" });
  }
  res.locals.merchantVerified = true;
  next();
};

// ================== ROUTES ==================
// ✅ Apply merchantMiddleware only to company + payment routes
app.use("/api/company", merchantMiddleware, companyRoutes);
app.use("/api", merchantMiddleware, paymentRoutes);

// ================== OTP VERIFICATION ==================
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { reference, otp } = req.body;
    const finalStatus = otp === "666666" ? "approved" : "failed";
    await Payment.findOneAndUpdate({ reference }, { status: finalStatus });
    res.json({
      status: finalStatus,
      message: finalStatus === "approved" ? "Payment Successful" : "OTP Invalid",
    });
  } catch {
    res.status(500).json({ status: "error", message: "OTP Verification Failed" });
  }
});

// ================== COUNTRIES / STATES / CITIES ==================
// ✅ No merchant check here
app.get("/api/countries", async (req, res) => {
  try {
    const response = await axios.get("https://countriesnow.space/api/v0.1/countries/positions");
    res.json({
      status: "success",
      data: response.data.data.map((c) => ({ country: c.name })),
    });
  } catch {
    res.status(500).json({ status: "error", message: "Failed to fetch countries" });
  }
});

app.post("/api/states", async (req, res) => {
  try {
    const { country } = req.body;
    if (!country) return res.status(400).json({ status: "error", message: "Country is required" });
    const response = await axios.post("https://countriesnow.space/api/v0.1/countries/states", { country });
    res.json({ status: "success", data: response.data.data.states.map((s) => s.name) });
  } catch {
    res.status(500).json({ status: "error", message: "Failed to fetch states" });
  }
});

app.post("/api/cities", async (req, res) => {
  try {
    const { country, state } = req.body;
    if (!country || !state)
      return res.status(400).json({ status: "error", message: "Country and State are required" });
    const response = await axios.post("https://countriesnow.space/api/v0.1/countries/state/cities", { country, state });
    res.json({ status: "success", data: response.data.data });
  } catch {
    res.status(500).json({ status: "error", message: "Failed to fetch cities" });
  }
});

// ================== GET ORDER BY REFERENCE ==================
app.get("/api/order/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const order = await Payment.findOne({ reference });
    if (!order) return res.status(404).json({ status: "error", message: "Order not found" });
    res.json({ status: "success", data: { amount: order.amount, callback_url: order.callback_url } });
  } catch {
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// ================== MONGODB CONNECTION ==================
mongoose
  .connect(process.env.MONGO_URI, { dbName: "mydb" })
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

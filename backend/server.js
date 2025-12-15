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

// ================== ROUTES ==================
app.use("/api/company", companyRoutes);
app.use("/api", paymentRoutes);

// ================== DEBUG ==================
console.log("ENV PATH:", path.resolve("./.env"));
console.log("PORT =>", process.env.PORT);
console.log("MONGO_URI =>", process.env.MONGO_URI ? "LOADED" : "NOT LOADED");

// ================== MONGODB CONNECTION ==================
mongoose
  .connect(process.env.MONGO_URI, { dbName: "mydb" })
  .then(async () => {
    console.log("✅ MongoDB Connected!");
    // Drop old index if exists
    try {
      await mongoose.connection.db.collection('companies').dropIndex('merchant_id_1');
      console.log('Old merchant_id index dropped');
    } catch (err) {
      console.log('Old index not found or already dropped');
    }
  })
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

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

// ================== COUNTRIES ==================
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

// ================== STATES ==================
app.post("/api/states", async (req, res) => {
  try {
    const { country } = req.body;
    if (!country) return res.status(400).json({ status: "error", message: "Country is required" });

    const response = await axios.post("https://countriesnow.space/api/v0.1/countries/states", { country });
    res.json({
      status: "success",
      data: response.data.data.states.map((s) => s.name),
    });
  } catch {
    res.status(500).json({ status: "error", message: "Failed to fetch states" });
  }
});

// ================== CITIES ==================
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

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

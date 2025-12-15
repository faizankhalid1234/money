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
import companyRoutes from "./Routes/companyRoutes.js";

// ================== APP INIT ==================
const app = express();
app.use(cors());
app.use(express.json());

// ================== ROUTES ==================
app.use("/api/company", companyRoutes);

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

// ================== CONSTANTS ==================
const FIXED_TOKEN = "MY_SECRET_TOKEN";
const ALLOWED_CARDS = [
  "5356222233334444",
  "1122334411223344",
  "5555111122223333",
];
const ALLOWED_CVVS = ["468", "579"];

// ================== HELPERS ==================
const maskCardNumber = (cardNumber) => {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  const last4 = cardNumber.slice(-4);
  return last4.padStart(cardNumber.length, "*");
};

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

// ================== CREATE PAYMENT ==================
app.post("/api/create-payment", async (req, res) => {
  try {
    const { cardNumber, cardCVV, token, ...payload } = req.body;

    const reference = `TXN-${Date.now()}`;
    const orderid = Math.random().toString(36).substring(2) + Date.now();
    const maskedCard = maskCardNumber(cardNumber);

    // CVV check
    if (!ALLOWED_CVVS.includes(cardCVV)) {
      await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
      return res.json({ status: "success", message: "success", data: { reference, orderid, transaction: { status: "failed", message: "Invalid CVV (468 or 579)" } } });
    }

    // Token check
    if (token !== FIXED_TOKEN) {
      await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
      return res.json({ status: "success", message: "success", data: { reference, orderid, transaction: { status: "failed", message: "Invalid Token" } } });
    }

    // Card check
    if (!ALLOWED_CARDS.includes(cardNumber)) {
      await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
      return res.json({ status: "success", message: "success", data: { reference, orderid, transaction: { status: "failed", message: "Invalid Card Number" } } });
    }

    // Transaction status
    let transactionStatus = cardCVV === "579" ? "3d" : "success";
    let transactionMessage = cardCVV === "579" ? "OTP required" : "Transaction Approved";

    await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: transactionStatus });
    res.json({ status: "success", message: "success", data: { reference, orderid, transaction: { status: transactionStatus, message: transactionMessage } } });
  } catch (err) {
    console.log("Payment Error:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// ================== FETCH ALL PAYMENTS ==================
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await Payment.find().populate('companyId').sort({ createdAt: -1 });
    res.json(payments);
  } catch {
    res.status(500).json({ status: "error", message: "Unable to fetch payments" });
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

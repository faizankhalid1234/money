// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import Payment from "./models/Payment.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ------------------ MongoDB Connection ------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err.message));

// ------------------ Fixed Token ------------------
const FIXED_TOKEN = "MY_SECRET_TOKEN";

// ======================================================================
// OTP VERIFICATION
// ======================================================================
app.post("/api/verify-otp", (req, res) => {
  const { otp } = req.body;
  const FIXED_OTP = "666666";

  if (otp === FIXED_OTP) {
    return res.json({ status: "approved", message: "OTP Verified" });
  } else {
    return res.json({ status: "failed", message: "Invalid OTP" });
  }
});

// ======================================================================
// 1) GET ALL COUNTRIES
// ======================================================================
app.get("/api/countries", async (req, res) => {
  try {
    const response = await axios.get(
      "https://countriesnow.space/api/v0.1/countries/positions"
    );

    res.json({
      status: "success",
      data: response.data.data.map((c) => ({
        country: c.name,
      })),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch countries" });
  }
});

// ======================================================================
// 2) GET STATES FOR SELECTED COUNTRY
// ======================================================================
app.post("/api/states", async (req, res) => {
  try {
    const { country } = req.body;

    if (!country)
      return res.status(400).json({ status: "error", message: "Country is required" });

    const response = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/states",
      { country }
    );

    res.json({
      status: "success",
      data: response.data.data.states.map((s) => s.name),
    });
  } catch (error) {
    console.log("State Fetch Error:", error.message);
    res.status(500).json({ status: "error", message: "Failed to fetch states" });
  }
});

// ======================================================================
// 3) GET CITIES FOR SELECTED COUNTRY + STATE
// ======================================================================
app.post("/api/cities", async (req, res) => {
  try {
    const { country, state } = req.body;

    if (!country || !state)
      return res.status(400).json({
        status: "error",
        message: "Country and State are required",
      });

    const response = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/state/cities",
      { country, state }
    );

    res.json({
      status: "success",
      data: response.data.data,
    });
  } catch (error) {
    console.log("Cities Fetch Error:", error.message);
    res.status(500).json({ status: "error", message: "Failed to fetch cities" });
  }
});

// ======================================================================
// PAYMENT ROUTE
// ======================================================================
app.post("/api/create-payment", async (req, res) => {
  try {
    const { cardNumber, token, ...payload } = req.body;

    if (token !== FIXED_TOKEN) {
      return res.status(401).json({ status: "failed", message: "Invalid Token" });
    }

    // Allowed card numbers
    const ALLOWED_CARDS = ["5356222233334444", "1122334411223344"];

    // Card validation
    if (!ALLOWED_CARDS.includes(cardNumber)) {
      return res.status(400).json({ status: "failed", message: "Invalid Card Number" });
    }

    // Mask card number before saving
    const maskedCard = "************" + cardNumber.slice(-4);

    const reference = `TXN-${Date.now()}`;
    const orderid = Math.random().toString(36).substring(2, 15);

    const payment = await Payment.create({
      ...payload,
      cardNumber: maskedCard,
      reference,
      orderid,
      status: "pending",
    });

    res.json({
      status: "success",
      message: "Payment created",
      data: payment,
    });

  } catch (err) {
    console.error("Create Payment Error:", err);
    res.status(500).json({ status: "failed", message: "Server Error" });
  }
});

// ======================================================================
// FETCH ALL PAYMENTS
// ======================================================================
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", message: "Unable to fetch payments" });
  }
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

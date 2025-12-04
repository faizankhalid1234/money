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
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

// ------------------ Fixed Token + Allowed Cards ------------------
const FIXED_TOKEN = "MY_SECRET_TOKEN";
const ALLOWED_CARDS = [
  "5356222233334444",
  "1122334411223344",
  "5555111122223333",
];

// ------------------ MASK CARD NUMBER ------------------
const maskCardNumber = (cardNumber) => {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  const last4 = cardNumber.slice(-4);
  return last4.padStart(cardNumber.length, "*");
};

// ======================================================================
// OTP VERIFICATION
// ======================================================================
app.post("/api/verify-otp", async (req, res) => {
  const { reference, otp } = req.body;
  const finalStatus = otp === "666666" ? "approved" : "failed";
  await Payment.findOneAndUpdate({ reference }, { status: finalStatus });
  res.json({
    status: finalStatus,
    message:
      finalStatus === "approved" ? "Payment Successful" : "OTP Invalid",
  });
});

// ======================================================================
// GET COUNTRIES
// ======================================================================
app.get("/api/countries", async (req, res) => {
  try {
    const response = await axios.get(
      "https://countriesnow.space/api/v0.1/countries/positions"
    );
    res.json({
      status: "success",
      data: response.data.data.map((c) => ({ country: c.name })),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch countries" });
  }
});

// ======================================================================
// GET STATES
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
    res.status(500).json({ status: "error", message: "Failed to fetch states" });
  }
});

// ======================================================================
// GET CITIES
// ======================================================================
app.post("/api/cities", async (req, res) => {
  try {
    const { country, state } = req.body;
    if (!country || !state)
      return res.status(400).json({ status: "error", message: "Country and State are required" });

    const response = await axios.post(
      "https://countriesnow.space/api/v0.1/countries/state/cities",
      { country, state }
    );

    res.json({ status: "success", data: response.data.data });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch cities" });
  }
});

// ======================================================================
// CREATE PAYMENT (2D/3D Logic + Masking)
// ======================================================================
app.post("/api/create-payment", async (req, res) => {
  try {
    const { cardNumber: unmaskedCardNumber, token, cardCVV, ...payload } = req.body;

    const reference = `TXN-${Date.now()}`;
    const orderid = Math.random().toString(36).substring(2) + Date.now();
    const maskedCard = maskCardNumber(unmaskedCardNumber);
    const ALLOWED_CVVS = ["468", "579"];

    if (!ALLOWED_CVVS.includes(cardCVV)) {
      await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
      return res.json({
        status: "success",
        message: "success",
        data: { reference, orderid, transaction: { status: "failed", message: "Invalid CVV. Please use 468 or 579." } },
      });
    }

    if (token !== FIXED_TOKEN) {
      await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
      return res.json({
        status: "success",
        message: "success",
        data: { reference, orderid, transaction: { status: "failed", message: "Invalid Token" } },
      });
    }

    if (!ALLOWED_CARDS.includes(unmaskedCardNumber)) {
      await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
      return res.json({
        status: "success",
        message: "success",
        data: { reference, orderid, transaction: { status: "failed", message: "Invalid Card Number" } },
      });
    }

    let transactionStatus, transactionMessage;
    if (cardCVV === "579") {
      transactionStatus = "3d";
      transactionMessage = "OTP required for transaction validation";
    } else if (cardCVV === "468") {
      transactionStatus = "success";
      transactionMessage = "Transaction Approved";
    }

    await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: transactionStatus });

    return res.json({
      status: "success",
      message: "success",
      data: { reference, orderid, transaction: { status: transactionStatus, message: transactionMessage } },
    });
  } catch (err) {
    console.log("Payment Error:", err);
    const reference = `TXN-${Date.now()}`;
    const orderid = Math.random().toString(36).substring(2) + Date.now();
    return res.status(500).json({
      status: "error",
      message: "Server Error",
      data: { reference, orderid, transaction: { status: "failed", message: "Internal Server Error" } },
    });
  }
});

// ------------------ Frontend Compatibility ------------------
app.post("/api/charge", (req, res) => app.post("/api/create-payment")(req, res));

// ======================================================================
// FETCH ALL PAYMENTS
// ======================================================================
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to fetch payments" });
  }
});

// ======================================================================
// GET ORDER DETAILS BY REFERENCE (NEW API)
// ======================================================================
// GET ORDER DETAILS BY REFERENCE (PATH PARAM)
app.get("/api/order/:reference", async (req, res) => {
  try {
    const reference = req.params.reference;

    const order = await Payment.findOne({ reference });
    if (!order)
      return res.status(404).json({ status: "error", message: "Order not found" });

    return res.json({
      status: "success",
      data: {
        amount: order.amount,
        callback_url: order.callback_url,
      },
    });
  } catch (err) {
    console.log("Fetch Order Error:", err);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});



// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

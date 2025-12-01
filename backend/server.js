// server.js ya backend main file
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Payment from "./models/Payment.js"; // ✅ yaha existing model import karo

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

// ------------------ Payment Route ------------------
app.post("/api/charge", async (req, res) => {
  try {
    const { token, ...payload } = req.body;

    // ✅ Token Check
    if (token !== FIXED_TOKEN) {
      return res.status(401).json({ status: "failed", message: "Invalid Token" });
    }

    const reference = `TXN-${Date.now()}`;

    // ------------------ 2D / 3D Logic ------------------
    let status = "success";
    let message = "Payment Successful!";

    if (payload.cardCVV === "468") {
      status = "success";
      message = "2D Payment Approved!";
    } else if (payload.cardCVV === "579") {
      status = "3D";
      message = "3D Payment Required. Redirect to OTP!";
    } else {
      status = "failed";
      message = "Payment Failed. Invalid CVV!";
    }

    // ✅ Save to DB using existing model
    const payment = new Payment({
      ...payload,
      reference,
      status,
    });

    await payment.save();

    res.json({ status, message, data: { reference } });
  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({ status: "failed", message: "Server Error" });
  }
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

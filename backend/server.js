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

// ================== MAILTRAP EMAIL FUNCTION ==================
const MAILTRAP_URL = "https://sandbox.api.mailtrap.io/api/send/4267784";
const MAILTRAP_TOKEN = "a9d1b7e7c3bb56af18be2b569ff8c642";

const sendEmail = async ({ to, subject, html }) => {
  try {
    const payload = {
      from: { email: "hello@example.com", name: "Mailtrap Test" },
      to: [{ email: to }],
      subject,
      html,
      category: "Integration Test",
    };

    const response = await axios.post(MAILTRAP_URL, payload, {
      headers: {
        Authorization: `Bearer ${MAILTRAP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📧 Email sent successfully!", response.data);
  } catch (err) {
    console.error("❌ Email sending failed:", err.response?.data || err.message);
  }
};

// ================== EMAIL HTML GENERATOR ==================
const generateEmailHTML = (payment) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Template</title>
<style>
body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333333; }
.container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.header { background-color: #4a90e2; color: #ffffff; padding: 20px; text-align: center; }
.header h1 { margin: 0; font-size: 24px; }
.content { padding: 30px 20px; line-height: 1.6; font-size: 16px; }
.button { display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #4a90e2; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; }
.footer { background-color: #f0f0f0; text-align: center; padding: 15px; font-size: 12px; color: #777777; }
@media (max-width: 620px) { .container { width: 90%; margin: 20px auto; } .content { padding: 20px 15px; } }
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>Welcome to SwipePoint!</h1>
</div>
<div class="content">
<p>Hi there,</p>
<p>Thank you for your payment. Your transaction is successful!</p>
<p><b>Reference:</b> ${payment.reference}</p>
<p><b>Amount:</b> Rs ${payment.amount}</p>
<p>Click below to visit your dashboard:</p>
<a href="https://example.com/dashboard" class="button">Go to Dashboard</a>
<p>Cheers,<br>The SwipePoint Team</p>
</div>
<div class="footer">
&copy; 2025 SwipePoint. All rights reserved.
</div>
</div>
</body>
</html>`;
};

// ================== OTP VERIFICATION (3D) ==================
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { reference, otp } = req.body;
    const finalStatus = otp === "666666" ? "approved" : "failed";

    const payment = await Payment.findOneAndUpdate(
      { reference },
      { status: finalStatus },
      { new: true }
    ).populate("companyId");

    if (finalStatus === "approved" && payment?.email) {
      await sendEmail({
        to: payment.email,
        subject: "Welcome to SwipePoint!",
        html: generateEmailHTML(payment),
      });
    }

    res.json({
      status: finalStatus,
      message:
        finalStatus === "approved"
          ? "Payment Successful & Email Sent"
          : "OTP Invalid",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "OTP Verification Failed" });
  }
});

// ================== 2D PAYMENT ROUTE ==================
app.post("/api/payment", async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId).populate("companyId");
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "approved";
    await payment.save();

    if (payment.email) {
      await sendEmail({
        to: payment.email,
        subject: "Payment Successful - SwipePoint",
        html: generateEmailHTML(payment),
      });
    }

    res.json({ status: "success", message: "Payment approved & Email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Payment processing failed" });
  }
});

// ================== GET ORDER BY REFERENCE (for OTP page) ==================
app.get("/api/order/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ reference }).populate("companyId");

    if (!payment) {
      return res.status(404).json({ status: "error", message: "Order not found" });
    }

    res.json({
      status: "success",
      data: {
        amount: payment.amount,
        callback_url: payment.callback_url,
        reference: payment.reference,
        firstname: payment.firstname,
        lastname: payment.lastname,
        email: payment.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to fetch order" });
  }
});

// ================== COUNTRIES / STATES / CITIES ==================
import fetch from "node-fetch";

app.get("/api/countries", async (req, res) => {
  try {
    const response = await fetch("https://countriesnow.space/api/v0.1/countries/positions");
    const data = await response.json();
    res.json({
      status: "success",
      data: data.data.map((c) => ({ country: c.name })),
    });
  } catch {
    res.status(500).json({ status: "error", message: "Failed to fetch countries" });
  }
});

app.post("/api/states", async (req, res) => {
  try {
    const { country } = req.body;
    const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    });
    const data = await response.json();
    res.json({
      status: "success",
      data: data.data.states.map((s) => s.name),
    });
  } catch {
    res.status(500).json({ status: "error", message: "Failed to fetch states" });
  }
});

app.post("/api/cities", async (req, res) => {
  try {
    const { country, state } = req.body;
    const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, state }),
    });
    const data = await response.json();
    res.json({ status: "success", data: data.data });
  } catch {
    res.status(500).json({ status: "error", message: "Failed to fetch cities" });
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

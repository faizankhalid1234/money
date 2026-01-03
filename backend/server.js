// ================== ENV CONFIG ==================
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve("./.env") });

// ================== IMPORTS ==================
import express from "express";
import cors from "cors";
import axios from "axios";
import mongoose from "mongoose";

// DB CONFIG IMPORT
import { DB_TYPE, sequelize } from "./config/db.js";

// MODELS
import PaymentMongo from "./models/PaymentMongo.js";
import CompanyMongo from "./models/CompanyMongo.js";
import PaymentSQL from "./models/PaymentSQL.js";
import CompanySQL from "./models/CompanySQL.js";

// ROUTES
import companyRoutes from "./Routes/companyRoutes.js";
import paymentRoutes from "./Routes/paymentRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// ================== DATABASE CONNECTION ==================
const initDB = async () => {
  try {
    if (DB_TYPE === "mongo") {
      await mongoose.connect(process.env.MONGO_URI, { dbName: "swipepoint" });
      console.log("✅ MongoDB Connected!");
    } else if (DB_TYPE === "sql") {
      if (!sequelize) throw new Error("Sequelize not initialized.");
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      console.log("✅ MySQL Connected!");
    }
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
};

// ================== LOCATION APIs ==================
app.get("/api/countries", async (req, res) => {
  try {
    const response = await axios.get("https://countriesnow.space/api/v0.1/countries/positions");
    res.json({ status: "success", data: response.data.data.map((c) => ({ country: c.name })) });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Countries failed" });
  }
});

app.post("/api/states", async (req, res) => {
  try {
    const { country } = req.body;
    const response = await axios.post("https://countriesnow.space/api/v0.1/countries/states", { country });
    res.json({ status: "success", data: response.data.data?.states?.map((s) => s.name) || [] });
  } catch (err) {
    res.status(500).json({ status: "error", message: "States failed" });
  }
});

app.post("/api/cities", async (req, res) => {
  try {
    const response = await axios.post("https://countriesnow.space/api/v0.1/countries/state/cities", req.body);
    res.json({ status: "success", data: response.data.data || [] });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Cities failed" });
  }
});

// ================== ORDER DETAILS (FOR OTP PAGE) ==================
app.get("/api/order/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    let payment;
    if (DB_TYPE === "mongo") {
      payment = await PaymentMongo.findOne({ reference }).populate("companyId");
    } else if (DB_TYPE === "sql") {
      payment = await PaymentSQL.findOne({ where: { reference }, include: { model: CompanySQL, attributes: ["name"] } });
    }
    if (!payment) return res.status(404).json({ status: "error", message: "Order not found" });
    res.json({ status: "success", data: payment });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ================== OTP VERIFICATION & REDIRECT ==================
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { reference, otp } = req.body;
    console.log(`Verifying OTP for Ref: ${reference}`);

    // OTP Logic (666666 = Success)
    const finalStatus = otp === "666666" ? "approved" : "failed";

    let payment;
    if (DB_TYPE === "mongo") {
      payment = await PaymentMongo.findOneAndUpdate(
        { reference: reference },
        { status: finalStatus },
        { new: true }
      );
    } else if (DB_TYPE === "sql") {
      payment = await PaymentSQL.findOne({ where: { reference: reference } });
      if (payment) {
        payment.status = finalStatus;
        await payment.save();
      }
    }

    if (!payment) {
      return res.status(404).json({ status: "error", message: "Transaction not found" });
    }

    // Response with Redirect URL (Port 5174)
    res.json({
      status: finalStatus,
      message: `Payment ${finalStatus}`,
      // User ko is URL par bhejna hai
      redirectUrl: `http://localhost:5174/payment-status?ref=${reference}&status=${finalStatus}`
    });

  } catch (err) {
    console.error("❌ OTP Error:", err.message);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// ================== REGISTER ROUTES ==================
app.use("/api/company", companyRoutes);
app.use("/api", paymentRoutes);

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});
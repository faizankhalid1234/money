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

// ================== APP INIT ==================
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
      if (!sequelize) throw new Error("Sequelize not initialized. Check your DB_TYPE.");
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      console.log("✅ MySQL Connected!");
    } else {
      throw new Error("Invalid DB_TYPE in .env (must be 'mongo' or 'sql')");
    }
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
};

// ================== EXTERNAL API ROUTES (COUNTRIES, STATES, CITIES) ==================

// 1. Get Countries
app.get("/api/countries", async (req, res) => {
  try {
    const response = await axios.get("https://countriesnow.space/api/v0.1/countries/positions");
    res.json({
      status: "success",
      data: response.data.data.map((c) => ({ country: c.name })),
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Countries fetch failed" });
  }
});

// 2. Get States (POST)
app.post("/api/states", async (req, res) => {
  try {
    const response = await axios.post("https://countriesnow.space/api/v0.1/countries/states", {
      country: req.body.country,
    });
    res.json({
      status: "success",
      data: response.data.data?.states?.map((s) => s.name) || [],
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "States fetch failed" });
  }
});

// 3. Get Cities (POST)
app.post("/api/cities", async (req, res) => {
  try {
    const response = await axios.post("https://countriesnow.space/api/v0.1/countries/state/cities", req.body);
    res.json({
      status: "success",
      data: response.data.data || [],
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Cities fetch failed" });
  }
});

// ================== APP ROUTES ==================
app.use("/api/company", companyRoutes);
app.use("/api", paymentRoutes);

// ================== OTP VERIFICATION ==================
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { reference, otp } = req.body;
    const finalStatus = otp === "666666" ? "approved" : "failed";

    let payment;
    if (DB_TYPE === "mongo") {
      payment = await PaymentMongo.findOneAndUpdate({ reference }, { status: finalStatus }, { new: true }).populate("companyId");
    } else if (DB_TYPE === "sql") {
      payment = await PaymentSQL.findOne({ where: { reference } });
      if (payment) {
        payment.status = finalStatus;
        await payment.save();
      }
    }
    res.json({ status: finalStatus, message: "OTP Processed Successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "OTP Verification Failed" });
  }
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});

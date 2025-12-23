// ================== PAYMENT ROUTES ==================
import express from "express";
import Payment from "../models/Payment.js";
import { createPayment } from "../Controllers/paymentController.js";

const router = express.Router();

// ================== MIDDLEWARE ==================
// Merchant-ID check middleware
const checkMerchant = async (req, res, next) => {
  const merchantId = req.headers["merchant-id"];
  if (!merchantId) {
    return res.status(400).json({ status: "error", message: "Merchant ID missing in header" });
  }

  req.merchantId = merchantId;
  next();
};

// ================== CREATE PAYMENT ==================
router.post("/create-payment", checkMerchant, createPayment);

// ================== GET PAYMENTS BY MERCHANT-ID ==================
router.get("/payments", checkMerchant, async (req, res) => {
  try {
    const payments = await Payment.find({ merchant_id: req.merchantId }).populate("companyId", "name");
    res.json({ status: "success", data: payments });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ================== DELETE PAYMENT ==================
router.delete("/payments/:id", checkMerchant, async (req, res) => {
  try {
    const result = await Payment.deleteOne({ _id: req.params.id, merchant_id: req.merchantId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ status: "error", message: "Payment not found or invalid merchant" });
    }
    res.json({ status: "success", message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;

// ================== PAYMENT ROUTES ==================
import express from "express";
import Payment from "../models/Payment.js";
import { createPayment } from "../Controllers/paymentController.js";

const router = express.Router();

// CREATE PAYMENT (uses controller with 2D/3D logic)
router.post("/create-payment", createPayment);

// GET PAYMENTS BY MERCHANT-ID
router.get("/payments", async (req, res) => {
  try {
    const merchantId = req.headers["merchant-id"];
    const payments = await Payment.find({ merchant_id: merchantId }).populate("companyId");
    res.json(payments);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// DELETE PAYMENT
router.delete("/payments/:id", async (req, res) => {
  try {
    const merchantId = req.headers["merchant-id"];
    await Payment.deleteOne({ _id: req.params.id, merchant_id: merchantId });
    res.json({ status: "success", message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;

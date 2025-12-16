// ================== PAYMENT ROUTES ==================
import express from "express";
import Payment from "../models/Payment.js";

const router = express.Router();

// CREATE PAYMENT
router.post("/create-payment", async (req, res) => {
    try {
        const { merchant_id, ...rest } = req.body;

        // ✅ Use the fixed merchant-id
        const payment = new Payment({
            ...rest,
            merchant_id: "MID_3e6ddfa6-ae52-4a01-bb7c-03765098016d",
            status: "pending",
            reference: "TXN-" + Date.now(),
        });

        await payment.save();

        res.json({
            status: "success",
            data: {
                reference: payment.reference,
                transaction: { status: payment.status, message: "Payment Pending / 3D Secure" },
                merchant_verified: true,
            },
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

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

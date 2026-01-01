import express from "express";
import { DB_TYPE } from "../config/db.js";
import PaymentSQL from "../models/PaymentSQL.js";
import CompanySQL from "../models/CompanySQL.js";
import PaymentMongo from "../models/PaymentMongo.js";
import CompanyMongo from "../models/CompanyMongo.js";
import { createPayment } from "../controllers/paymentController.js";

const router = express.Router();

// ================== MIDDLEWARE ==================
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
    let payments;

    if (DB_TYPE === "sql") {
      payments = await PaymentSQL.findAll({
        where: { merchant_id: req.merchantId },
        include: { model: CompanySQL, attributes: ["name"] },
        order: [["createdAt", "DESC"]],
      });
    } else if (DB_TYPE === "mongo") {
      payments = await PaymentMongo.find({ merchant_id: req.merchantId })
        .populate("companyId", "name")
        .sort({ createdAt: -1 });
    }

    res.json({ status: "success", data: payments });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ================== DELETE PAYMENT ==================
router.delete("/payments/:id", checkMerchant, async (req, res) => {
  try {
    let result;

    if (DB_TYPE === "sql") {
      result = await PaymentSQL.destroy({
        where: { id: req.params.id, merchant_id: req.merchantId },
      });
      if (result === 0)
        return res.status(404).json({ status: "error", message: "Payment not found or invalid merchant" });
    } else if (DB_TYPE === "mongo") {
      result = await PaymentMongo.deleteOne({ _id: req.params.id, merchant_id: req.merchantId });
      if (result.deletedCount === 0)
        return res.status(404).json({ status: "error", message: "Payment not found or invalid merchant" });
    }

    res.json({ status: "success", message: "Payment deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;

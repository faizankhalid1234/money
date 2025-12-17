import Payment from "../models/Payment.js";
import Company from "../models/Company.js";
import { generateReference } from "../utils/generateRef.js";

// --------- MASK CARD NUMBER FUNCTION ---------
const maskCardNumber = (cardNumber) => {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  const last4 = cardNumber.slice(-4);
  return last4.padStart(cardNumber.length, "*");
};

// Constants
const FIXED_TOKEN = "MY_SECRET_TOKEN";
const ALLOWED_CARDS = [
  "5356222233334444",
  "1122334411223344",
  "5555111122223333",
];
const ALLOWED_CVVS = ["468", "579"];

// CREATE PAYMENT
export const createPayment = async (req, res) => {
  try {
    const merchantIdFromBody = req.body.merchant_id;
    const merchantIdFromHeader = req.headers["merchant-id"];
    const merchant_id = (merchantIdFromBody || merchantIdFromHeader || "").trim();
    const { cardNumber, cardCVV, companyId, ...payload } = req.body;

    const reference = `TXN-${Date.now()}`;
    const orderid = Math.random().toString(36).substring(2) + Date.now();
    const maskedCard = maskCardNumber(cardNumber);

    // Merchant / Company check via merchant_id OR fallback companyId
    let company = null;

    // Try merchant_id first (preferred)
    if (merchant_id) {
      company = await Company.findOne({ merchant_id });
    }

    // Fallback: if merchant_id missing or not found, and companyId provided, try by _id
    if (!company && companyId) {
      company = await Company.findById(companyId);
    }

    // Still not found -> fail
    if (!company) {
      await Payment.create({
        ...payload,
        cardNumber: maskedCard,
        cardCVV,
        reference,
        orderid,
        status: "failed",
        merchant_id,
      });
      return res.json({
        status: "success",
        message: "success",
        data: {
          reference,
          orderid,
          transaction: { status: "failed", message: "Invalid Merchant ID / Company not found" },
          merchant_verified: false,
        },
      });
    }

    // CVV check
    if (!ALLOWED_CVVS.includes(cardCVV)) {
      await Payment.create({
        ...payload,
        cardNumber: maskedCard,
        cardCVV,
        reference,
        orderid,
        status: "failed",
        merchant_id,
        companyId: company._id,
      });
      return res.json({
        status: "success",
        message: "success",
        data: {
          reference,
          orderid,
          transaction: { status: "failed", message: "Invalid CVV (468 or 579)" },
          merchant_verified: true,
        },
      });
    }

    // Card check
    if (!ALLOWED_CARDS.includes(cardNumber)) {
      await Payment.create({
        ...payload,
        cardNumber: maskedCard,
        cardCVV,
        reference,
        orderid,
        status: "failed",
        merchant_id,
        companyId: company._id,
      });
      return res.json({
        status: "success",
        message: "success",
        data: {
          reference,
          orderid,
          transaction: { status: "failed", message: "Invalid Card Number" },
          merchant_verified: true,
        },
      });
    }

    // Transaction status
    let transactionStatus = cardCVV === "579" ? "pending" : "success";
    let transactionMessage = cardCVV === "579" ? "OTP required" : "Transaction Approved";

    await Payment.create({
      ...payload,
      cardNumber: maskedCard,
      cardCVV,
      reference,
      orderid,
      status: transactionStatus,
      merchant_id,
      companyId: company._id,
    });
    res.json({
      status: "success",
      message: "success",
      data: {
        reference,
        orderid,
        transaction: { status: transactionStatus, message: transactionMessage },
        merchant_verified: true,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// GET ALL PAYMENTS
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('companyId', 'name');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// UPDATE PAYMENT STATUS
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    await Payment.findByIdAndUpdate(id, { status });
    res.json({ status: "success", message: "Status updated" });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// DELETE PAYMENT
export const deletePayment = async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ status: "success", message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

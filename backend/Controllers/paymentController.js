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
    const { cardNumber, cardCVV, token, ...payload } = req.body;

    const reference = `TXN-${Date.now()}`;
    const orderid = Math.random().toString(36).substring(2) + Date.now();
    const maskedCard = maskCardNumber(cardNumber);

    // CVV check
    if (!ALLOWED_CVVS.includes(cardCVV)) {
      await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
      return res.json({ status: "success", message: "success", data: { reference, orderid, transaction: { status: "failed", message: "Invalid CVV (468 or 579)" } } });
    }

    // Token check
    if (payload.companyId) {
      const company = await Company.findById(payload.companyId);
      if (!company || token !== company.merchant_id) {
        await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
        return res.json({ status: "success", message: "success", data: { reference, orderid, transaction: { status: "failed", message: "Invalid Token" } } });
      }
    } else {
      if (token !== FIXED_TOKEN) {
        await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
        return res.json({ status: "success", message: "success", data: { reference, orderid, transaction: { status: "failed", message: "Invalid Token" } } });
      }
    }

    // Card check
    if (!ALLOWED_CARDS.includes(cardNumber)) {
      await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: "failed" });
      return res.json({ status: "success", message: "success", data: { reference, orderid, transaction: { status: "failed", message: "Invalid Card Number" } } });
    }

    // Transaction status
    let transactionStatus = cardCVV === "579" ? "pending" : "success";
    let transactionMessage = cardCVV === "579" ? "OTP required" : "Transaction Approved";

    await Payment.create({ ...payload, cardNumber: maskedCard, cardCVV, reference, orderid, status: transactionStatus });
    res.json({ status: "success", message: "success", data: { reference, orderid, transaction: { status: transactionStatus, message: transactionMessage } } });
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

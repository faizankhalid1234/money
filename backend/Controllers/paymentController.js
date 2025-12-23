import Payment from "../models/Payment.js";
import Company from "../models/Company.js";
import axios from "axios";

/* ========== Helpers ========== */
const maskCardNumber = (num) => num ? "************" + num.slice(-4) : "-";
const calculateFee = (amount, feePercentage) => Number(((amount * feePercentage)/100).toFixed(2));
const ALLOWED_CARDS = ["5356222233334444", "1122334411223344", "5555111122223333"];
const ALLOWED_CVVS = ["468","579"];

/* ========== CREATE PAYMENT ========== */
export const createPayment = async (req, res) => {
  try {
    const merchant_id = req.headers["merchant-id"];
    const { cardNumber, cardCVV, feePercentage=10, ...payload } = req.body;

    // ✅ Company lookup
    const company = await Company.findOne({ merchant_id });
    if (!company) {
      return res.json({
        status:"success",
        data:{
          reference: `TXN-${Date.now()}`,
          orderid: Math.random().toString(36).substring(2)+Date.now(),
          transaction:{status:"failed", message:"Invalid Company"}
        }
      });
    }

    // Card validation
    if (!ALLOWED_CVVS.includes(cardCVV)) return res.json({ status:"success", data:{ transaction:{status:"failed", message:"Invalid CVV"}}});
    if (!ALLOWED_CARDS.includes(cardNumber)) return res.json({ status:"success", data:{ transaction:{status:"failed", message:"Invalid Card"}}});

    const is3D = cardCVV==="579";
    const reference = `TXN-${Date.now()}`;
    const orderid = Math.random().toString(36).substring(2)+Date.now();
    const fee = calculateFee(payload.amount, feePercentage);
    const netAmount = payload.amount - fee;

    const payment = await Payment.create({
      ...payload,
      cardNumber: maskCardNumber(cardNumber),
      cardCVV,
      reference,
      orderid,
      status: is3D ? "pending":"success",
      merchant_id: company.merchant_id,
      companyId: company._id,
      fee,
      feePercentage,
      netAmount
    });

    res.json({
      status:"success",
      data:{
        reference,
        orderid,
        amount: payment.amount,
        fee: payment.fee,
        feePercentage: payment.feePercentage,
        netAmount: payment.netAmount,
        transaction:{ status: is3D?"pending":"success", message: is3D?"OTP required":"Transaction Approved" }
      }
    });

  } catch(err) {
    console.error(err);
    res.status(500).json({ status:"error", message: err.message });
  }
};

/* ================= GET ALL PAYMENTS ================= */
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("companyId", "name")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* ================= GET COMPANY PAYMENTS ================= */
export const getCompanyPayments = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const payments = await Payment.find({ merchant_id: company.merchant_id })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* ================= UPDATE STATUS ================= */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    await Payment.findByIdAndUpdate(id, { status });
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* ================= DELETE PAYMENT ================= */
export const deletePayment = async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

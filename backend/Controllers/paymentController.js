import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { DB_TYPE } from "../config/db.js";

// Models
import PaymentSQL from "../models/PaymentSQL.js";
import CompanySQL from "../models/CompanySQL.js";
import PaymentMongo from "../models/PaymentMongo.js";
import CompanyMongo from "../models/CompanyMongo.js";

/* ========== Helpers ========== */
const maskCardNumber = (num) => (num ? "************" + num.slice(-4) : "-");
const calculateFee = (amount, feePercentage) => Number(((amount * feePercentage) / 100).toFixed(2));
const ALLOWED_CARDS = ["5356222233334444", "1122334411223344", "5555111122223333"];
const ALLOWED_CVVS = ["468", "579"];

/* ================= CREATE PAYMENT ================= */
export const createPayment = async (req, res) => {
  try {
    const merchant_id = req.headers["merchant-id"];
    const { cardNumber, cardCVV, feePercentage = 10, ...payload } = req.body;

    let company;
    if (DB_TYPE === "sql") {
      company = await CompanySQL.findOne({ where: { merchant_id } });
    } else if (DB_TYPE === "mongo") {
      company = await CompanyMongo.findOne({ merchant_id });
    }

    if (!company) {
      return res.json({
        status: "success",
        data: {
          reference: `TXN-${Date.now()}`,
          orderid: Math.random().toString(36).substring(2) + Date.now(),
          transaction: { status: "failed", message: "Invalid Company" },
        },
      });
    }

    if (!ALLOWED_CVVS.includes(cardCVV))
      return res.json({ status: "success", data: { transaction: { status: "failed", message: "Invalid CVV" } } });

    if (!ALLOWED_CARDS.includes(cardNumber))
      return res.json({ status: "success", data: { transaction: { status: "failed", message: "Invalid Card" } } });

    const is3D = cardCVV === "579";
    const reference = `TXN-${Date.now()}`;
    const orderid = Math.random().toString(36).substring(2) + Date.now();
    const fee = calculateFee(payload.amount, feePercentage);
    const netAmount = payload.amount - fee;

    let payment;
    if (DB_TYPE === "sql") {
      payment = await PaymentSQL.create({
        ...payload,
        cardNumber: maskCardNumber(cardNumber),
        cardCVV,
        reference,
        orderid,
        status: is3D ? "pending" : "success",
        merchant_id: company.merchant_id,
        companyId: company.id,
        fee,
        feePercentage,
        netAmount,
      });
    } else if (DB_TYPE === "mongo") {
      payment = await PaymentMongo.create({
        ...payload,
        cardNumber: maskCardNumber(cardNumber),
        cardCVV,
        reference,
        orderid,
        status: is3D ? "pending" : "success",
        merchant_id: company.merchant_id,
        companyId: company._id,
        fee,
        feePercentage,
        netAmount,
      });
    }

    res.json({
      status: "success",
      data: {
        reference,
        orderid,
        amount: payment.amount || payload.amount,
        fee,
        feePercentage,
        netAmount,
        transaction: { status: is3D ? "pending" : "success", message: is3D ? "OTP required" : "Transaction Approved" },
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* ================= GET ALL PAYMENTS ================= */
export const getAllPayments = async (req, res) => {
  try {
    let payments;
    if (DB_TYPE === "sql") {
      payments = await PaymentSQL.findAll({
        include: { model: CompanySQL, attributes: ["name"] },
        order: [["createdAt", "DESC"]],
      });
    } else if (DB_TYPE === "mongo") {
      payments = await PaymentMongo.find().populate("companyId", "name").sort({ createdAt: -1 });
    }
    res.json({ status: "success", data: payments });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* ================= GET COMPANY PAYMENTS ================= */
export const getCompanyPayments = async (req, res) => {
  try {
    const { companyId } = req.params;
    let company;
    if (DB_TYPE === "sql") company = await CompanySQL.findByPk(companyId);
    else if (DB_TYPE === "mongo") company = await CompanyMongo.findById(companyId);

    if (!company) return res.status(404).json({ message: "Company not found" });

    let payments;
    if (DB_TYPE === "sql") {
      payments = await PaymentSQL.findAll({
        where: { merchant_id: company.merchant_id },
        order: [["createdAt", "DESC"]],
      });
    } else if (DB_TYPE === "mongo") {
      payments = await PaymentMongo.find({ merchant_id: company.merchant_id }).sort({ createdAt: -1 });
    }

    res.json({ status: "success", data: payments });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* ================= UPDATE STATUS ================= */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (DB_TYPE === "sql") await PaymentSQL.update({ status }, { where: { id } });
    else if (DB_TYPE === "mongo") await PaymentMongo.findByIdAndUpdate(id, { status });

    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

/* ================= DELETE PAYMENT ================= */
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted;
    if (DB_TYPE === "sql") deleted = await PaymentSQL.destroy({ where: { id } });
    else if (DB_TYPE === "mongo") deleted = await PaymentMongo.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ status: "error", message: "Payment not found" });
    res.json({ status: "success", message: "Payment deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

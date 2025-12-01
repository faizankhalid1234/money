import Payment from "../models/Payment.js";
import { generateReference } from "../utils/generateRef.js";

// CREATE PAYMENT
export const createPayment = async (req, res) => {
  try {
    const reference = generateReference();

    const payment = await Payment.create({
      ...req.body,
      reference,
      status: "pending"
    });

    res.json({
      status: "success",
      message: "Payment created",
      data: payment
    });

  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// UPDATE PAYMENT STATUS
export const updatePaymentStatus = async (req, res) => {
  try {
    const { reference, status } = req.body;

    const payment = await Payment.findOneAndUpdate(
      { reference },
      { status },
      { new: true }
    );

    res.json({
      status: "success",
      message: "Payment updated",
      data: payment
    });

  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// GET ORDER HISTORY
export const getAllPayments = async (req, res) => {
  const all = await Payment.find().sort({ createdAt: -1 });
  res.json(all);
};

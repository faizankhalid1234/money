import Payment from "../models/Payment.js";
import { generateReference } from "../utils/generateRef.js";

// --------- MASK CARD NUMBER FUNCTION ---------
const maskCardNumber = (cardNumber) => {
  if (!cardNumber) return "";
  const last4 = cardNumber.slice(-4);
  return last4.padStart(cardNumber.length, "*"); 
};

// Allowed card numbers
const ALLOWED_CARDS = ["5356222233334444", "1122334411223344"];

// CREATE PAYMENT
export const createPayment = async (req, res) => {
  try {
    const { cardNumber } = req.body;

    // ---------- CHECK ALLOWED CARD ----------
    if (!ALLOWED_CARDS.includes(cardNumber)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid Card Number. Transaction declined.",
      });
    }

    // ---------- CONTINUE PAYMENT ----------
    const reference = generateReference();
    const maskedCardNumber = maskCardNumber(cardNumber);

    const payment = await Payment.create({
      ...req.body,
      cardNumber: maskedCardNumber,
      reference,
      status: "approved", // Sirf allowed card number hone par approved
    });

    res.json({
      status: "success",
      message: "Transaction approved",
      data: payment,
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

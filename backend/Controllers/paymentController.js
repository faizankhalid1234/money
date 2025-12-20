import Payment from "../models/Payment.js";
import Company from "../models/Company.js";
import axios from "axios";

// ================== MAILTRAP CONFIG ==================
const MAILTRAP_URL = "https://sandbox.api.mailtrap.io/api/send/4267784";
const MAILTRAP_TOKEN = "a9d1b7e7c3bb56af18be2b569ff8c642";

const sendEmail = async ({ to, subject, html }) => {
  try {
    await axios.post(
      MAILTRAP_URL,
      {
        from: { email: "hello@example.com", name: "SwipePoint" },
        to: [{ email: to }],
        subject,
        html,
        category: "Payment",
      },
      {
        headers: {
          Authorization: `Bearer ${MAILTRAP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("📧 Email sent to:", to);
  } catch (err) {
    console.error("❌ Email failed:", err.response?.data || err.message);
  }
};

// ================== EMAIL TEMPLATE ==================
const generateEmailHTML = (payment) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial">
  <h2>Payment Successful 🎉</h2>
  <p><b>Reference:</b> ${payment.reference}</p>
  <p><b>Amount:</b> ${payment.amount}</p>
  <p>Thank you for using SwipePoint.</p>
</body>
</html>
`;

// ================== HELPERS ==================
const maskCardNumber = (cardNumber) => {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  return "************" + cardNumber.slice(-4);
};

// ================== CONSTANTS ==================
const ALLOWED_CARDS = [
  "5356222233334444",
  "1122334411223344",
  "5555111122223333",
];

const ALLOWED_CVVS = ["468", "579"];

// ================== CREATE PAYMENT ==================
export const createPayment = async (req, res) => {
  try {
    const merchant_id =
      req.body.merchant_id || req.headers["merchant-id"];

    const { cardNumber, cardCVV, companyId, ...payload } = req.body;

    const reference = `TXN-${Date.now()}`;
    const orderid = Math.random().toString(36).substring(2) + Date.now();
    const maskedCard = maskCardNumber(cardNumber);

    // ================== FIND COMPANY ==================
    let company = null;

    if (merchant_id) {
      company = await Company.findOne({ merchant_id });
    }

    if (!company && companyId) {
      company = await Company.findById(companyId);
    }

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
        data: {
          reference,
          orderid,
          transaction: {
            status: "failed",
            message: "Invalid Merchant",
          },
        },
      });
    }

    // ================== VALIDATION ==================
    if (!ALLOWED_CVVS.includes(cardCVV)) {
      return res.json({
        status: "success",
        data: {
          transaction: {
            status: "failed",
            message: "Invalid CVV (468 or 579)",
          },
        },
      });
    }

    if (!ALLOWED_CARDS.includes(cardNumber)) {
      return res.json({
        status: "success",
        data: {
          transaction: {
            status: "failed",
            message: "Invalid Card",
          },
        },
      });
    }

    // ================== TRANSACTION LOGIC ==================
    const is3D = cardCVV === "579";
    const transactionStatus = is3D ? "pending" : "success";

    const payment = await Payment.create({
      ...payload,
      cardNumber: maskedCard,
      cardCVV,
      reference,
      orderid,
      status: transactionStatus,
      merchant_id,
      companyId: company._id,
    });

    // ================== ✅ 2D EMAIL ==================
    if (!is3D && payload.email) {
      await sendEmail({
        to: payload.email,
        subject: "Payment Successful - SwipePoint",
        html: generateEmailHTML(payment),
      });
    }

    return res.json({
      status: "success",
      data: {
        reference,
        orderid,
        transaction: {
          status: transactionStatus,
          message: is3D ? "OTP required" : "Transaction Approved",
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ================== GET ALL PAYMENTS ==================
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("companyId", "name");
    res.json(payments);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ================== UPDATE PAYMENT ==================
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    await Payment.findByIdAndUpdate(id, { status });
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ================== DELETE PAYMENT ==================
export const deletePayment = async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

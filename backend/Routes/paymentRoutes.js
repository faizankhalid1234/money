import express from "express";
import { createPayment, updatePaymentStatus, getAllPayments, deletePayment } from "../Controllers/paymentController.js";

const router = express.Router();

router.post("/create-payment", createPayment);
router.post("/update-status", updatePaymentStatus);
router.get("/payments", getAllPayments);
router.delete("/payments/:id", deletePayment);

export default router;

import express from "express";
import { createPayment, updatePaymentStatus, getAllPayments } from "../Controllers/paymentController.js";

const router = express.Router();

router.post("/create-payment", createPayment);
router.post("/update-status", updatePaymentStatus);
router.get("/orders", getAllPayments);

export default router;

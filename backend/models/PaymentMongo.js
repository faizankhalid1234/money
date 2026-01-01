import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    merchant_id: { type: String, required: true },
    firstname: String,
    lastname: String,
    email: String,
    amount: Number,
    fee: Number,
    feePercentage: Number,
    netAmount: Number,
    cardNumber: String,
    cardCVV: String,
    reference: String,
    orderid: String,
    status: String,
}, { timestamps: true });

export default mongoose.model("Payment", PaymentSchema);

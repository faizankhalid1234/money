import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  reference: String,
  amount: Number,
  currency: String,
  firstname: String,
  lastname: String,
  email: String,
  phone: String,
  status: {
    type: String,
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("Payment", PaymentSchema);

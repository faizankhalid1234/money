import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    reference: String,
    orderid: String,

    amount: Number,
    currency: String,

    firstname: String,
    lastname: String,
    email: String,
    phone: String,

    // Card Details
    cardName: String,
    cardNumber: String,
    cardCVV: String,
    expMonth: String,
    expYear: String,

    // Billing Details
    country: String,
    city: String,
    address: String,
    zip_code: String,
    state: String,

    // Other
    ip_address: String,
    callback_url: String,
    webhook_url: String,

    status: String,
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);

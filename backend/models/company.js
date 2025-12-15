import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    merchant_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

companySchema.index({ merchant_id: 1 }, { unique: true, sparse: true });

export default mongoose.model("Company", companySchema);

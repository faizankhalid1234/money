import express from "express";
import Company from "../models/Company.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const companies = await Company.find();
  res.json(companies);
});

export default router;

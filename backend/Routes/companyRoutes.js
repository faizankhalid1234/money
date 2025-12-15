import express from "express";
import Company from "../models/Company.js";
import crypto from "crypto";

const router = express.Router();

// CREATE COMPANY
router.post("/", async (req, res) => {
  try {
    const company = new Company({
      name: req.body.name,
      email: req.body.email,
      merchant_id: "MID_" + crypto.randomUUID(), // ✅ AUTO GENERATE
    });

    await company.save();
    res.json(company);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET ALL COMPANIES
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET COMPANY BY ID
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    res.json(company);
  } catch (err) {
    res.status(404).json({ message: "Company not found" });
  }
});

// UPDATE COMPANY
router.put("/:id", async (req, res) => {
  await Company.findByIdAndUpdate(req.params.id, {
    name: req.body.name,
    email: req.body.email,
  });
  res.json({ message: "Updated" });
});

// DELETE COMPANY
router.delete("/:id", async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;

import express from "express";
import Company from "../models/CompanyMongo.js";

const router = express.Router();

// GET ALL COMPANIES
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// GET COMPANY BY ID
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ status: "error", message: "Company not found" });
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// CREATE COMPANY
router.post("/", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ status: "error", message: "Name and email are required" });
    }
    const company = new Company({ name, email, merchant_id: `MID_${Date.now()}` });
    await company.save();
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// UPDATE COMPANY
router.put("/:id", async (req, res) => {
  try {
    const { name, email } = req.body;
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ status: "error", message: "Company not found" });
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// DELETE COMPANY
router.delete("/:id", async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ status: "error", message: "Company not found" });
    }
    res.json({ status: "success", message: "Company deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;

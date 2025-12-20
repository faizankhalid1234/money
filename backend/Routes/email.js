import express from "express";
import { sendEmail } from "../services/emailService.js";
import { emailTemplate } from "../templates/emailTemplate.js";

const router = express.Router();

router.post("/send-email", async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  try {
    const verifyLink = `http://localhost:5173/verify?email=${email}`;

    await sendEmail(
      email,
      "Verify your SwipePoint account",
      emailTemplate(name || "User", verifyLink)
    );

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Email failed" });
  }
});

export default router;

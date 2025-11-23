import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function App() {
  // ------------------ Dynamic callback URL ------------------
  const callbackUrl =
       `${window.location.origin}/verify`
  console.log("Callback URL:", callbackUrl); // ✅ See in console

  // ------------------ Form state ------------------
  const [form, setForm] = useState({
    amount: "",
    currency: "USD",
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    cardName: "",
    cardNumber: "",
    cardCVV: "", // 468=2D, 579=3D
    expMonth: "",
    expYear: "",
    country: "",
    city: "",
    address: "",
    zip_code: "",
    state: "",
    ip_address: "51.159.226.150",
    callback_url: callbackUrl, // ✅ Use the dynamic URL here
    webhook_url: "https://webhook-test.com/callback",
  });

  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateForm = () => {
    const requiredFields = [
      "amount", "firstname", "lastname", "email", "phone",
      "cardName", "cardNumber", "cardCVV", "expMonth", "expYear",
      "country", "city", "address", "zip_code", "state"
    ];
    for (let field of requiredFields) {
      if (!form[field]) {
        Swal.fire({ icon: "warning", title: "Missing Field", text: `${field} is required!` });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setBackendError("");

    const uniqueRef = `TXN-${Date.now()}`;
    const payload = { ...form, reference: uniqueRef };

    try {
      const res = await axios.post(
        "https://sandbox.swipepointe.com/api/charge",
        payload,
        {
          headers: { "Content-Type": "application/json", Authorization: "Bearer f29ace81cb2af74c" },
        }
      );

      const { status, message, data } = res.data;

      if (status !== "success" || (data && /invalid|missing/i.test(JSON.stringify(data)))) {
        setBackendError(data || message || "Payment failed");
        Swal.fire({ icon: "error", title: "Payment Error", text: data || message || "Payment failed", confirmButtonColor: "#E53935" });
        setLoading(false);
        return;
      }

      // 2D Payment
      if (form.cardCVV === "468") {
        Swal.fire({ icon: "success", title: "Transaction Approved", text: message || "2D Payment Successful!", confirmButtonColor: "#4CAF50" });
      }

      // 3D Payment
      if (form.cardCVV === "579" && data?.link) {
        const cleanUrl = data.link.replace(/\\/g, "");
        window.location.href = cleanUrl; // redirect to OTP page
      }

    } catch (err) {
      const errorMsg = err.response?.data?.message || (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : null) || err.message;
      setBackendError(errorMsg);
      Swal.fire({ icon: "error", title: "Payment Error", text: errorMsg, confirmButtonColor: "#E53935" });
    }

    setLoading(false);
  };

  const inputStyle = { width: "100%", padding: "14px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #d0d0d0", fontSize: "15px", background: "#f9fafb" };

  return (
    <div style={{ maxWidth: "650px", margin: "50px auto", padding: "30px", background: "#fff", borderRadius: "16px", boxShadow: "0px 10px 35px rgba(0,0,0,0.15)" }}>
      <h2 style={{ textAlign: "center", marginBottom: "25px", background: "#4CAF50", color: "#fff", padding: "15px", borderRadius: "10px", fontSize: "22px" }}>Secure Payment Form (2D / 3D)</h2>

      {backendError && <div style={{ marginBottom: "20px", padding: "12px", borderRadius: "8px", background: "#ffe5e5", color: "#d32f2f", fontWeight: "bold" }}>{backendError}</div>}

      <form onSubmit={handleSubmit}>
        {Object.keys(form)
          .filter(field => !["callback_url", "webhook_url", "ip_address", "reference", "currency"].includes(field))
          .map((field, i) => <input key={i} name={field} placeholder={field} style={inputStyle} value={form[field]} onChange={handleChange} />)}

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#7ab5ec" : "#4a90e2", color: "#fff", border: "none", borderRadius: "10px", fontSize: "18px", cursor: "pointer" }}>
          {loading ? "Processing..." : "Submit Payment"}
        </button>
      </form>
    </div>
  );
}

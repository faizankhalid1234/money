import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function App() {
  const callbackUrl = `${window.location.origin}/checkpayment`;

  const [form, setForm] = useState({
    amount: "",
    currency: "USD",
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    cardName: "",
    cardNumber: "",
    cardCVV: "",
    expMonth: "",
    expYear: "",
    country: "",
    city: "",
    address: "",
    zip_code: "",
    state: "",
    ip_address: "51.159.226.150",
    callback_url: callbackUrl,
    webhook_url: "https://webhook-test.com/callback",
  });

  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validateForm = () => {
    const requiredFields = [
      "amount",
      "firstname",
      "lastname",
      "email",
      "phone",
      "cardName",
      "cardNumber",
      "cardCVV",
      "expMonth",
      "expYear",
      "country",
      "city",
      "address",
      "zip_code",
      "state",
    ];

    for (let field of requiredFields) {
      if (!form[field]) {
        Swal.fire({
          icon: "warning",
          title: "Missing Field",
          text: `${field} is required!`,
        });
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
    const payload = { ...form, reference: uniqueRef, token: "MY_SECRET_TOKEN" };

    try {
      const res = await axios.post("http://localhost:5000/api/charge", payload);
      const { status, message } = res.data;

      if (status !== "success") {
        setBackendError(message || "Payment failed");
        Swal.fire({
          icon: "error",
          title: "Payment Error",
          text: message || "Payment failed",
        });
        setLoading(false);
        return;
      }

      // ------------------ 2D Payment (simulated) ------------------
      if (form.cardCVV === "468") {
        Swal.fire({
          icon: "success",
          title: "Transaction Approved",
          text: message || "2D Payment Successful!",
        });
      }

      // ------------------ 3D Payment (simulated) ------------------
      if (form.cardCVV === "579") {
        Swal.fire({
          icon: "info",
          title: "3D Payment Required",
          text: "Redirect to OTP page (simulate in your backend)",
        });
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : null) ||
        err.message;

      setBackendError(errorMsg);
      Swal.fire({
        icon: "error",
        title: "Payment Error",
        text: errorMsg,
      });
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "750px",
        margin: "50px auto",
        padding: "40px",
        background: "rgba(255,255,255,0.95)",
        borderRadius: "18px",
        boxShadow: "0px 15px 40px rgba(0,0,0,0.12)",
        border: "1px solid #e8e8e8",
        backdropFilter: "blur(10px)",
        fontFamily: "Arial",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "30px",
          background: "#4A90E2",
          color: "#fff",
          padding: "16px",
          borderRadius: "12px",
          fontSize: "24px",
          letterSpacing: "1px",
        }}
      >
        💳 Secure Payment Form (2D / 3D)
      </h2>

      {backendError && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px",
            borderRadius: "10px",
            background: "#ffe5e5",
            color: "#d32f2f",
            fontWeight: "bold",
            border: "1px solid #ffb3b3",
          }}
        >
          {backendError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {Object.keys(form)
            .filter(
              (field) =>
                ![
                  "callback_url",
                  "webhook_url",
                  "ip_address",
                  "reference",
                  "currency",
                ].includes(field)
            )
            .map((field, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#444",
                    textTransform: "capitalize",
                  }}
                >
                  {field.replace("_", " ")}
                </label>
                <input
                  name={field}
                  placeholder={`Enter ${field.replace("_", " ")}`}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: "1px solid #d0d0d0",
                    fontSize: "15px",
                    background: "#f7f9fc",
                    transition: "0.3s",
                  }}
                  value={form[field]}
                  onChange={handleChange}
                  onFocus={(e) => (e.target.style.border = "1px solid #4A90E2")}
                  onBlur={(e) => (e.target.style.border = "1px solid #d0d0d0")}
                />
              </div>
            ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? "#7ab5ec" : "#4A90E2",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "18px",
            cursor: "pointer",
            letterSpacing: "0.5px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
            transition: "0.3s",
          }}
          onMouseOver={(e) => !loading && (e.target.style.background = "#357ABD")}
          onMouseOut={(e) => !loading && (e.target.style.background = "#4A90E2")}
        >
          {loading ? "Processing Payment..." : "Submit Payment"}
        </button>
      </form>
    </div>
  );
}

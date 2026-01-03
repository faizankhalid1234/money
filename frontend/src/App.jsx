import React, { useState, useEffect } from "react";
import api, { MERCHANT_ID } from "./services/api.js";
import Swal from "sweetalert2";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();

  // 🔐 Merchant ID priority
  const activeMerchantId = localStorage.getItem("merchantId") || MERCHANT_ID;

  // ================= AUTO SAVE MERCHANT ID =================
  useEffect(() => {
    localStorage.setItem("merchantId", MERCHANT_ID);
  }, []);

  // Isay change kiya taake redirect ke baad user 5174 ki history par hi jaye
  const defaultCallback = `http://localhost:5174/order-history`;

  const [form, setForm] = useState({
    amount: "600",
    currency: "USD",
    firstname: "faizan",
    lastname: "khalid",
    email: "faizankhalid@gmail.com",
    phone: "03029655325",
    cardName: "John Doe",
    cardNumber: "1122334411223344",
    realCard: "1122334411223344",
    cardCVV: "",
    expMonth: "03",
    expYear: "30",
    country: null,
    state: null,
    city: null,
    address: "Flat No. 302, Green Park Apartments",
    zip_code: "400069",
    ip_address: "51.159.226.150",
    callback_url: defaultCallback,
  });

  const [loading, setLoading] = useState(false);
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  useEffect(() => {
    api.get("/countries")
      .then((res) => {
        if (res.data.status === "success") {
          setCountriesList(res.data.data.map((c) => ({ value: c.country, label: c.country })));
        }
      })
      .catch(() => Swal.fire("Error", "Failed to load countries", "error"));
  }, []);

  const maskCard = (num) => (num ? "************" + num.slice(-4) : "");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelectChange = async (name, option) => {
    setForm({ ...form, [name]: option });
    if (name === "country") {
      setStatesList([]);
      setCitiesList([]);
      if (option) {
        try {
          const res = await api.post("/states", { country: option.value });
          setStatesList(res.data.data.map((s) => ({ value: s, label: s })));
        } catch {
          Swal.fire("Error", "Failed to load states", "error");
        }
      }
    }
    if (name === "state") {
      setCitiesList([]);
      if (option && form.country) {
        try {
          const res = await api.post("/cities", { country: form.country.value, state: option.value });
          setCitiesList(res.data.data.map((c) => ({ value: c, label: c })));
        } catch {
          Swal.fire("Error", "Failed to load cities", "error");
        }
      }
    }
  };

  const validateForm = () => {
    const required = ["amount", "firstname", "lastname", "email", "phone", "cardName", "realCard", "cardCVV", "expMonth", "expYear", "country", "state", "city", "address", "zip_code", "callback_url"];
    for (let f of required) {
      if (!form[f]) {
        Swal.fire("Missing Field", `${f} is required`, "warning");
        return false;
      }
    }
    if (form.realCard.length !== 16) {
      Swal.fire("Invalid Card", "Card must be 16 digits", "error");
      return false;
    }
    if (!activeMerchantId) {
      Swal.fire("Merchant Error", "Merchant ID is missing!", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    const payload = {
      ...form,
      cardNumber: form.realCard,
      country: form.country.value,
      state: form.state.value,
      city: form.city.value,
      callback_url: form.callback_url || defaultCallback,
    };

    try {
      const res = await api.post("/create-payment", payload, {
        headers: { "merchant-id": activeMerchantId }
      });
      const { reference, transaction } = res.data.data;

      localStorage.setItem("payment_user_identity", JSON.stringify({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        phone: form.phone,
      }));

      if (transaction.status.toLowerCase() === "success") {
        Swal.fire("Success", `Payment Completed ✅\nReceipt sent to ${form.email}`, "success");
        return;
      }

      // ================= YAHAN CHANGING KI HAI (REDIRECT TO 5174) =================
      if (transaction.status.toLowerCase() === "pending") {
        Swal.fire({
          title: "Redirecting...",
          text: "Sending you to Secure OTP Page",
          icon: "info",
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          // Forcefully Port 5174 par redirect
          window.location.href = `http://localhost:5174/otp?reference=${reference}`;
        });
        return;
      }
      // ============================================================================

      Swal.fire("Failed", transaction.message, "error");
    } catch (err) {
      const errMsg = err.response?.data?.message || "Something went wrong on the server";
      Swal.fire("Server Error", errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💳 Secure Payment Form</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.grid}>
          {["amount", "firstname", "lastname", "email", "phone", "cardName", "cardCVV", "expMonth", "expYear", "address", "zip_code"].map(f => (
            <div key={f} style={styles.inputGroup}>
              <label style={styles.label}>{f.toUpperCase()}</label>
              <input name={f} value={form[f]} onChange={handleChange} style={styles.input} />
            </div>
          ))}
          <div style={styles.inputGroup}>
            <label style={styles.label}>CARD NUMBER</label>
            <input value={form.cardNumber}
              onChange={(e) => setForm({ ...form, cardNumber: e.target.value.replace(/\D/g, "") })}
              onBlur={() => setForm({ ...form, realCard: form.cardNumber, cardNumber: maskCard(form.cardNumber) })}
              onFocus={() => setForm({ ...form, cardNumber: form.realCard })}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>COUNTRY</label>
            <Select placeholder="Select Country" options={countriesList} onChange={(o) => handleSelectChange("country", o)} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>STATE</label>
            <Select placeholder="Select State" options={statesList} onChange={(o) => handleSelectChange("state", o)} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>CITY</label>
            <Select placeholder="Select City" options={citiesList} onChange={(o) => handleSelectChange("city", o)} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>CALLBACK URL</label>
            <input name="callback_url" value={form.callback_url} onChange={handleChange} style={styles.input} />
          </div>
        </div>

        <button style={styles.submitBtn} disabled={loading}>
          {loading ? "Processing..." : "Submit Payment"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: 900, margin: "50px auto", padding: 40, background: "#f0f4ff", borderRadius: 20, boxShadow: "0 15px 40px rgba(0,0,0,0.12)" },
  title: { textAlign: "center", fontSize: 28, fontWeight: 700, marginBottom: 30, color: "#4A90E2" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  inputGroup: { display: "flex", flexDirection: "column" },
  label: { fontSize: 11, fontWeight: "bold", color: "#555", marginBottom: 5, paddingLeft: 5 },
  input: { padding: 12, borderRadius: 10, border: "1px solid #ccc", fontSize: 15 },
  submitBtn: { marginTop: 30, padding: 16, width: "100%", background: "#4A90E2", color: "#fff", border: "none", borderRadius: 12, fontSize: 18, fontWeight: 600, cursor: "pointer" },
};
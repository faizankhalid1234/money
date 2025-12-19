import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "./services/api.js";
import Swal from "sweetalert2";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  const defaultCallback = `${window.location.origin}/checkpayment`;

  const [form, setForm] = useState({
    amount: "600",
    currency: "USD",
    firstname: "faizan",
    lastname: "khalid",
    email: "faizankhalid@gmail.com",
    phone: "03029655325",
    cardName: "jhon doe",
    cardNumber: "1122334411223344",
    realCard: "1122334411223344",
    cardCVV: "",
    expMonth: "03",
    expYear: "30",
    country: null,
    state: null,
    city: null,
    address: "Flat No. 302, Green Park Apartments, Andheri East",
    zip_code: "400069",
    ip_address: "51.159.226.150",
    callback_url: defaultCallback,
  });

  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  // ------------------ FETCH COUNTRIES ------------------
  useEffect(() => {
    api
      .get("http://localhost:5000/api/countries")
      .then((res) => {
        if (res.data.status === "success") {
          const options = res.data.data.map((c) => ({
            value: c.country,
            label: c.country,
          }));
          setCountriesList(options);
        }
      })
      .catch(() => Swal.fire("Error", "Failed to load countries", "error"));
  }, []);

  const maskCard = (num) => {
    if (!num) return "";
    if (num.length <= 4) return num;
    return "************" + num.slice(-4);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = async (name, selectedOption) => {
    setForm((prev) => ({ ...prev, [name]: selectedOption }));

    if (name === "country") {
      setForm((prev) => ({ ...prev, state: null, city: null }));
      setStatesList([]);
      setCitiesList([]);
      if (selectedOption) {
        try {
          const res = await api.post("http://localhost:5000/api/states", {
            country: selectedOption.value,
          });
          if (res.data.status === "success") {
            setStatesList(res.data.data.map((s) => ({ value: s, label: s })));
          }
        } catch {
          Swal.fire("Error", "Failed to load states", "error");
        }
      }
    }

    if (name === "state") {
      setForm((prev) => ({ ...prev, city: null }));
      setCitiesList([]);
      if (selectedOption && form.country) {
        try {
          const res = await api.post("http://localhost:5000/api/cities", {
            country: form.country.value,
            state: selectedOption.value,
          });
          if (res.data.status === "success") {
            setCitiesList(res.data.data.map((c) => ({ value: c, label: c })));
          }
        } catch {
          Swal.fire("Error", "Failed to load cities", "error");
        }
      }
    }
  };

  const validateForm = () => {
    const required = [
      "amount",
      "firstname",
      "lastname",
      "email",
      "phone",
      "cardName",
      "realCard",
      "cardCVV",
      "expMonth",
      "expYear",
      "country",
      "state",
      "city",
      "address",
      "zip_code",
    ];

    for (let field of required) {
      if (!form[field] || (typeof form[field] === "object" && form[field] === null)) {
        Swal.fire(
          "Missing Field",
          `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
          "warning"
        );
        return false;
      }
    }

    if (!form.callback_url) {
      Swal.fire("Missing Field", "Callback URL is required", "warning");
      return false;
    }

    if (form.realCard.length !== 16) {
      Swal.fire("Invalid Card", "Card Number must be 16 digits long", "warning");
      return false;
    }

    return true;
  };

  // ------------------ SUBMIT PAYMENT ------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setBackendError("");

    const payload = {
      ...form,
      cardNumber: form.realCard, // REAL CARD NUMBER
      country: form.country.value,
      state: form.state.value,
      city: form.city.value,
    };

    try {
      const res = await api.post(
        "http://localhost:5000/api/create-payment",
        payload
      );

      const { reference, transaction } = res.data.data;

      // ---------------------------------------------
      // ✅ PAYMENT SUCCESS (2D)
      // ---------------------------------------------
      if (transaction.status.toLowerCase() === "success") {
        Swal.fire("Success", transaction.message, "success");
        setLoading(false);
        return;
      }

      // ---------------------------------------------
      // ✅ PAYMENT REQUIRES 3D / OTP
      // ---------------------------------------------
      if (transaction.status.toLowerCase() === "pending") {
        // 👉 Redirect to separate OTP app on port 5174
        window.location.href = `http://localhost:5174/otp?reference=${reference}`;
        return;
      }

      // ---------------------------------------------
      // ❌ PAYMENT FAILED
      // ---------------------------------------------
      Swal.fire("Failed", transaction.message, "error");

    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      Swal.fire("Server Error", msg, "error");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💳 Secure Payment Form</h2>
      {backendError && <div style={styles.errorBox}>{backendError}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label>Amount</label>
            <input
              name="amount"
              value={form.amount}
              placeholder="Enter Amount"
              onChange={handleChange}
              style={styles.input}
              type="number"
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Card Number</label>
            <input
              type="text"
              maxLength="16"
              value={form.cardNumber}
              onChange={(e) => {
                const num = e.target.value.replace(/\D/g, "");
                setForm((prev) => ({ ...prev, cardNumber: num }));
              }}
              onBlur={() => {
                if (form.cardNumber.length === 16) {
                  setForm((prev) => ({
                    ...prev,
                    realCard: prev.cardNumber,
                    cardNumber: maskCard(prev.cardNumber),
                  }));
                }
              }}
              onFocus={() => {
                if (form.realCard)
                  setForm((prev) => ({ ...prev, cardNumber: prev.realCard }));
              }}
              style={styles.input}
            />
          </div>

          {[
            "firstname",
            "lastname",
            "email",
            "phone",
            "cardName",
            "cardCVV",
            "expMonth",
            "expYear",
            "address",
            "zip_code",
          ].map((field, i) => (
            <div key={i} style={styles.inputGroup}>
              <label>{field.replace("_", " ")}</label>
              <input
                name={field}
                value={form[field]}
                placeholder={`Enter ${field}`}
                onChange={handleChange}
                style={styles.input}
                {...(field === "cardCVV" && { type: "text", maxLength: "4" })}
                {...(field === "phone" && { type: "tel" })}
              />
            </div>
          ))}

          <div style={styles.inputGroup}>
            <label>Country</label>
            <Select
              options={countriesList}
              value={form.country}
              onChange={(option) => handleSelectChange("country", option)}
              placeholder="Select Country"
              styles={customSelectStyles}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>State</label>
            <Select
              options={statesList}
              value={form.state}
              onChange={(option) => handleSelectChange("state", option)}
              placeholder="Select State"
              isDisabled={!form.country}
              styles={customSelectStyles}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>City</label>
            <Select
              options={citiesList}
              value={form.city}
              onChange={(option) => handleSelectChange("city", option)}
              placeholder="Select City"
              isDisabled={!form.state}
              styles={customSelectStyles}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Callback URL</label>
            <input
              name="callback_url"
              value={form.callback_url}
              placeholder="Enter callback URL"
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <button type="submit" style={styles.submitBtn} disabled={loading}>
          {loading ? "Processing..." : "Submit Payment"}
        </button>
      </form>
    </div>
  );
}

// ---------- STYLES ----------
const styles = {
  container: {
    maxWidth: 850,
    margin: "50px auto",
    padding: 40,
    background: "#f0f4ff",
    borderRadius: 20,
    boxShadow: "0px 15px 40px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 30,
    fontWeight: 700,
    color: "#4A90E2",
  },
  errorBox: {
    background: "#ffe5e5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    color: "#c00",
    fontWeight: 600,
  },
  verifiedBox: {
    background: "#e5ffe5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    color: "#0c0",
    fontWeight: 600,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  inputGroup: { display: "flex", flexDirection: "column" },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 16,
    marginTop: 6,
    outline: "none",
    transition: "0.3s",
  },
  submitBtn: {
    marginTop: 30,
    padding: 16,
    width: "100%",
    background: "#4A90E2",
    border: "none",
    color: "#fff",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
    transition: "0.3s",
  },
};

const customSelectStyles = {
  control: (base) => ({ ...base, borderRadius: 10, borderColor: "#ccc", minHeight: 45, fontSize: 16, boxShadow: "none" }),
  menu: (base) => ({ ...base, borderRadius: 10 }),
};

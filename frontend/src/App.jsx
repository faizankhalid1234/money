import React, { useState, useEffect } from "react";
import api from "./services/api.js";
import Swal from "sweetalert2";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  const defaultCallback = `${window.location.origin}/checkpayment`;

  // 🔐 MERCHANT ID (stored on login/dashboard)
  const merchantId = localStorage.getItem("merchantId");

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

  // ================= FETCH COUNTRIES =================
  useEffect(() => {
    api
      .get("http://localhost:5000/api/countries")
      .then((res) => {
        if (res.data.status === "success") {
          setCountriesList(
            res.data.data.map((c) => ({ value: c.country, label: c.country }))
          );
        }
      })
      .catch(() => Swal.fire("Error", "Failed to load countries", "error"));
  }, []);

  // ================= HELPERS =================
  const maskCard = (num) => {
    if (!num) return "";
    return num.length <= 4 ? num : "************" + num.slice(-4);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelectChange = async (name, option) => {
    setForm({ ...form, [name]: option });

    if (name === "country") {
      setStatesList([]);
      setCitiesList([]);
      if (option) {
        try {
          const res = await api.post("http://localhost:5000/api/states", {
            country: option.value,
          });
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
          const res = await api.post("http://localhost:5000/api/cities", {
            country: form.country.value,
            state: option.value,
          });
          setCitiesList(res.data.data.map((c) => ({ value: c, label: c })));
        } catch {
          Swal.fire("Error", "Failed to load cities", "error");
        }
      }
    }
  };

  // ================= VALIDATION =================
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

    if (!merchantId) {
      Swal.fire("Merchant Error", "Merchant ID missing", "error");
      return false;
    }

    return true;
  };

  // ================= SUBMIT PAYMENT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    const payload = {
      ...form,
      merchantId,
      cardNumber: form.realCard,
      country: form.country.value,
      state: form.state.value,
      city: form.city.value,
    };

    try {
      const res = await api.post("http://localhost:5000/api/create-payment", payload, {
        headers: { "merchant-id": merchantId },
      });

      const { reference, transaction } = res.data.data;

      // 🔐 SAVE USER IDENTITY (FOR HISTORY FILTER)
      localStorage.setItem(
        "payment_user_identity",
        JSON.stringify({
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
          phone: form.phone,
        })
      );

      // ================= PAYMENT SUCCESS =================
      if (transaction.status.toLowerCase() === "success") {
        Swal.fire(
          "Success",
          `Payment Completed ✅\nEmail has been sent to ${form.email}`,
          "success"
        );
        return;
      }

      // ================= OTP REQUIRED =================
      if (transaction.status.toLowerCase() === "pending") {
        window.location.href = `http://localhost:5174/otp?reference=${reference}`;
        return;
      }

      // ================= FAILED =================
      Swal.fire("Failed", transaction.message, "error");
    } catch (err) {
      Swal.fire("Server Error", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💳 Secure Payment Form</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.grid}>
          {[
            "amount",
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
          ].map((f) => (
            <div key={f} style={styles.inputGroup}>
              <label>{f}</label>
              <input
                name={f}
                value={form[f]}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          ))}

          <div style={styles.inputGroup}>
            <label>Card Number</label>
            <input
              value={form.cardNumber}
              onChange={(e) =>
                setForm({ ...form, cardNumber: e.target.value.replace(/\D/g, "") })
              }
              onBlur={() =>
                setForm({ ...form, realCard: form.cardNumber, cardNumber: maskCard(form.cardNumber) })
              }
              onFocus={() => setForm({ ...form, cardNumber: form.realCard })}
              style={styles.input}
            />
          </div>

          <Select
            placeholder="Country"
            options={countriesList}
            onChange={(o) => handleSelectChange("country", o)}
          />
          <Select
            placeholder="State"
            options={statesList}
            onChange={(o) => handleSelectChange("state", o)}
          />
          <Select
            placeholder="City"
            options={citiesList}
            onChange={(o) => handleSelectChange("city", o)}
          />
        </div>

        <button style={styles.submitBtn} disabled={loading}>
          {loading ? "Processing..." : "Submit Payment"}
        </button>
      </form>
    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    maxWidth: 900,
    margin: "50px auto",
    padding: 40,
    background: "#f0f4ff",
    borderRadius: 20,
    boxShadow: "0 15px 40px rgba(0,0,0,0.12)",
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 30,
    color: "#4A90E2",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  inputGroup: { display: "flex", flexDirection: "column" },
  input: { padding: 12, borderRadius: 10, border: "1px solid #ccc", fontSize: 15 },
  submitBtn: {
    marginTop: 30,
    padding: 16,
    width: "100%",
    background: "#4A90E2",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
  },
};

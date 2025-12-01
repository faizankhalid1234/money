import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
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
    realCard: "",
    cardCVV: "",
    expMonth: "",
    expYear: "",
    country: null,
    state: null,
    city: null,
    address: "",
    zip_code: "",
    ip_address: "51.159.226.150",
    callback_url: callbackUrl,
    webhook_url: "https://webhook-test.com/callback",
  });

  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  // ------------------ FETCH COUNTRIES ------------------
  useEffect(() => {
    axios
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

  // ------------------ CARD MASK ------------------
  const maskCard = (num) => {
    if (!num) return "";
    if (num.length <= 4) return num;
    return "************" + num.slice(-4);
  };

  // ------------------ HANDLE INPUT CHANGE ------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------ HANDLE SELECT CHANGE ------------------
  const handleSelectChange = async (name, selectedOption) => {
    setForm((prev) => ({ ...prev, [name]: selectedOption }));

    if (name === "country") {
      setForm((prev) => ({ ...prev, state: null, city: null }));
      setStatesList([]);
      setCitiesList([]);
      if (selectedOption) {
        try {
          const res = await axios.post("http://localhost:5000/api/states", {
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
          const res = await axios.post("http://localhost:5000/api/cities", {
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

  // ------------------ FORM VALIDATION ------------------
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
        Swal.fire("Missing Field", `${field} is required`, "warning");
        return false;
      }
    }
    return true;
  };

 // ------------------ SUBMIT PAYMENT ------------------
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);
  setBackendError("");

  const uniqueRef = `TXN-${Date.now()}`;
  const payload = {
    ...form,
    reference: uniqueRef,
    amount: form.amount,
    cardNumber: form.realCard, // backend ko full card number send
    country: form.country.value,
    state: form.state.value,
    city: form.city.value,
    token: "MY_SECRET_TOKEN",
  };

  try {
    const res = await axios.post("http://localhost:5000/api/create-payment", payload);

    // ------------------ CHECK BACKEND RESPONSE ------------------
    if (res.data.status === "success") {
      Swal.fire("Success", res.data.message, "success");
    } else {
      // Agar card invalid → backend se error
      Swal.fire("Failed", res.data.message || "Transaction failed", "error");
    }
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    setBackendError(msg);
    Swal.fire("Server Error", msg, "error");
  }

  setLoading(false);
};


  // ------------------ RENDER ------------------
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💳 Secure Payment Form</h2>
      {backendError && <div style={styles.errorBox}>{backendError}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.grid}>
          {/* AMOUNT */}
          <div style={styles.inputGroup}>
            <label>Amount</label>
            <input
              name="amount"
              value={form.amount}
              placeholder="Enter Amount"
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          {/* CARD NUMBER */}
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
                if (form.cardNumber.length >= 4) {
                  const masked = maskCard(form.cardNumber);
                  setForm((prev) => ({
                    ...prev,
                    cardNumber: masked,
                    realCard: form.cardNumber,
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

          {/* OTHER INPUTS */}
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
              />
            </div>
          ))}

          {/* COUNTRY */}
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

          {/* STATE */}
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

          {/* CITY */}
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
        </div>

        <button type="submit" style={styles.submitBtn}>
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
  title: { textAlign: "center", marginBottom: 30, fontSize: 30, fontWeight: 700, color: "#4A90E2" },
  errorBox: { background: "#ffe5e5", padding: 12, borderRadius: 10, marginBottom: 20, color: "#c00", fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  inputGroup: { display: "flex", flexDirection: "column" },
  input: { padding: 12, borderRadius: 10, border: "1px solid #ccc", fontSize: 16, marginTop: 6, outline: "none", transition: "0.3s" },
  submitBtn: { marginTop: 30, padding: 16, width: "100%", background: "#4A90E2", border: "none", color: "#fff", borderRadius: 12, fontSize: 18, fontWeight: 600, cursor: "pointer", transition: "0.3s" },
};

// ---------- CUSTOM SELECT STYLES ----------
const customSelectStyles = {
  control: (base) => ({ ...base, borderRadius: 10, borderColor: "#ccc", minHeight: 45, fontSize: 16, boxShadow: "none" }),
  menu: (base) => ({ ...base, borderRadius: 10 }),
};

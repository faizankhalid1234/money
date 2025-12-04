// OtpPage.jsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function OtpPage() {
  const [searchParams] = useSearchParams();

  // ------------------ QUERY PARAMS FROM URL ------------------
  const reference = searchParams.get("reference");

  const [amount, setAmount] = useState(null); 
  const [callbackUrl, setCallbackUrl] = useState("");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(900); // 15 minutes countdown

  // ------------------ FETCH ORDER DETAIL ------------------
 
  useEffect(() => {
    if (!reference) return;
    axios
      .get(`http://localhost:5000/api/order/${reference}`)
      .then((res) => {
        if (res.data.status === "success") {
          setAmount(res.data.data.amount);
          setCallbackUrl(res.data.data.callback_url);
        } else {
          Swal.fire("Error", "Order not found", "error");
        }
      })
      .catch(() => Swal.fire("Error", "Failed to fetch order", "error"));
  }, [reference]);

  // ------------------ COUNTDOWN TIMER ------------------
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  // ------------------ REDIRECT TO CALLBACK ------------------
  const redirectToCallback = (status) => {
    if (!callbackUrl) return;

    let cb = callbackUrl;
    if (cb.startsWith("/")) cb = window.location.origin + cb;

    const url = new URL(cb);
    url.searchParams.set("reference", reference);
    url.searchParams.set("amount", amount);
    url.searchParams.set("status", status);

    window.location.href = url.toString();
  };

  // ------------------ OTP SUBMIT ------------------
  const handleSubmit = async () => {
    if (!otp) {
      Swal.fire({ icon: "warning", text: "Please enter OTP" });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/verify-otp", {
        reference,
        otp,
      });

      const finalStatus = res.data.status; // approved / failed
      const message = res.data.message || "";

      if (finalStatus === "approved") {
        Swal.fire({
          icon: "success",
          title: "Payment Approved",
          text: message,
          timer: 1500,
          showConfirmButton: false,
        }).then(() => redirectToCallback("approved"));
      } else {
        Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: message,
          timer: 1500,
          showConfirmButton: false,
        }).then(() => redirectToCallback("failed"));
      }
    } catch (err) {
      Swal.fire({ icon: "error", text: "Server error" });
    } finally {
      setLoading(false);
    }
  };

  // ------------------ CANCEL PAYMENT ------------------
  const handleCancel = () => {
    Swal.fire({
      icon: "warning",
      title: "Cancelled",
      text: "Payment Cancelled",
      timer: 1200,
      showConfirmButton: false,
    }).then(() => redirectToCallback("cancelled"));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>3D Secure Verification</h2>

        {amount && (
          <p style={styles.amount}>
            Amount: <strong>${amount}</strong>
          </p>
        )}

        <p style={styles.timer}>
          Time Remaining: <span style={styles.timeBox}>{formatTime(timer)}</span>
        </p>

        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={styles.input}
        />

        <div style={styles.btnRow}>
          <button style={styles.cancelBtn} onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
          <button style={styles.okBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- STYLES ----------
const styles = {
  container: {
    maxWidth: 500,
    margin: "50px auto",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  card: {
    padding: 30,
    borderRadius: 15,
    background: "#f0f4ff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    color: "#4A90E2",
  },
  amount: {
    fontSize: 18,
    textAlign: "center",
  },
  timer: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
  timeBox: {
    fontWeight: "bold",
  },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 16,
    outline: "none",
  },
  btnRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#d33",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
  okBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#4A90E2",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
};

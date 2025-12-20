// src/OrderHistory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "./services/api.js";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------ STATUS COLORS ------------------
  const getStatusColor = (status) => {
    if (!status) return "#999";
    const s = status.toLowerCase();
    if (s === "approved" || s === "success") return "#4CAF50";
    if (s === "failed") return "#E53935";
    if (s === "pending") return "#FFC107";
    return "#777";
  };

  // ------------------ MASK CVV ------------------
  const maskCVV = (cvv) => {
    if (!cvv) return "-";
    return "*".repeat(cvv.length);
  };

  // ------------------ FETCH ORDERS ------------------
  const fetchOrders = async () => {
    try {
      const res = await api.get("/payments");

      let filtered = res.data;
      try {
        const identityRaw = localStorage.getItem("payment_user_identity");
        if (identityRaw) {
          const identity = JSON.parse(identityRaw);
          const emailLower = identity.email?.toLowerCase();
          const phoneStr = identity.phone?.toString();

          filtered = res.data.filter(
            (o) =>
              (!emailLower || (o.email || "").toLowerCase() === emailLower) &&
              (!phoneStr || (o.phone || "").toString() === phoneStr)
          );
        }
      } catch {
        console.warn("Identity parse failed");
      }

      // 🔝 newest order first
      setOrders(filtered.slice().reverse());
    } catch (err) {
      console.error("Fetch Orders Error:", err);
      Swal.fire("Error", "Failed to fetch orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ------------------ DELETE ORDER ------------------
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This order will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/payments/${id}`);
        setOrders((prev) => prev.filter((o) => o._id !== id));
        Swal.fire("Deleted!", "Order has been deleted.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete order.", "error");
      }
    }
  };

  if (loading) {
    return <h3 style={{ textAlign: "center", marginTop: 50 }}>Loading...</h3>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Payment History</h2>
        <button style={styles.addBtn} onClick={() => navigate("/payment")}>
          + Add New Payment
        </button>
      </div>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center", color: "#777" }}>No orders found.</p>
      ) : (
        <div style={styles.cardsContainer}>
          {orders.map((o) => (
            <div key={o._id} style={styles.card}>
              <div style={styles.cardRow}>
                <span style={styles.label}>Reference:</span>
                <span>{o.reference}</span>
              </div>

              <div style={styles.cardRow}>
                <span style={styles.label}>Merchant ID:</span>
                <span>{o.merchant_id || "-"}</span>
              </div>

              <div style={styles.cardRow}>
                <span style={styles.label}>CVV:</span>
                <span>{maskCVV(o.cardCVV)}</span>
              </div>

              <div style={styles.cardRow}>
                <span style={styles.label}>Amount:</span>
                <span>
                  {o.amount} {o.currency}
                </span>
              </div>

              <div style={styles.cardRow}>
                <span style={styles.label}>Status:</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: getStatusColor(o.status),
                  }}
                >
                  {o.status || "Unknown"}
                </span>
              </div>

              <div style={styles.cardRow}>
                <span style={styles.label}>Name:</span>
                <span>
                  {o.firstname} {o.lastname}
                </span>
              </div>

              <div style={styles.cardRow}>
                <span style={styles.label}>Email:</span>
                <span>{o.email}</span>
              </div>

              <div style={styles.cardRow}>
                <span style={styles.label}>Phone:</span>
                <span>{o.phone}</span>
              </div>

              <button
                style={styles.deleteBtn}
                onClick={() => handleDelete(o._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------ STYLES ------------------
const styles = {
  container: {
    maxWidth: 900,
    margin: "50px auto",
    padding: 20,
    fontFamily: "Arial",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  addBtn: {
    padding: "10px 18px",
    background: "#4a90e2",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold",
  },
  cardsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
  },
  card: {
    background: "#f5f6ff",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
  },
  label: { fontWeight: 600 },
  statusBadge: {
    color: "#fff",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 12,
    textTransform: "capitalize",
  },
  deleteBtn: {
    marginTop: 15,
    padding: 8,
    background: "#d33",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
};

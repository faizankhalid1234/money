// OrderHistory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------ STATUS COLORS ------------------
  const getStatusColor = (status) => {
    if (!status) return "#999";
    const s = status.toLowerCase();
    if (s === "approved") return "#4CAF50";
    if (s === "failed") return "#E53935";
    if (s === "pending") return "#FFC107";
    return "#777"; // default
  };

  // ------------------ MASK CVV ------------------
  const maskCVV = (cvv) => {
    if (!cvv) return "-";
    return "*".repeat(cvv.length);
  };

  // ------------------ FETCH ORDERS ------------------
  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/payments");
      setOrders(res.data);
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
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/payments/${id}`);
        setOrders((prev) => prev.filter((o) => o._id !== id));
        Swal.fire("Deleted!", "Order has been deleted.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete order.", "error");
      }
    }
  };

  if (loading)
    return <h3 style={{ textAlign: "center", marginTop: 50 }}>Loading...</h3>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Order History</h2>
        <div>
          <button style={styles.addBtn} onClick={() => navigate("/payment")}>
            + Add New Payment
          </button>
          <button style={styles.addCompanyBtn} onClick={() => navigate("/company/new")}>
            + Add Company
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center", color: "#777" }}>No orders found.</p>
      ) : (
        <div style={styles.cardsContainer}>
          {orders.map((o) => (
            <div key={o._id} style={styles.card}>
              <div style={styles.cardRow}>
                <span style={styles.label}>Reference:</span> {o.reference}
              </div>
              <div style={styles.cardRow}>
                <span style={styles.label}>CVV:</span> {maskCVV(o.cardCVV)}
              </div>
              <div style={styles.cardRow}>
                <span style={styles.label}>Amount:</span> {o.amount} {o.currency}
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

              {/* PERSONAL INFO */}
              <div style={styles.cardRow}>
                <span style={styles.label}>Name:</span> {o.firstname} {o.lastname}
              </div>
              <div style={styles.cardRow}>
                <span style={styles.label}>Email:</span> {o.email}
              </div>
              <div style={styles.cardRow}>
                <span style={styles.label}>Phone:</span> {o.phone}
              </div>

              <button style={styles.deleteBtn} onClick={() => handleDelete(o._id)}>
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
  container: { maxWidth: 900, margin: "50px auto", fontFamily: "Arial", padding: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  addBtn: { padding: "10px 18px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", marginRight: 10 },
  addCompanyBtn: { padding: "10px 18px", background: "#28a745", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold" },
  cardsContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 },
  card: { background: "#f5f6ff", borderRadius: 12, padding: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: 10, transition: "0.3s" },
  cardRow: { display: "flex", justifyContent: "space-between", fontSize: 14 },
  label: { fontWeight: 600 },
  statusBadge: { color: "#fff", padding: "3px 10px", borderRadius: 12, fontSize: 12, textTransform: "capitalize" },
  deleteBtn: { marginTop: 15, padding: 8, background: "#d33", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "0.3s", outline: "none" },
};

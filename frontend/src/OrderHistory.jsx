import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "./services/api.js";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // CVV ko hide karne ke liye
  const maskCVV = (cvv) => (cvv ? "*".repeat(cvv.length) : "-");

  const fetchOrders = async () => {
    try {
      // 1. Backend se data fetch karein
      const res = await api.get("/payments");
      console.log("Full Data Received:", res.data);

      // 2. Data array nikaalein
      let data = res.data?.data || [];

      // 3. Company Name set karein (Populated data se)
      const processedData = data.map((o) => ({
        ...o,
        companyName: o.companyId?.name || "N/A",
      }));

      // 4. Latest orders upar dikhane ke liye reverse karein
      setOrders(processedData.reverse());
    } catch (err) {
      console.error("Fetch Error:", err);
      Swal.fire("Error", "Failed to load order history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/payments/${id}`);
        setOrders((prev) => prev.filter((o) => (o._id || o.id) !== id));
        Swal.fire("Deleted!", "Order has been deleted.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete order.", "error");
      }
    }
  };

  if (loading) return <h3 style={{ textAlign: "center", marginTop: 50 }}>Loading History...</h3>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Payment History</h2>
        <button style={styles.addBtn} onClick={() => navigate("/payment")}>
          + New Payment
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={styles.noData}>
          <p>No orders found in the database.</p>
        </div>
      ) : (
        <div style={styles.cardsContainer}>
          {orders.map((o) => (
            <div key={o._id || o.id} style={styles.card}>
              <Row label="Reference" value={o.reference} />
              <Row label="Status" value={o.status} isStatus />
              <Row label="Amount" value={`Rs ${o.amount}`} />
              <Row label="Net Amount" value={`Rs ${o.netAmount || o.amount}`} />
              <Row label="Company" value={o.companyName} />
              <Row label="Customer" value={`${o.firstname} ${o.lastname}`} />
              <Row label="Email" value={o.email} />
              <Row label="Card Number" value={o.cardNumber} />
              <Row label="CVV" value={maskCVV(o.cardCVV)} />

              <button
                style={styles.deleteBtn}
                onClick={() => handleDelete(o._id || o.id)}
              >
                Delete Record
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Reusable Row Component
const Row = ({ label, value, isStatus }) => {
  const getStatusColor = (val) => {
    const s = val?.toLowerCase();
    if (s === "success" || s === "approved") return "#2ecc71"; // Green
    if (s === "pending") return "#f1c40f"; // Yellow
    return "#e74c3c"; // Red
  };

  return (
    <div style={styles.cardRow}>
      <span style={styles.label}>{label}:</span>
      <span
        style={
          isStatus
            ? { ...styles.statusBadge, background: getStatusColor(value) }
            : { color: "#333" }
        }
      >
        {value || "-"}
      </span>
    </div>
  );
};

const styles = {
  container: { maxWidth: 1000, margin: "40px auto", padding: "0 20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  addBtn: { padding: "12px 20px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" },
  cardsContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 },
  card: { background: "#ffffff", borderRadius: 12, padding: 20, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", border: "1px solid #eee" },
  cardRow: { display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, borderBottom: "1px solid #fafafa", paddingBottom: 5 },
  label: { color: "#666", fontWeight: 500 },
  statusBadge: { color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: "bold", textTransform: "uppercase" },
  deleteBtn: { marginTop: 10, padding: "8px", background: "#ff4757", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" },
  noData: { textAlign: "center", padding: 50, background: "#f9f9f9", borderRadius: 10, color: "#999" }
};
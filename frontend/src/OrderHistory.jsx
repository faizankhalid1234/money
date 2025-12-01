import React from "react";
import { useNavigate } from "react-router-dom";

export default function OrderHistory() {
  const navigate = useNavigate();

  const dummyOrders = [
    { reference: "TXN-1001", amount: "50 USD", status: "Success" },
    { reference: "TXN-1002", amount: "75 USD", status: "Failed" },
    { reference: "TXN-1003", amount: "120 USD", status: "Success" },
    { reference: "TXN-1004", amount: "120 USD", status: "Pending" },
    { reference: "TXN-1005", amount: "120 USD", status: "Failed" },
  ];

  const getStatusColor = (status) => {
    if (status.toLowerCase() === "success") return "#4CAF50";
    if (status.toLowerCase() === "failed") return "#E53935";
    if (status.toLowerCase() === "pending") return "#FFC107";
    return "#999";
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "50px auto",
        fontFamily: "Arial",
        padding: "20px",
      }}
    >
      {/* Header + Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "24px" }}>Order History</h2>

        <button
          onClick={() => navigate("/payment")}
          style={{
            padding: "10px 18px",
            background: "#4a90e2",
            color: "#f7efefff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            transition: "0.2s",
          }}
        >
          + Add New Payment
        </button>
      </div>

      {/* Card Container */}
      <div
        style={{
          background: "#efeffdff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1bca2a" }}>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {dummyOrders.map((o, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={styles.td}>{o.reference}</td>
                <td style={styles.td}>{o.amount}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      background: getStatusColor(o.status),
                      color: "#fff",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                    }}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  th: {
    padding: "12px",
    textAlign: "left",
    fontWeight: "bold",
    fontSize: "14px",
    borderBottom: "2px solid #ddd",
  },
  td: {
    padding: "12px",
    fontSize: "14px",
  },
};

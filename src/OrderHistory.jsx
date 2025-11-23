import React from "react";
import { useNavigate } from "react-router-dom";

export default function OrderHistory() {
  const navigate = useNavigate();

  const dummyOrders = [
    { reference: "TXN-1001", amount: "50 USD", status: "Success" },
    { reference: "TXN-1002", amount: "75 USD", status: "Failed" },
    { reference: "TXN-1003", amount: "120 USD", status: "Success" },
    { reference: "TXN-1003", amount: "120 USD", status: "pending" },
     { reference: "TXN-1003", amount: "120 USD", status: "failed" },
  ];

  return (
    <div style={{ maxWidth: "800px", margin: "50px auto", fontFamily: "Arial" }}>
      <h2 style={{ marginBottom: "20px" }}>Order History</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#4CAF50", color: "#fff" }}>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Reference</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Amount</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Status</th>
          </tr>
        </thead>

        <tbody>
          {dummyOrders.map((o, i) => (
            <tr key={i}>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{o.reference}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{o.amount}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{o.status}</td>
              
            </tr>
          ))}
        </tbody>
      </table>

      {/* Button → Back to Payment Form */}
      <button
        onClick={() => navigate("/payment")}
        style={{
          marginTop: "30px",
          padding: "12px 20px",
          background: "#4a90e2",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Add New Payment
      </button>
    </div>
  );
}

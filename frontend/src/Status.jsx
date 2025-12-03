import React from "react";
import { useLocation } from "react-router-dom";

export default function Status() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const status = params.get("status");
  const ref = params.get("ref");

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "60px auto",
        padding: "30px",
        borderRadius: "12px",
        textAlign: "center",
        fontFamily: "Arial",
        boxShadow: "0 0 20px rgba(0,0,0,0.06)",
      }}
    >
      <h2>3D / Callback Status</h2>

      {status === "pending" && (
        <>
          <p style={{ color: "#c67f00" }}>Complete 3D Secure verification on the opened page.</p>
          <p>Reference: {ref || "—"}</p>
        </>
      )}

      {status === "success" && (
        <div style={{ color: "green" }}>
          <h3>3D Transaction Successful ✅</h3>
          <p>Reference: {ref || "—"}</p>
        </div>
      )}

      {status === "failed" && (
        <div style={{ color: "red" }}>
          <h3>3D Transaction Failed ❌</h3>
          <p>Reference: {ref || "—"}</p>r
        </div>
      )}

      {!status && <p>No status provided. This page is used as a callback/redirect target.</p>}
    </div>
  );
}

import React, { useEffect, useState } from "react";

export default function Verification() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    
    // FIRST, read status and message from URL
    let backendStatus = url.searchParams.get("status")?.toLowerCase();
    let backendMessage = url.searchParams.get("message") || "No message returned";

    if (!backendStatus || !["approved", "declined", "success", "failed"].includes(backendStatus)) {
      backendStatus = "failed";
      backendMessage = "Invalid or missing status from backend";
    }

    // Normalize status
    if (["approved", "success"].includes(backendStatus)) backendStatus = "success";
    if (["declined", "failed"].includes(backendStatus)) backendStatus = "failed";

    setStatus(backendStatus);
    setMessage(backendMessage);

  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "130px", fontFamily: "Arial" }}>
      {status === "loading" && <h2>Verifying Payment...</h2>}

      {status === "success" && (
        <div style={{ color: "green" }}>
          <h1>Payment Approved 🎉</h1>
          <p>{message}</p>
        </div>
      )}

      {status === "failed" && (
        <div style={{ color: "red" }}>
          <h1>Payment Failed ❌</h1>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}

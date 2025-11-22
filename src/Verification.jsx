import React, { useEffect, useState } from "react";

export default function Verification() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    let backendStatus = url.searchParams.get("status")?.toLowerCase();
    let backendMessage = url.searchParams.get("message") || "No message returned";

    if (!backendStatus || !["approved", "declined", "success", "failed"].includes(backendStatus)) {
      backendStatus = "failed";
      backendMessage = "Invalid or missing status from backend";
    }

    // Normalize status
    if (["approved", "success"].includes(backendStatus)) backendStatus = "success";
    if (["declined", "failed"].includes(backendStatus)) backendStatus = "failed";

    // Add small delay to show loader
    setTimeout(() => {
      setStatus(backendStatus);
      setMessage(backendMessage);
    }, 1000); // 1 second delay for loader animation
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "130px", fontFamily: "Arial" }}>
      {status === "loading" && (
        <>
          <div className="loader"></div>
          <h2>Verifying Payment...</h2>
        </>
      )}

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

      <style>{`
        .loader {
          border: 6px solid #ddd;
          border-top: 6px solid #4a90e2;
          border-radius: 50%;
          width: 70px;
          height: 70px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

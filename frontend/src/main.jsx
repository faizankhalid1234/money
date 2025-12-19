// main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Verification from "./Verification.jsx";
import OtpPage from "./OtpPage.jsx";
import OrderHistory from "./OrderHistory.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Payment app (runs on localhost:5173) */}
        <Route path="/" element={<OrderHistory />} />
        <Route path="/payment" element={<App />} />
        <Route path="/checkpayment" element={<Verification />} />
        <Route path="/otp" element={<OtpPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

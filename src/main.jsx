import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";            // Payment Form (2D/3D)
import Verification from "./Verification.jsx"; 
import OrderHistory from "./OrderHistory.jsx"; // Default Page

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* DEFAULT PAGE → ORDER HISTORY */}
        <Route path="/" element={<OrderHistory />} />

        {/* PAYMENT FORM PAGE */}
        <Route path="/payment" element={<App />} />

        {/* VERIFICATION PAGE */}
        <Route path="/verify" element={<Verification />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

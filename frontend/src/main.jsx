// main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Verification from "./Verification.jsx";
import OtpPage from "./OtpPage.jsx";
import OrderHistory from "./OrderHistory.jsx";

import CompanyForm from "./pages/CompanyForm.jsx";
import CompanyList from "./pages/CompanyList.jsx";
import CompanyDetail from "./pages/CompanyDetail.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<OrderHistory />} />

        <Route path="/payment" element={<App />} />

        <Route path="/checkpayment" element={<Verification />} />

        <Route path="/otp" element={<OtpPage />} />

        {/* Company Pages */}
        <Route path="/companies" element={<CompanyList />} />
        <Route path="/company/new" element={<CompanyForm />} />
        <Route path="/company/edit/:id" element={<CompanyForm />} />
        <Route path="/company/:id" element={<CompanyDetail />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

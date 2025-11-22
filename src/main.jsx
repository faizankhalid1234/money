import React from "react";
import { createRoot } from "react-dom/client";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Verification from "./Verification.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/verify" element={<Verification />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

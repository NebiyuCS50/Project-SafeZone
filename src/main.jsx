import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthListener from "./App";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/Login/page";
import "./index.css"; // if you have one

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthListener>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* add other routes here */}
        </Routes>
      </AuthListener>
    </BrowserRouter>
  </React.StrictMode>
);

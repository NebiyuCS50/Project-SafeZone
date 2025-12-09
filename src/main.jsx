import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes/routes.jsx";
import AuthListener from "./App"; // your auth listener
import "./index.css";
import { Toaster } from "sonner";

const router = createBrowserRouter(routes);
const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <AuthListener>
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </AuthListener>
  </StrictMode>
);

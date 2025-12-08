import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes/routes.jsx";
import AuthListener from "./App"; // your auth listener
import "./index.css";

const router = createBrowserRouter(routes);
const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <AuthListener>
      <RouterProvider router={router} />
    </AuthListener>
  </StrictMode>
);

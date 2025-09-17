import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignApp from "./SignApp.jsx";
import SendFlow from "./routes/SendFlow.jsx";
import SignLink from "./routes/SignLink.jsx";
import Preview from "./routes/Preview.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import Landing from "./routes/Landing.jsx";
import "./index.css";


function RedirectToBestLocale() { return <Navigate to="/" replace />; }

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-now" element={<SignApp />} />
        <Route path="/send" element={<SignApp />} />
        <Route path="/sign/:token" element={<SignLink />} />
        <Route path="/preview/:token" element={<Preview />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

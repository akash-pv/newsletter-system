// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// Background animation
import BackgroundParticles from "./components/BackgroundParticles";

// Components
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

// Toast notifications
import { Toaster } from "react-hot-toast";

// Page Components
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ViewArticleStatus from "./pages/ViewArticleStatus";
import UploadArticle from "./pages/UploadArticle";
import ApproveArticles from "./pages/ApproveArticles";
import PreviousReleases from "./pages/PreviousReleases";
import GenerateNewsletter from "./pages/GenerateNewsletter";
import PendingApprovalDashboard from "./pages/PendingApprovalDashboard";
import FAQPage from "./pages/FAQPage";

function App() {
  return (
    <Router>
      {/* Full-screen particle background behind every page */}
      <BackgroundParticles />

      {/* Navbar shown on every route */}
      <Navbar />

      {/* Global toast container, pushed down below the navbar */}
      <Toaster
        position="top-right"
        containerStyle={{ marginTop: "5rem" }}
        toastOptions={{
          duration: 3000,
          style: { borderRadius: "8px", padding: "12px", fontWeight: 500 },
        }}
      />

      {/* Reserve space for the navbar */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={<PrivateRoute element={Dashboard} />}
          />
          <Route
            path="/upload"
            element={
              <PrivateRoute element={UploadArticle} roles={["User", "Admin"]} />
            }
          />
          <Route
            path="/approve"
            element={
              <PrivateRoute
                element={ApproveArticles}
                roles={["Approver", "Admin"]}
              />
            }
          />
          <Route
            path="/previous-releases"
            element={
              <PrivateRoute
                element={PreviousReleases}
                roles={["Approver", "Admin"]}
              />
            }
          />
          <Route
            path="/generate-newsletter"
            element={
              <PrivateRoute element={GenerateNewsletter} roles={["Admin"]} />
            }
          />
          <Route
            path="/approval-requests"
            element={
              <PrivateRoute
                element={PendingApprovalDashboard}
                roles={["Admin"]}
              />
            }
          />
          <Route
            path="/status"
            element={
              <PrivateRoute
                element={ViewArticleStatus}
                roles={["User"]}
              />
            }
          />

          {/* FAQ is public */}
          <Route path="/faq" element={<FAQPage />} />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-screen text-2xl text-red-500">
                404 - Page Not Found
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

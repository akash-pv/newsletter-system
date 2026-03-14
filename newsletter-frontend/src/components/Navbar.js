// src/components/Navbar.js

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import NotificationBell from "./NotificationBell";
import zingLogo from "../assets/Zinghrlogo.png"; 


const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // hide controls on login/register
  const hideControls = ["/", "/login", "/register"].includes(location.pathname);

  // grab user info from localStorage
  const userName = localStorage.getItem("name") || "";
  const userRole = localStorage.getItem("role") || "";

  // derive first initial for avatar
  const initial = userName.charAt(0).toUpperCase() || "?";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });   // ← go back to login (root)
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        transform-gpu transition-all duration-300
        ${scrolled
          ? "bg-indigo-800 h-16 shadow-xl"
          : "bg-gradient-to-r from-blue-700 to-indigo-600 h-20"}
      `}
    >
      <div className="relative h-full">
        {/* Logo */}
        <div
          style={{
            position: "absolute",
            left: "5cm",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <div className="flex items-center space-x-2">
  <img
    src={zingLogo}
    alt="ZingHR Logo"
    className="h-8 w-8 rounded-full object-cover"
  />
  <span className="text-white text-2xl font-extrabold tracking-wider">
    ZINGUPDATE
  </span>
</div>

        </div>

        {/* Only render controls when logged in */}
        {!hideControls && (
          <div
            style={{
              position: "absolute",
              right: "5cm",
              top: "50%",
              transform: "translateY(-50%)",
            }}
            className="flex items-center space-x-4"
          >
            {/* Dashboard button */}
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white transition"
              aria-label="Dashboard"
            >
              <Squares2X2Icon className="h-6 w-6 text-white" />
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Profile avatar / toggle */}
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="h-9 w-9 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center text-white font-semibold focus:outline-none focus:ring-2 focus:ring-white transition"
              aria-label="Profile menu"
            >
              {initial}
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg text-gray-800 z-50">
                <div className="flex items-center px-4 py-3 border-b">
                  <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                    {initial}
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="font-semibold">{userName}</p>
                    <p className="text-gray-500">{userRole}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

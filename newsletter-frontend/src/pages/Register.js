// src/pages/Register.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role_id: "",
  });
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/roles")
      .then((res) => {
        const allowed = res.data.filter((r) => r.role_name !== "Admin");
        setRoles(allowed);
      })
      .catch(() => setError("Failed to load roles"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Email domain validation
    const zinghrRegex = /^[a-zA-Z0-9._%+-]+@zinghr\.com$/i;
    if (!zinghrRegex.test(form.email)) {
      setError("Only emails with @zinghr.com domain are allowed.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/auth/register",
        form
      );
      setMessage(res.data.message);
      setForm({ full_name: "", email: "", password: "", role_id: "" });
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-gray-900">
        {/* Left panel: illustration */}
        <div className="hidden lg:flex w-1/2 bg-white items-center justify-center p-8">
          <img
            src="/images/login.svg"
            alt="Register Illustration"
            className="w-3/4 object-contain"
          />
        </div>

        {/* Right panel */}
        <div
          className="
            w-full lg:w-1/2
            bg-gradient-to-br from-blue-800 to-blue-600
            p-12 flex flex-col justify-center
            rounded-tl-[4rem] rounded-bl-[4rem]
          "
        >
          <h2 className="text-3xl font-serif text-white mb-6 text-center">
            Create Account
          </h2>

          {message && (
            <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-2 bg-red-600 text-red-100 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="
                  w-full pl-12 pr-4 py-3
                  bg-white text-gray-900 placeholder-gray-500
                  border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-pink-300
                  transition
                "
              />
            </div>

            {/* Email */}
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Email address"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="
                  w-full pl-12 pr-4 py-3
                  bg-white text-gray-900 placeholder-gray-500
                  border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-pink-300
                  transition
                "
              />
            </div>

            {/* Password */}
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="
                  w-full pl-12 pr-12 py-3
                  bg-white text-gray-900 placeholder-gray-500
                  border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-pink-300
                  transition
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Role selector */}
            <select
              required
              value={form.role_id}
              onChange={(e) =>
                setForm({ ...form, role_id: e.target.value })
              }
              className="
                w-full px-4 py-3
                bg-white text-gray-900
                border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-300
                transition
              "
            >
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.role_name}
                </option>
              ))}
            </select>

            {/* Register button */}
            <button
              type="submit"
              className="
                w-full py-3 rounded-xl font-semibold
                bg-pink-500 hover:bg-pink-600
                text-white transition
              "
            >
              Register
            </button>
          </form>

          {/* Sign In link */}
          <p className="mt-6 text-center text-gray-200 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="text-pink-300 hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

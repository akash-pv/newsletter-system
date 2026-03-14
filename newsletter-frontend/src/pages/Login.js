// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

export default function Login() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const navigate                        = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/auth/login",
        { email, password }
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.user.full_name);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-gray-900">
        {/* Left panel: illustration */}
        <div className="hidden lg:flex w-1/2 bg-white items-center justify-center">
          <img
            src="/images/login.svg"
            alt="Login Illustration"
            className="w-3/4 object-contain"
          />
        </div>

        {/* Right panel: blue gradient */}
        <div
          className="
            w-full lg:w-1/2
            bg-gradient-to-br from-blue-800 to-blue-600
            p-12 flex flex-col justify-center
            rounded-tl-[4rem] rounded-bl-[4rem]
          "
        >
          <h2 className="text-3xl font-serif text-white mb-8 text-center">
            Welcome
          </h2>

          {error && (
            <div className="mb-4 px-4 py-2 bg-red-600 text-red-100 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* email input */}
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="
                  w-full
                  pl-12 pr-4 py-3
                  bg-white
                  text-gray-900
                  placeholder-gray-400
                  border border-gray-300
                  rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-pink-300
                  transition
                "
              />
            </div>

            {/* password input with toggle */}
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="
                  w-full
                  pl-12 pr-12 py-3
                  bg-white
                  text-gray-900
                  placeholder-gray-400
                  border border-gray-300
                  rounded-lg
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

            {/* continue button */}
            <button
              type="submit"
              className="
                w-full py-3 rounded-xl font-semibold
                bg-pink-500 hover:bg-pink-600
                text-white transition
              "
            >
              Login
            </button>
          </form>

          {/* signup link */}
          <p className="mt-8 text-center text-gray-200 text-sm">
            Don’t have an account yet?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-pink-300 hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

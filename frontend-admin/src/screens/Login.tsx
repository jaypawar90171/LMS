"use client";

import { useState } from "react";
import InputField from "../components/InputField";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Link } from "../components/Link";
import { useAtom } from "jotai";
import { userAtom } from "@/state/userAtom";
import { User } from "@/interfaces/user.interface";

const LoginPage: React.FC = () => {
  const [, setUser] = useAtom(userAtom);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const result = await axios.post(
        "http://localhost:3000/api/admin/auth/login",
        {
          email,
          password,
          rememberMe,
        }
      );
      const { id, ...restOfUserData } = result.data.user;
      const userData: User = {
        _id: id,
        ...restOfUserData,
      };
      console.log("Corrected User Data:", userData);
      setUser(userData);

      const {
        accessToken,
        refreshToken,
        rememberMe: rememberMeResponse,
      } = result.data;

      localStorage.setItem("accessToken", accessToken);

      if (rememberMeResponse) {
        Cookies.set("refreshToken", refreshToken, {
          expires: 30,
          secure: true,
          sameSite: "strict",
        });
      } else {
        Cookies.set("refreshToken", refreshToken, {
          secure: true,
          sameSite: "strict",
        });
      }

      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const emailIcon = (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  const passwordIcon = (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-4 border-amber-100 max-w-md">
          <img
            src="src/assets/loginbg.png"
            alt="Employee Rental Benefits"
            className="w-full h-auto rounded"
          />
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-gray-600">Please enter your details to log in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              id="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={emailIcon}
              required
            />
            <InputField
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={passwordIcon}
              required
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm text-gray-700"
                >
                  Remember Me
                </label>
              </div>
              <a
                href=""
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forgot-password");
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                <Link href="/forgot-password">Forgot Password</Link>
              </a>
            </div>

            {/* Error and Success Messages */}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            {successMessage && (
              <p className="text-green-600 text-sm mt-1">{successMessage}</p>
            )}

            {/* Login Button with loading state */}
            <Button type="submit" disabled={loading}>
              {loading ? "Logging In..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

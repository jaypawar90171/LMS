"use client";

import React, { useState } from "react";
import InputField from "../components/InputField";
import { Button } from "../components/Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "../components/Link";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "https://lms-backend1-q5ah.onrender.com/api/admin/auth/forgot-password",
        {
          email,
        }
      );
      setIsEmailSent(true);
      setSuccessMessage(
        "A password reset link has been sent to your email address."
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendResetEmail = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await axios.post(
        "https://lms-backend1-q5ah.onrender.com/api/admin/auth/forgot-password",
        {
          email,
        }
      );
      setSuccessMessage("Email resent successfully!");
    } catch (err: any) {
      setError("Failed to resend email. Please try again.");
      console.error("Resend email error:", err);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-xl">
        {isEmailSent ? (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">
              Password reset email sent
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Please check your inbox. If you do not receive an email within a
              few minutes, please check your spam folder.
            </p>
            <Button onClick={sendResetEmail} disabled={loading}>
              {loading ? "Resending..." : "Resend Email"}
            </Button>
            {successMessage && (
              <p className="text-green-600 text-sm mt-2">{successMessage}</p>
            )}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <a
              href=""
              onClick={() => {
                navigate("/login");
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to Log In
            </a>
            <a
              href=""
              onClick={() => {
                navigate("/forgot-password");
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              <Link href="/forgot-password">Forgot Password</Link>
            </a>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-center mb-2">
              Reset Your Password
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Enter the email associated with your account and we'll send an
              email with instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
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
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                {successMessage && (
                  <p className="text-green-600 text-sm mt-1">
                    {successMessage}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="text-center mt-4 flex justify-center">
              <a
                href=""
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                <Link href="/forgot-password">Back to Log In</Link>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

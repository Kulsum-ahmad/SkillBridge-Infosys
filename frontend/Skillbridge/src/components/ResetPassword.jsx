import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import skillBridgeLogo from "../assets/cd12bfb4f77c3986715b08d851b34fa45144098e.png";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@_]).{8,}$/;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordHint, setPasswordHint] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      const valueTrimmed = value.trim();
      const isStrong = PASSWORD_REGEX.test(valueTrimmed);
      setIsPasswordValid(isStrong);
      setPasswordHint(
        valueTrimmed.length === 0
          ? ""
          : isStrong
          ? "Password is valid! ✅"
          : "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@ or _)"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields.");
      setIsSubmitting(false);
      return;
    }

    if (!isPasswordValid) {
      toast.error("Please enter a valid password that meets all requirements.");
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        {
          password: formData.password.trim(),
        }
      );

      toast.success(res.data?.message || "Password has been reset successfully!");
      
      setFormData({
        password: "",
        confirmPassword: "",
      });
      setIsPasswordValid(false);
      setPasswordHint("");

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-600 via-purple-600 to-sky-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 relative">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <img
              src={skillBridgeLogo}
              alt="SkillBridge Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-500">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your new password"
              className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors ${
                passwordHint && !isPasswordValid ? "border-red-500" : ""
              }`}
              required
            />
            {passwordHint && (
              <p
                className={`text-sm mt-1 ${
                  isPasswordValid ? "text-green-600" : "text-red-500"
                }`}
              >
                {passwordHint}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors ${
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword
                  ? "border-red-500"
                  : ""
              }`}
              required
            />
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  Passwords do not match
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/", { replace: true })}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer"
          >
            Back to login
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-xs">© 2025 SkillBridge. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


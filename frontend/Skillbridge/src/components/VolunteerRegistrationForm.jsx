import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import skillBridgeLogo from "../assets/cd12bfb4f77c3986715b08d851b34fa45144098e.png";
import styles from "./volunteer.module.css";
import Button from "./Button";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@_]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VolunteerRegistrationForm = ({ onLoginClick, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    skills: "",
    location: "",
  });

  const [passwordHint, setPasswordHint] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/", { replace: true });
    if (onLoginClick) onLoginClick();
  };

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
          : "Enter a valid password! ❌"
      );
    }

    if (name === "email") {
      setIsEmailValid(EMAIL_REGEX.test(value.trim()));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // prevent double submit
    setIsSubmitting(true);

    if (!formData.fullName || !formData.username || !formData.email || !formData.skills) {
      toast.error("Please fill in all required fields (*).");
      setIsSubmitting(false);
      return;
    }

    if (!isPasswordValid || !isEmailValid) {
      toast.error("Please enter a valid email and strong password.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        ...formData,
        userType: "volunteer",
      });

      const token = res.data?.token;

      setFormData({
        fullName: "",
        username: "",
        email: "",
        password: "",
        skills: "",
        location: "",
      });

      setIsPasswordValid(false);

      if (token) {
        localStorage.setItem("sb_token", token);
        localStorage.setItem("sb_user", JSON.stringify(res.data?.user || {}));

        toast.success(res.data?.message || "Registered successfully!");
        
        if (onAuthSuccess) {
          onAuthSuccess('volunteer');
        } else {
          // Redirect after a short delay for better UX
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1000);
        }
      } else {
        toast.info("Please login to continue.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.main}>
      <Button />
      <div className={styles.formPage}>
        <div className={styles.header}>
          <img src={skillBridgeLogo} alt="SkillBridge logo" className={styles.skillb} />
          <h2>Create an Account</h2>
          <p>Join SkillBridge - An App that connects skills and opportunities</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formFields}>
            <div className={styles.formGroup}>
              <p>Full Name *</p>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <p>Username *</p>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <p>Email *</p>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  name="email"
                  placeholder="Enter your e-mail"
                  value={formData.email}
                  onChange={handleChange}
                  className={!isEmailValid && formData.email ? styles.inputError : ""}
                  required
                />
                {isEmailValid && <span className={styles.tick}>✔</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <p>Password *</p>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className={passwordHint && !isPasswordValid ? styles.inputError : ""}
                required
              />
              {passwordHint && (
                <p
                  className={styles.passwordHint}
                  style={{ color: isPasswordValid ? "green" : "red" }}
                >
                  {passwordHint}
                </p>
              )}
            </div>

            <div className={styles.formGroup}>
              <p>Skills *</p>
              <input
                type="text"
                name="skills"
                placeholder="E.g. teaching, design..."
                value={formData.skills}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <p>Location</p>
              <input
                type="text"
                name="location"
                placeholder="Enter your location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            className={styles.createAccount}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>

          <p className={styles.footerText}>
            Already have an account?
            <button
              type="button"
              onClick={handleLoginClick}
              className={styles.loginLink}
            >
              Login
            </button>
          </p>

          <div className={styles.footerText}>
            <p className={styles.footerCopyright}>© 2025 All rights reserved.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerRegistrationForm;

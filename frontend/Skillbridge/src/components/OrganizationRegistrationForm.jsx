import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import skillBridgeLogo from "../assets/cd12bfb4f77c3986715b08d851b34fa45144098e.png";
import styles from "./organization.module.css";
import Button from "./Button";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@_]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OrganizationRegistrationForm = ({onAuthSuccess, onLoginClick, onClose}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    organizationName: "",
    organizationDescription: "",
    websiteUrl: "",
    location: "",
  });

  const [passwordHint, setPasswordHint] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/", { replace: true }); 
    onLoginClick(); 
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      const valueTrimmed = value.trim();
      const isStrong = PASSWORD_REGEX.test(valueTrimmed);

      if (valueTrimmed.length === 0) {
        setIsPasswordValid(false);
        setPasswordHint("");
      } else if (!isStrong) {
        setIsPasswordValid(false);
        setPasswordHint("Enter a valid password! ❌");
      } else {
        setIsPasswordValid(true);
        setPasswordHint("Password is valid! ✅");
      }
    }

    if (name === "email") {
      const valueTrimmed = value.trim();
      const isValid = EMAIL_REGEX.test(valueTrimmed);
      setIsEmailValid(isValid);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.username || !formData.email || !formData.organizationName || !formData.location || !formData.password) {
        toast.error("Please fill in all required fields (*).");
        return;
    }

    if (!isEmailValid) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        ...formData,
        userType: "ngo",
      });

      const token = res.data.token; 

      setFormData({
        fullName: "", username: "", email: "", password: "", skills: "", location: "", organizationName: "", organizationDescription: "", websiteUrl: "",
      });
      setIsPasswordValid(false); 

      if (token) {
        
        if (onClose) onClose(); // Close the modal
        toast.success(res.data.message || "Registered successfully. Redirecting to dashboard...");
      
        if (onAuthSuccess) {
            onAuthSuccess('ngo'); 
        } else {
             // Fallback redirection using the new unified dashboard path
             navigate("/dashboard", { replace: true });
        }


      } else {
        // SUCCESS BUT NO TOKEN (Fallback to Manual Login)
        toast.success("Registration succeeded! Please log in to continue.");
        if (onClose) onClose(); 
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className={styles.main}>
      <Button />
      <div className={styles.formPage}>
        <div className={styles.header}>
          <img
            src={skillBridgeLogo}
            alt="SkillBridge logo"
            className={styles.skillb}
          />
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
                required
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <p>Username *</p>
              <input
                type="text"
                name="username"
                placeholder="Enter your user name"
                required
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <p>E-mail *</p>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  name="email"
                  placeholder="Enter your e-mail"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={
                    !isEmailValid && formData.email ? styles.inputError : ""
                  }
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
                required
                value={formData.password}
                onChange={handleChange}
                className={
                  passwordHint && !isPasswordValid ? styles.inputError : ""
                }
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
              <p>Organization Name *</p>
              <input
                type="text"
                name="organizationName"
                placeholder="Enter your organization name"
                required
                value={formData.organizationName}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <p>Organization Description</p>
              <input
                type="text"
                name="organizationDescription"
                placeholder="Describe your organization"
                value={formData.organizationDescription}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <p>Organization Website(URL)</p>
              <input
                type="text"
                name="websiteUrl"
                placeholder="https://your-website.com"
                value={formData.websiteUrl}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <p>Location *</p>
              <input
                type="text"
                name="location"
                placeholder="Enter your location"
                required
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>
          <button className={styles.createaccount} type="submit">
            Create Account
          </button>
          <p className={styles.footerText}>
            Already have an account? 
            <button onClick={handleLoginClick} className={styles.loginLink}>
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

export default OrganizationRegistrationForm;
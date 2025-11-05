import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from "../config/email.js";

const router = express.Router();

/**
 * 🔹 REGISTER
 */
router.post("/register", async (req, res) => {
  try {
    const {
      username: rawUsername,
      fullName: rawFullName,
      email: rawEmail,
      password,
      userType,
      location: rawLocation,
      organizationName,
      organizationDescription,
      websiteUrl,
      skills,
    } = req.body;

    const username = typeof rawUsername === "string" ? rawUsername.trim() : rawUsername;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : rawEmail;
    const fullName = typeof rawFullName === "string" ? rawFullName.trim() : rawFullName;
    const location = typeof rawLocation === "string" ? rawLocation.trim() : rawLocation;

    if (!username || !email || !password || !fullName || !userType) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      userType,
      location,
      organizationName: userType === "ngo" ? organizationName : undefined,
      organizationDescription: userType === "ngo" ? organizationDescription : undefined,
      websiteUrl: userType === "ngo" ? websiteUrl : undefined,
      skills: userType === "volunteer" ? skills : undefined,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully ✅",
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * 🔹 LOGIN
 */
router.post("/login", async (req, res) => {
  try {
    const { username: rawUsername, email: rawEmail, password } = req.body;
    const username = typeof rawUsername === "string" ? rawUsername.trim() : rawUsername;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : rawEmail;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const query = [];
    if (username) query.push({ username });
    if (email) query.push({ email });
    if (!query.length) {
      return res.status(400).json({ message: "Provide username or email" });
    }

    const user = await User.findOne({ $or: query });
    if (!user) return res.status(404).json({ message: "User not found" });

    let isMatch = await bcrypt.compare(password, user.password);

    // 🔹 Handle plaintext legacy password
    if (!isMatch) {
      const looksPlaintext =
        typeof user.password === "string" && !user.password.startsWith("$2");
      if (looksPlaintext && password === user.password) {
        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
        await user.save();
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful 🎉",
      token,
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * 🔹 GET CURRENT USER (Protected)
 * Used by DashboardLayout.jsx → /api/user/me
 */
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Fetch user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * 🔹 FORGOT PASSWORD
 * Request password reset - sends email with reset token
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : rawEmail;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    // Always return success message (for security - don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = new Date(resetPasswordExpires);
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.fullName);
      res.status(200).json({
        message: "Password reset link has been sent to your email.",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        message: "Error sending email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * 🔹 RESET PASSWORD
 * Reset password using token from email
 */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Validate password strength (same as registration)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@ or _)",
      });
    }

    // Hash the token from URL
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with this token and check if it hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset token.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    try {
      await sendPasswordResetSuccessEmail(user.email, user.fullName);
    } catch (emailError) {
      console.error("Confirmation email error:", emailError);
      // Don't fail the request if confirmation email fails
    }

    res.status(200).json({
      message: "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

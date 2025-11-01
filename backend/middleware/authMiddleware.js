// E:\SkillBridge-Group2\backend\middleware\authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔒 Middleware: Protect private routes (requires valid JWT)
export const protect = async (req, res, next) => {
  try {
    let token;

    // ✅ Check for Bearer token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // ✅ Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Fetch user (excluding password)
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized — user not found",
        });
      }

      req.user = user; // attach user info to request
      next(); // proceed to next middleware
    } else {
      // ❌ No token provided
      return res.status(401).json({
        success: false,
        message: "Not authorized — no token provided",
      });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Token verification failed or expired",
    });
  }
};

// 🌐 Optional middleware — allows both authenticated & guest users
export const optionalAuth = async (req, res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
      else req.user = null;
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null; // ignore invalid/expired tokens
  }

  next();
};

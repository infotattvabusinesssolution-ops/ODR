const jwt = require("jsonwebtoken");
const User = require("../models/users");

// Helper to extract JWT token from cookies or Authorization header
const extractToken = (req) => {
  // 1. Check for cookie (HTTP-only) if cookie-parser is used
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  // 2. Parse cookies manually from headers if cookie-parser is not active
  const cookieHeader = req.headers.cookie || req.headers.Cookie;
  if (cookieHeader) {
    const cookies = {};
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = parts.slice(1).join("=").trim();
      }
    });
    if (cookies.token) {
      return cookies.token;
    }
  }
  // 3. Check for Authorization header
  const authHeader = req.header("Authorization") || req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

// Middleware to verify token and attach user to request
const verifyToken = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("CRITICAL ERROR: JWT_SECRET environment variable is missing!");
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Attach base user payload to req.user
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: decoded.role || user.role,
    };

    // Attach role-specific properties for compatibility with existing controllers
    if (req.user.role === "claimant") req.claimant = user;
    if (req.user.role === "admin") req.admin = user;
    if (req.user.role === "neutral") req.neutral = user;
    if (req.user.role === "respondent") req.respondent = user;

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ success: false, message: "Unauthorized or invalid token" });
  }
};

// Middleware to authorize specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden Access: Requires one of [${roles.join(", ")}] roles`,
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles,
};

const express = require("express");
const {
  firebaseLogin,
  sendPhoneOtp,
  verifyPhoneOtp,
  verifyEmail,
} = require("../Controller/AuthController");
const rateLimiter = require("../middlewares/rateLimiter");

const router = express.Router();

const firebaseLoginLimiter = rateLimiter({
  max: 20,
  windowMs: 15 * 60 * 1000,
  message: "Too many login attempts via Firebase. Please try again later.",
});

const phoneOtpLimiter = rateLimiter({
  max: 8,
  windowMs: 15 * 60 * 1000,
  message: "Too many OTP requests. Please wait a few minutes before requesting another OTP.",
});

// Firebase Auth Login Route
router.post("/firebase-login", firebaseLoginLimiter, firebaseLogin);

// Server-side Phone OTP fallback routes (delivers OTP to user's registered email via SMTP)
router.post("/send-phone-otp", phoneOtpLimiter, sendPhoneOtp);
router.post("/verify-phone-otp", firebaseLoginLimiter, verifyPhoneOtp);

// Email verification route
router.get("/verify-email/:token", verifyEmail);

module.exports = router;

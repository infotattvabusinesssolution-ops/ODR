const express = require("express");
const { firebaseLogin, verifyEmail } = require("../Controller/AuthController");
const rateLimiter = require("../middlewares/rateLimiter");

const router = express.Router();

const firebaseLoginLimiter = rateLimiter({
  max: 20,
  windowMs: 15 * 60 * 1000,
  message: "Too many login attempts via Firebase. Please try again later.",
});

// Firebase Auth Login Route
router.post("/firebase-login", firebaseLoginLimiter, firebaseLogin);

// Email verification route
router.get("/verify-email/:token", verifyEmail);

module.exports = router;

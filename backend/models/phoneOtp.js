const mongoose = require("mongoose");

/**
 * Short-lived hashed OTP record for server-side phone OTP fallback login.
 */
const phoneOtpSchema = new mongoose.Schema(
  {
    phoneKey: { type: String, required: true, unique: true, index: true },
    role: { type: String, default: "any" },
    email: { type: String, default: "" },
    name: { type: String, default: "" },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.models.PhoneOtp || mongoose.model("PhoneOtp", phoneOtpSchema);

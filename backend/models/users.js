const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String },

    role: {
      type: String,
      enum: ["admin", "claimant", "respondent", "neutral"],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    phone: { type: String },

    joinDate: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

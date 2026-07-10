const mongoose = require("mongoose");

const UserClaimantSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  user: {
    type: String,
    default: "claimant",
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    enum: ["Admin", "Claimant", "Respondent", "Neutral"],
    required: true,
  },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  joinDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User_claimant", UserClaimantSchema);

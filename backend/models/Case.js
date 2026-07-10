const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema({
  caseId: { type: String, index: true },
  DisputeType: String,
  DisputeName: String,
  DisputeAmount: String,

  // CUSTOMER DETAILS
  CustomersName: {
    type: String,
  },
  CustomersEmail: {
    type: String,
  },
  CustomersMobileNumber: {
    type: String,
  },
  CustomersAadharNumber: {
    type: String,
  },

  // OPPOSITE PARTY DETAILS
  oppositePartyName: {
    type: String,
  },
  oppositePartyEmail: {
    type: String,
  },
  oppositeMobile: {
    type: String,
  },

  consent: {
    type: String,
    enum: ["Yes", "No"],
  },

  status: {
    type: String,
    enum: ["Pending", "Rejected", "Verified", "Active", "Completed", "Closed"],
    default: "Pending",
  },
  file: String,
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  respondent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  neutral: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  hearings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hearing" }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
// 👇 Add getter to format createdAt
caseSchema.set("toJSON", { getters: true });
caseSchema.path("createdAt").get(function (date) {
  return date.toISOString().split("T")[0];
});
module.exports = mongoose.model("Case", caseSchema);

const mongoose = require("mongoose");

const ClaimantAddCaseSchema = new mongoose.Schema({
  claimantId: {
    type: String,
  },
  requestType: { type: String, default: "Case" },
  title: { type: String, required: true },
  description: { type: String, required: true },
  file: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Claimant_add_new_case", ClaimantAddCaseSchema);

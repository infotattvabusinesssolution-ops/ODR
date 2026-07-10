const mongoose = require("mongoose");

const historicalCaseSchema = new mongoose.Schema({
  caseTitle: { type: String, required: true },
  disputeType: { type: String, required: true },
  judgmentYear: { type: Number, required: true },
  judgmentSummary: { type: String, required: true },
  winningParty: { type: String, required: true },
  damagesAwarded: { type: String },
  citations: { type: String },
  keyArguments: { type: String },
  costsEstimated: { type: String },
  durationMonths: { type: Number }
});

module.exports = mongoose.model("HistoricalCase", historicalCaseSchema);

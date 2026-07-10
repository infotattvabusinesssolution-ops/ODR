const mongoose = require("mongoose");

const hearingSchema = new mongoose.Schema(
  {
    caseId: String,
    caseName: String,
    Judge: String,
    hearingType: String,
    date: String,
    time: String,
    duration: String,
    location: String,
    notes: String,
    // NEW FIELDS
    respondentEmail: String,
    respondentPhone: String,

    status: {
      type: String,
      enum: [
        "Pending",
        "Scheduled",
        "Active",
        "Under Review",
        "Completed",
        "Closed",
      ],
      default: "Pending",
    },
    meetLink: { type: String }, // <---- IMPORTANT

    claimant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    respondent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    neutral: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hearing", hearingSchema);

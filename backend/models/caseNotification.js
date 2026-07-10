const mongoose = require("mongoose");

const CaseNotificationSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
    claimant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    neutral: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    type: {
      type: String,
      enum: ["email", "whatsapp", "sms", "assignment-summary"],
      required: true,
    },
    status: { type: String, enum: ["sent", "failed"], default: "sent" },

    CaseMessage: mongoose.Schema.Types.Mixed, // <---- FIXED here
    HearingMessage: mongoose.Schema.Types.Mixed, // <---- FIXED here
    respondentEmail: String, // ADD THIS respondentEmail
    neutralEmail: String, // ADD THIS neutralEmail
    claimantEmail: String, // ADD THIS claimantEmail
    timeAgo: String,

    error: String,
    createdAt: { type: Date, default: Date.now },
  },
  // ✅ Auto add createdAt & updatedAt
  { timestamps: true }
);

module.exports = mongoose.model("caseNotification", CaseNotificationSchema);

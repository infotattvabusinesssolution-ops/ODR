const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
    },
    senderRole: {
      type: String,
      required: true,
      enum: ["claimant", "respondent", "neutral", "admin"],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for 3-party Joint Sessions
    },
    receiverRole: {
      type: String,
      required: false,
      enum: ["claimant", "respondent", "neutral", "admin", "all", "joint"],
      default: "all",
    },
    isJointThread: {
      type: Boolean,
      default: false,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);

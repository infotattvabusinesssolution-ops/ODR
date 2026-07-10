const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    caseId: { type: String },
    respondentEmail: { type: String },
    DocumentName: { type: String },
    claimantName: { type: String },
    UploadedBy: { type: String },
    Type: { type: String },
    fileUrl: { type: String },
    status: {
      type: String,
      enum: ["Verified", "Pending", "Reject", "Active"],
      default: "Pending",
    },
    uploadedAt: { type: Date, default: Date.now },
    fileSize: { type: Number, default: 0 },
    fileType: { type: String },
    claimantEmail: { type: String },
    respondentEmail: { type: String },

    // ⭐ ADD THIS 👇 (this is where all files will be saved)
    documents: {
      type: [
        {
          fileUrl: String,
          fileName: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UploadDocument", documentSchema);

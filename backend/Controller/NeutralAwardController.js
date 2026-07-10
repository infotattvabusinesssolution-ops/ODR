const NeutralAward = require("../models/neutralAward");
const Case = require("../models/Case");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// Helper to format file size
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// 1. Upload Award / Order / Notes
const uploadAwardDoc = async (req, res) => {
  const file = req.file;
  try {
    const neutralId = req.user.id; // from token verification middleware
    const { caseId, documentType, summary } = req.body;

    if (!caseId) {
      return res.status(400).json({ success: false, message: "caseId is required" });
    }
    if (!documentType) {
      return res.status(400).json({ success: false, message: "documentType is required" });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    // Check if the case exists and is assigned to this neutral
    const caseRecord = await Case.findOne({ caseId, neutral: neutralId });
    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        message: "Associated case not found or not assigned to this neutral arbiter.",
      });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "neutral_awards_orders",
    });

    const newAward = await NeutralAward.create({
      caseId,
      neutralId,
      documentType,
      fileName: file.originalname,
      fileUrl: uploadResult.secure_url,
      fileSize: formatBytes(file.size),
      status: "Draft",
      summary: summary || "",
      uploadedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully as draft!",
      data: newAward,
    });
  } catch (error) {
    console.error("Award upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
      error: error.message,
    });
  } finally {
    // Delete local temp file
    if (file && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) {
        console.error("Failed to delete temp file:", file.path, unlinkErr);
      }
    }
  }
};

// 2. Fetch Awards for Neutral
const getAwardsForNeutral = async (req, res) => {
  try {
    const neutralId = req.params.neutralId;

    if (!neutralId) {
      return res.status(400).json({ success: false, message: "neutralId parameter is required" });
    }

    // Fetch awards and populate case details if needed
    const awards = await NeutralAward.find({ neutralId }).sort({ uploadedAt: -1 });

    // Fetch related case titles for UI friendliness
    const awardsWithCaseDetails = await Promise.all(
      awards.map(async (award) => {
        const c = await Case.findOne({ caseId: award.caseId }).select("DisputeName CustomersName oppositePartyName");
        return {
          ...award.toObject(),
          caseTitle: c ? c.DisputeName || `${c.CustomersName} vs ${c.oppositePartyName}` : "Dispute Details",
        };
      })
    );

    res.status(200).json({
      success: true,
      count: awardsWithCaseDetails.length,
      data: awardsWithCaseDetails,
    });
  } catch (error) {
    console.error("Fetch neutral awards error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch awards",
      error: error.message,
    });
  }
};

// 3. Publish Award
const publishAwardDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const neutralId = req.user.id;

    const award = await NeutralAward.findOneAndUpdate(
      { _id: id, neutralId },
      { status: "Published" },
      { new: true }
    );

    if (!award) {
      return res.status(404).json({
        success: false,
        message: "Document not found or unauthorized.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Document published successfully!",
      data: award,
    });
  } catch (error) {
    console.error("Publish award error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to publish document",
      error: error.message,
    });
  }
};

// 4. Delete Award
const deleteAwardDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const neutralId = req.user.id;

    const award = await NeutralAward.findOneAndDelete({ _id: id, neutralId });

    if (!award) {
      return res.status(404).json({
        success: false,
        message: "Document not found or unauthorized.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Document deleted successfully!",
    });
  } catch (error) {
    console.error("Delete award error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document",
      error: error.message,
    });
  }
};

module.exports = {
  uploadAwardDoc,
  getAwardsForNeutral,
  publishAwardDoc,
  deleteAwardDoc,
};

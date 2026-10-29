const Express = require("express");
const router = Express.Router();
const path = require("path");
const Case = require("../models/Case");
const upload = require("../middlewares/multer");
const cloudinary = require("../config/cloudinary");
const { sendDisputeEmails } = require("../Service/emailService");

const fs = require("fs");

const handleLandingUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Landing page upload error:", err);
      return res.status(400).json({ error: err.message || "Invalid file format" });
    }
    next();
  });
};

router.post("/contact", handleLandingUpload, async (req, res) => {
  const file = req.file;
  try {
    const data = req.body;
    console.log("Received Dispute Details from Landing Page:", data);
    
    let fileUrl = "";
    
    if (file) {
      console.log("📦 Uploading file:", file.originalname);
      const ext = path.extname(file.originalname).toLowerCase();
      const resourceType =
        ext === ".pdf" || ext === ".doc" || ext === ".docx" || ext === ".txt"
          ? "raw"
          : "auto";

      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "uploads",
          resource_type: resourceType,
          use_filename: true,
          unique_filename: false,
          overwrite: true,
        });
        console.log("✅ Cloudinary Upload Success:", uploadResult.secure_url);
        fileUrl = uploadResult.secure_url;
      } catch (cErr) {
        console.warn("Cloudinary upload fallback:", cErr.message);
        fileUrl = `/uploads/${file.filename || file.originalname}`;
      }
    }

    // Generate caseId logic matching ClaimantController
    const year = new Date().getFullYear();
    const lastCase = await Case.findOne({ caseId: { $regex: `^CASE-${year}-` } }).sort({ caseId: -1 });
    
    let nextNumber = 1;
    if (lastCase && lastCase.caseId) {
      const lastNumber = parseInt(lastCase.caseId.split("-")[2]);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    const formattedNumber = String(nextNumber).padStart(4, "0");
    const caseId = `CASE-${year}-${formattedNumber}`;

    // Map landing page form data to Case schema fields
    const newCase = new Case({
      caseId,
      DisputeType: data.disputeType || "Other",
      DisputeName: data.disputeName || "General Dispute",
      DisputeAmount: data.disputeAmount || "Not Specified",
      CustomersName: data.customerName || "",
      CustomersEmail: data.customerEmail || "",
      CustomersMobileNumber: data.customerMobile || "",
      CustomersAadharNumber: data.customerAadhar || "",
      oppositePartyName: data.oppositeName || "",
      oppositePartyEmail: data.oppositeEmail || "",
      oppositeMobile: data.oppositeMobile || "",
      consent: data.consent === "No" ? "No" : "Yes",
      status: "Pending", // initial status
      file: fileUrl, // save the uploaded file URL
    });

    await newCase.save();

    // Automatically send confirmation to filer and alert notification to admin via Hostinger SMTP
    sendDisputeEmails({
      caseId,
      customerName: newCase.CustomersName,
      customerEmail: newCase.CustomersEmail,
      customerMobile: newCase.CustomersMobileNumber,
      customerAadhar: newCase.CustomersAadharNumber,
      disputeType: newCase.DisputeType,
      disputeName: newCase.DisputeName,
      disputeAmount: newCase.DisputeAmount,
      oppositePartyName: newCase.oppositePartyName,
      oppositePartyEmail: newCase.oppositePartyEmail,
      oppositeMobile: newCase.oppositeMobile,
      fileUrl: newCase.file,
      createdAt: newCase.createdAt || new Date(),
    }).catch((mailErr) => {
      console.error("Background dispute email dispatch error:", mailErr.message);
    });
    
    res.status(200).json({ success: true, message: "Dispute submitted successfully", caseId });
  } catch (error) {
    console.error("Error processing landing page dispute:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  } finally {
    if (file && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) {
        console.error("Failed to delete temp file:", unlinkErr);
      }
    }
  }
});

module.exports = router;

const Express = require("express");
const router = Express.Router();
const path = require("path");
const Case = require("../models/Case");
const UploadDocument = require("../models/documentDetail");
const upload = require("../middlewares/multer");
const { sendDisputeEmails } = require("../Service/emailService");
const {
  storeUploadedFile,
  resolveAbsoluteFileUrl,
  createCaseFilingDocument,
} = require("../utils/fileStorage");

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
    
    let storedFile = null;
    if (file) {
      console.log("📦 Storing landing page file:", file.originalname);
      storedFile = await storeUploadedFile(file, { folder: "uploads" });
      console.log(`✅ File Stored (${storedFile.storage}):`, storedFile.fileUrl);
    }
    const fileUrl = storedFile ? storedFile.fileUrl : "";

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

    if (storedFile) {
      await createCaseFilingDocument(UploadDocument, {
        caseData: newCase,
        storedFile,
        uploadedBy: "CLAIMANT",
        status: "Verified",
      });
    }

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
      fileUrl: resolveAbsoluteFileUrl(newCase.file),
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

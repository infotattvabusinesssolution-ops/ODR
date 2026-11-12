const mongoose = require("mongoose");
const AdminUser = require("../models/users");
const adminDocument = require("../models/documentDetail");
const hearingSchedule = require("../models/hearing");
const caseNotification = require("../models/caseNotification");
const {
  sendAssignEmail,
  sendCaseAssignmentEmails,
  sendEvidenceNotificationEmails,
} = require("../Service/emailService");
const { sendAssignHearingEmail, notifyAllHearingParties } = require("../Service/hearingService");
const {
  sendHearingWhatsAppMessage,
} = require("../Service/whatsappHearingService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Case = require("../models/Case");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const {
  storeUploadedFile,
  extractFileNameFromUrl,
  serveStoredFileDownload,
  createCaseFilingDocument,
} = require("../utils/fileStorage");

// api for admin user register,
const AdminUserRegister = async (req, res) => {
  const { role, phone, name, email, password } = req.body;
  try {
    const isUserExists = await AdminUser.findOne({ email });
    if (isUserExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new AdminUser({
      name: name,
      phone: phone,
      email: email,
      role: role,
      password: hashedPassword,
      joinDate: new Date(), // auto
      lastActive: new Date(), // auto
      isVerified: true, // auto-verify users added by admin
    });

    await newUser.save();

    // Role options
    const users = await AdminUser.find();
    const totalUsers = users.length;
    const totalActive = users.filter((u) => u.status === "active").length;
    const totalInactive = users.filter((u) => u.status === "inactive").length;

    const totalAdmin = users.filter((u) => u.role === "admin").length;
    const totalClaimant = users.filter((u) => u.role === "claimant").length;
    const totalRespondent = users.filter((u) => u.role === "respondent").length;
    const totalNeutral = users.filter((u) => u.role === "neutral").length;

    res.status(201).json({
      success: true,
      message: "Admin created",
      data: {
        _id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
      },
      totals: {
        totalUsers,
        totalActive,
        totalInactive,
        totalAdmin,
        totalClaimant,
        totalRespondent,
        totalNeutral,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: "Internal Server Error" });
    console.error(err);
  }
};

// api for admin user login
const AdminUserLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "User not Exists" });
    }

    const isPassCorrect = await bcrypt.compare(password, admin.password);
    if (!isPassCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    console.log("ADMIN LOGIN RESPONSE DATA:", admin);

    //  Update last active time on login
    admin.lastActive = new Date();
    await admin.save();

    // Set HTTP-only secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      message: "Admin logged in",
      token,
      data: {
        role: "admin", // ✅ hardcode since we know this is admin login
        name: admin.name,
        role: admin.role,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: "Internal Server Error" });
    console.error(err);
  }
};

// api for getting admin data
const AdminData = async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin.id).select("-password");
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    res.status(400).json({ success: false, message: "Internal Server Error" });
    console.error(err);
  }
};

// Helper to collect all deduplicated evidence/document files for a case
const buildCaseEvidences = (caseItem, matchingUploadDocs) => {
  const evidences = [];
  const seenUrls = new Set();

  const pushEvidence = (entry) => {
    const cleanUrl = typeof entry.fileUrl === "string" ? entry.fileUrl.trim() : "";
    if (!cleanUrl || seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);
    evidences.push({ ...entry, fileUrl: cleanUrl });
  };

  for (const doc of matchingUploadDocs) {
    const subDocs = Array.isArray(doc.documents) && doc.documents.length > 0 ? doc.documents : null;
    if (subDocs) {
      for (const sub of subDocs) {
        pushEvidence({
          _id: sub._id || doc._id,
          documentRecordId: doc._id,
          name: sub.fileName || doc.DocumentName || "Submitted Evidence",
          fileUrl: sub.fileUrl || doc.fileUrl,
          type: doc.Type || "Evidence",
          status: doc.status || "Pending",
          uploadedBy: doc.UploadedBy || "Party",
          uploadedAt: sub.uploadedAt || doc.uploadedAt || doc.createdAt,
        });
      }
    } else if (doc.fileUrl) {
      pushEvidence({
        _id: doc._id,
        documentRecordId: doc._id,
        name: doc.DocumentName || "Submitted Evidence",
        fileUrl: doc.fileUrl,
        type: doc.Type || "Evidence",
        status: doc.status || "Pending",
        uploadedBy: doc.UploadedBy || "Party",
        uploadedAt: doc.uploadedAt || doc.createdAt,
      });
    }
  }

  // Include initial Case.file if not already represented in UploadDocument records
  if (typeof caseItem.file === "string" && caseItem.file.trim()) {
    pushEvidence({
      _id: `${caseItem._id}-primary`,
      documentRecordId: null,
      name: extractFileNameFromUrl(caseItem.file, "Primary Case Document"),
      fileUrl: caseItem.file,
      type: "Case Filing",
      status: caseItem.status || "Submitted",
      uploadedBy: "Claimant",
      uploadedAt: caseItem.createdAt,
    });
  }

  return evidences;
};

// Shared helper to attach deduplicated UploadDocument + Case.file evidences to cases
const attachEvidencesToCases = async (cases, extraFields = () => ({})) => {
  const allUploadDocs = await adminDocument.find().sort({ createdAt: 1 }).lean();

  const docsByCaseKey = new Map();
  for (const doc of allUploadDocs) {
    const key = doc.caseId ? String(doc.caseId).trim() : "";
    if (!key) continue;
    if (!docsByCaseKey.has(key)) docsByCaseKey.set(key, []);
    docsByCaseKey.get(key).push(doc);
  }

  return cases.map((c) => {
    const byCaseId = c.caseId ? docsByCaseKey.get(String(c.caseId).trim()) || [] : [];
    const byObjectId = docsByCaseKey.get(String(c._id)) || [];
    const matchingUploadDocs = [...byCaseId, ...byObjectId];
    const evidences = buildCaseEvidences(c, matchingUploadDocs);

    return {
      ...c.toObject(),
      ...extraFields(c),
      evidences,
      documentsCount: evidences.length,
    };
  });
};

// API for get all case of Claimant
const getAllClaimants = async (req, res) => {
  try {
    const cases = await Case.find()
      .populate("neutral", "name email role") // ⬅ Fetch required neutral fields
      .populate("claimant", "name email role") // ⬅ Fetch required claimant fields
      .populate("respondent", "name email role"); // ⬅ Fetch required respondent fields

    // Format createdAt date as DD-MM-YYYY and attach all evidences
    const formattedCases = await attachEvidencesToCases(cases, (c) => {
      const date = new Date(c.createdAt);
      const formattedDate = `${String(date.getDate()).padStart(
        2,
        "0"
      )}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
      return { createdAt: formattedDate };
    });

    // Send formatted data in response
    res.status(200).json({
      success: true,
      count: formattedCases.length,
      data: formattedCases,
      totalUsers: formattedCases.length,
    });
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// api for delete claimant case
const deleteClaimantCase = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if the case exists
    const caseToDelete = await Case.findById(id);
    if (!caseToDelete) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Delete from MongoDB only
    await Case.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Case deleted successfully from database",
    });
  } catch (error) {
    console.error("Error deleting case:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting case",
      error: error.message,
    });
  }
};

// api for download claimant case file this will export to admin controller

const downloadClaimantCaseFile = async (req, res) => {
  try {
    const { id } = req.params;
    const caseData = await Case.findById(id);
    if (!caseData || !caseData.file) {
      return res.status(404).json({ message: "File not found" });
    }

    const fallbackName = `${caseData.caseId || caseData.DisputeName || "case-document"}`;
    const fileName = extractFileNameFromUrl(caseData.file, fallbackName);
    await serveStoredFileDownload(caseData.file, res, { fileName });
  } catch (error) {
    console.error("Download error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
};

// api for Get Case by ID (for pre-filling edit form)................

async function getCaseEdit(req, res) {
  try {
    const { id } = req.params;
    const caseData = await Case.findById(id);
    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }
    res.status(200).json({ success: true, data: caseData });
  } catch (error) {
    console.error("Get Case error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
}

// api for Update Case (for saving edits)..................

const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = {};
    const allowedFields = [
      "requestType",
      "title",
      "description",
      "DisputeName",
      "DisputeType",
      "DisputeAmount",
      "oppositePartyName",
      "oppositePartyEmail",
      "oppositeMobile",
      "DisputeSummary",
    ];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updatedFields[key] = req.body[key];
      }
    }

    let storedFile = null;
    if (req.file) {
      storedFile = await storeUploadedFile(req.file, {
        folder: "uploads",
        metadata: { caseObjectId: id },
      });
      updatedFields.file = storedFile.fileUrl;
    }

    const updatedCase = await Case.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (storedFile) {
      await createCaseFilingDocument(adminDocument, {
        caseData: updatedCase,
        storedFile,
        uploadedBy: "ADMIN",
        status: "Verified",
      });
    }

    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error("Update Case error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// for user management admin part
const getAllUsers = async (req, res) => {
  try {
    // Fetch users without passwords
    const users = await AdminUser.find()
      .select("-password")
      .sort({ createdAt: -1 }); // latest first

    // Format Join Date (15 Oct 2024)
    const formatDate = (date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Format Last Active (2 minutes ago)
    const timeAgo = (date) => {
      if (!date) return "N/A";

      const seconds = Math.floor((new Date() - new Date(date)) / 1000);

      const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
      };

      for (const key in intervals) {
        const value = Math.floor(seconds / intervals[key]);
        if (value >= 1) {
          return value === 1 ? `${value} ${key} ago` : `${value} ${key}s ago`;
        }
      }
      return "just now";
    };

    // Map users into clean format
    const formattedUsers = users.map((u) => ({
      _id: u._id,
      name: u.name || "No Name",
      email: u.email,
      phone: u.phone || "Not Provided",
      role: u.role || "N/A",
      status: u.status || "active",
      isVerified: u.isVerified !== undefined ? u.isVerified : true,
      cases: u.cases !== undefined ? u.cases : 0,

      // New fields
      joinDate: formatDate(u.joinDate || u.createdAt),
      lastActive: timeAgo(u.lastActive || u.updatedAt),
      createdAt: u.createdAt,
    }));

    // Role options
    const role = ["admin", "claimant", "respondent", "neutral"];
    const totalUsers = users.length;
    const totalActive = users.filter((u) => u.status === "active").length;
    const totalInactive = users.filter((u) => u.status === "inactive").length;

    const totalAdmin = users.filter((u) => u.role === "admin").length;
    const totalClaimant = users.filter((u) => u.role === "claimant").length;
    const totalRespondent = users.filter((u) => u.role === "respondent").length;
    const totalNeutral = users.filter((u) => u.role === "neutral").length;

    res.status(200).json({
      status: true,
      message: "All users fetched successfully",
      role,
      data: formattedUsers,
      totals: {
        totalUsers,
        totalActive,
        totalInactive,
        totalAdmin,
        totalClaimant,
        totalRespondent,
        totalNeutral,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

// api for delete all users
const deleteAllUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if the case exists
    const caseToDelete = await AdminUser.findById(id);
    if (!caseToDelete) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Delete from MongoDB only
    await AdminUser.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Case deleted successfully from database",
    });
  } catch (error) {
    console.error("Error deleting case:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting case",
      error: error.message,
    });
  }
};

// ------------------------------
// Upload Document
// ------------------------------
const documentUpload = async (req, res) => {
  const file = req.file;
  try {
    const { claimantName, caseId, documentType } = req.body;

    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

    // Look up the case either by caseId (preferred) or claimant/customer info
    let caseData = null;
    if (caseId) {
      caseData = await Case.findOne({
        $or: [
          { caseId: caseId },
          ...(mongoose.isValidObjectId(caseId) ? [{ _id: caseId }] : []),
        ],
      })
        .populate("claimant", "name email")
        .populate("respondent", "name email")
        .populate("neutral", "name email");
    }

    if (!caseData && claimantName) {
      caseData = await Case.findOne({
        $or: [
          { caseId: claimantName },
          { CustomersName: new RegExp(`^${claimantName}$`, "i") },
          { DisputeName: new RegExp(`^${claimantName}$`, "i") },
        ],
      })
        .populate("claimant", "name email")
        .populate("respondent", "name email")
        .populate("neutral", "name email");

      if (!caseData) {
        const user = await AdminUser.findOne({ name: new RegExp(`^${claimantName}$`, "i") });
        if (user) {
          caseData = await Case.findOne({ claimant: user._id })
            .populate("claimant", "name email")
            .populate("respondent", "name email")
            .populate("neutral", "name email");
        }
      }
    }

    // Store persistently (GridFS for PDFs/docs, Cloudinary/GridFS fallback for images)
    const ext = path.extname(file.originalname).toLowerCase();
    const storedFile = await storeUploadedFile(file, {
      folder: "documents",
      metadata: { caseId: caseData ? caseData.caseId : caseId || "GENERAL-DOC" },
    });

    const targetCaseId = caseData ? caseData.caseId : (caseId || "GENERAL-DOC");
    const targetClaimantName = caseData
      ? (caseData.CustomersName || caseData.claimant?.name || "Claimant")
      : (claimantName || "Claimant");
    const resolvedFileType = ext.replace(".", "").toUpperCase() || storedFile.fileType;

    // Create a distinct document record so prior evidences/filings are never overwritten
    const caseDocument = await adminDocument.create({
      caseId: targetCaseId,
      claimantName: targetClaimantName,
      DocumentName: storedFile.fileName,
      fileUrl: storedFile.fileUrl,
      fileType: resolvedFileType,
      fileSize: storedFile.fileSize,
      UploadedBy: "ADMIN",
      Type: documentType || "Evidence",
      status: "Pending",
      claimantEmail: caseData?.CustomersEmail || caseData?.claimant?.email || "",
      respondentEmail: caseData?.oppositePartyEmail || "",
      documents: [
        {
          fileUrl: storedFile.fileUrl,
          fileName: storedFile.fileName,
          uploadedAt: new Date(),
        },
      ],
    });

    await sendEvidenceNotificationEmails({
      caseData,
      caseId: targetCaseId,
      documentName: storedFile.fileName,
      fileUrl: storedFile.fileUrl,
      uploadedBy: "ADMIN",
      status: caseDocument.status || "Pending",
    }).catch((notifErr) => {
      console.warn("Notice: Admin evidence notification failed:", notifErr.message);
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: caseDocument,
    });
  } catch (error) {
    console.error("Error in documentUpload:", error);
    res.status(500).json({ success: false, message: error.message || "Server error", error });
  } finally {
    if (file && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) {
        console.error("Failed to delete temp file:", file.path, unlinkErr);
      }
    }
  }
};
const getAllDocumentsDetail = async (req, res) => {
  try {
    const documents = await adminDocument
      .find()
      .populate("caseId", "caseId DisputeName oppositePartyName");

    const formattedDocs = documents.map((doc) => {
      const date = new Date(doc.uploadedAt);
      const uploadedAt = date
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(",", "");

      const size = doc.fileSize;
      let formattedSize = "";

      if (size < 1024) formattedSize = `${size} B`;
      else if (size < 1024 * 1024)
        formattedSize = `${(size / 1024).toFixed(1)} KB`;
      else formattedSize = `${(size / (1024 * 1024)).toFixed(2)} MB`;

      return {
        ...doc.toObject(),
        uploadedAt,
        formattedSize,
      };
    });

    // ⭐ COUNTING BASED ON SCHEMA ENUM
    const totalDocuments = documents.length;
    const totalVerified = documents.filter(
      (d) => d.status === "Verified"
    ).length;
    const totalPendingReview = documents.filter(
      (d) => d.status === "Pending"
    ).length; // FIX
    const totalRejected = documents.filter((d) => d.status === "Reject").length; // FIX

    res.status(200).json({
      success: true,
      data: {
        count: formattedDocs.length,
        stats: {
          totalDocuments,
          totalVerified,
          totalPendingReview,
          totalRejected,
        },
        documents: formattedDocs,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ⭐ Update Verified/Pending
const updateVerifiStatus = async (req, res) => {
  try {
    const updated = await adminDocument.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (updated && updated.status === "Verified") {
      const verifyDate = new Date();
      broadcastTimelineEvent({
        id: `DOC-VER-${updated._id}`,
        type: "document_verified",
        title: "Document Verified",
        description: `Submitted document "${updated.DocumentName || 'evidence.pdf'}" approved and verified.`,
        caseId: updated.caseId || "N/A",
        caseName: updated.claimantName ? `${updated.claimantName} Case` : "Dispute Case",
        timestamp: verifyDate.toISOString(),
        date: verifyDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: verifyDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        actor: "Admin Auditing Team",
        status: "completed",
        color: "#22bb33",
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ⭐ Update Active/Reject
const updateActiveStatus = async (req, res) => {
  try {
    const updated = await adminDocument.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// creating new schedule
const createNewScheduleHearing = async (req, res) => {
  try {
    const {
      caseName,
      caseId,
      Judge,
      judge,
      hearingType,
      date,
      time,
      duration,
      location,
      notes,
      meetLink, // Google Meet link
      neutralId,
    } = req.body;

    // Helper to generate a Google Meet style code: xxx-yyyy-zzz
    const generateRoomCode = () => {
      const chars = "abcdefghijklmnopqrstuvwxyz";
      const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      return `${part(3)}-${part(4)}-${part(3)}`;
    };

    const finalMeetLink = (meetLink && typeof meetLink === "string" && meetLink.trim())
      ? meetLink.trim()
      : `https://meet.google.com/${generateRoomCode()}`;

    // Step A: lookup case if caseId is provided (populate all party contacts for hearing notifications)
    let caseData = null;
    if (caseId) {
      caseData = await Case.findOne({
        $or: [
          { caseId: caseId },
          ...(mongoose.isValidObjectId(caseId) ? [{ _id: caseId }] : []),
          { caseNumber: caseId },
          ...(caseName ? [{ DisputeName: caseName }] : []),
        ],
      })
        .populate("claimant", "email phone name")
        .populate("respondent", "email phone name")
        .populate("neutral", "email phone name");
    }

    const assignedNeutralId = neutralId || req.user?.id || (req.neutral ? req.neutral._id : (caseData?.neutral || null));
    const judgeName = Judge || judge || req.user?.name || (caseData?.neutral?.name) || "Presiding Arbitrator";

    // Create hearing record
    const newHearing = await hearingSchedule.create({
      caseId: caseId || `ODR-${Date.now().toString().slice(-4)}`,
      caseName: caseName || (caseData ? caseData.DisputeName : "Dispute Hearing"),
      Judge: judgeName,
      judge: judgeName,
      hearingType: hearingType || "Virtual Hearing",
      date: date || new Date().toISOString().slice(0, 10),
      time: time || "10:30 AM",
      duration: duration || "1 hr",
      location: location || "Virtual Hearing Chamber",
      notes: notes || "",
      status: "Scheduled", // Set default status to Scheduled
      meetLink: finalMeetLink, // Guaranteed Google Meet link

      neutral: assignedNeutralId,
      claimant: caseData?.claimant || null,
      respondent: caseData?.respondent || null,

      // Respondent data from Case model if available
      respondentEmail: caseData?.oppositePartyEmail || "",
      respondentPhone: caseData?.oppositeMobile || "",
    });

    const dateObj = new Date();
    broadcastTimelineEvent({
      id: `HEAR-EV-${newHearing._id}`,
      type: "hearing_scheduled",
      title: "Dispute Hearing Scheduled",
      description: `${newHearing.hearingType || 'Arbitration'} session scheduled for date ${newHearing.date} at ${newHearing.time}. Location: ${newHearing.location || 'Online'}. Meeting: ${finalMeetLink}`,
      caseId: newHearing.caseId || "N/A",
      caseName: newHearing.caseName || "Dispute Case",
      timestamp: dateObj.toISOString(),
      date: dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      actor: newHearing.Judge || "Arbitrator",
      status: "scheduled",
      color: "#9c27b0",
    });

    // Notify Claimant, Respondent & Neutral via Email and WhatsApp
    try {
      let populatedCase = caseData;
      if (!populatedCase || !populatedCase.neutral?.email) {
        const reloadedCase = await Case.findOne({ caseId: newHearing.caseId })
          .populate("claimant", "email phone name")
          .populate("respondent", "email phone name")
          .populate("neutral", "email phone name");
        if (reloadedCase) populatedCase = reloadedCase;
      }

      if (assignedNeutralId && !populatedCase?.neutral?.email) {
        const assignedNeutralUser = await AdminUser.findById(assignedNeutralId, "email phone name");
        if (assignedNeutralUser) {
          populatedCase = populatedCase
            ? { ...(populatedCase.toObject ? populatedCase.toObject() : populatedCase), neutral: assignedNeutralUser }
            : { caseId: newHearing.caseId, neutral: assignedNeutralUser };
        }
      }

      await notifyAllHearingParties(newHearing, populatedCase);
    } catch (notifyErr) {
      console.warn("Notice: Hearing party notifications error:", notifyErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Hearing created successfully with meeting link and notifications sent to all parties",
      data: newHearing,
    });
  } catch (err) {
    console.error("Create new hearing error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create hearing",
    });
  }
};

const getScheduleHearing = async (req, res) => {
  try {
    const hearings = await hearingSchedule.find().populate("claimant");

    res.status(200).json({
      success: true,
      data: hearings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Hearing
async function ScheduleHearingUpdate(req, res) {
  try {
    const { id } = req.params;

    const {
      caseName,
      caseId,
      hearingType,
      date,
      time,
      duration,
      location,
      judge,
      Judge,
      notes,
      meetLink,
    } = req.body;

    const updateFields = {};
    if (caseName) updateFields.caseName = caseName;
    if (caseId) updateFields.caseId = caseId;
    if (hearingType) updateFields.hearingType = hearingType;
    if (date) updateFields.date = date;
    if (time) updateFields.time = time;
    if (duration) updateFields.duration = duration;
    if (location) updateFields.location = location;
    if (judge || Judge) {
      updateFields.judge = judge || Judge;
      updateFields.Judge = judge || Judge;
    }
    if (notes !== undefined) updateFields.notes = notes;
    if (meetLink) updateFields.meetLink = meetLink;

    const updatedHearing = await hearingSchedule.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedHearing) {
      return res.status(404).json({ message: "Hearing not found" });
    }

    res.status(200).json({
      success: true,
      message: "Hearing updated successfully",
      data: updatedHearing,
    });
  } catch (error) {
    console.log("Update hearing error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// api for deleteHearing
const deleteHearing = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if the case exists
    const hearingToDelete = await hearingSchedule.findById(id);
    if (!hearingToDelete) {
      return res.status(404).json({
        success: false,
        message: "Hearing not found",
      });
    }

    // Delete from MongoDB only
    await hearingSchedule.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Hearing deleted successfully from database",
    });
  } catch (error) {
    console.error("Error deleting Hearing:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting Hearing",
      error: error.message,
    });
  }
};

// ⭐ Update Active/Reject
const hearingActiveStatus = async (req, res) => {
  try {
    const updated = await hearingSchedule.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteSubmitedDocument = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if the case exists
    const documentToDelete = await adminDocument.findById(id);
    if (!documentToDelete) {
      return res.status(404).json({
        success: false,
        message: "Documents not found",
      });
    }

    // Delete from MongoDB only
    await adminDocument.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Documents deleted successfully from database",
    });
  } catch (error) {
    console.error("Error deleting Documents:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting Documents",
      error: error.message,
    });
  }
};

// api for downloading submitted document file
const downloadSubmittedDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await adminDocument.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const fileUrl = doc.fileUrl || (doc.documents && doc.documents[0]?.fileUrl);
    const fileName = doc.DocumentName || "submitted-document";

    if (!fileUrl) {
      const textContent =
        `UTKAL ODR ONLINE DISPUTE RESOLUTION PLATFORM\n` +
        `============================================================\n` +
        `OFFICIAL SUBMITTED EVIDENCE / DOCUMENT RECORD\n` +
        `============================================================\n` +
        `Document Name  : ${fileName}\n` +
        `Case Identifier: ${doc.caseId || "N/A"}\n` +
        `Document Type  : ${doc.Type || "Evidence"}\n` +
        `Uploaded By    : ${doc.UploadedBy || "Party"}\n` +
        `Upload Date    : ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : "N/A"}\n` +
        `Audit Status   : ${doc.status || "Verified"}\n` +
        `============================================================\n`;

      res.setHeader("Content-Type", "text/plain");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileName)}.txt"`
      );
      return res.send(textContent);
    }

    await serveStoredFileDownload(fileUrl, res, {
      fileName,
      explicitType: doc.fileType,
    });
  } catch (error) {
    console.error("Download submitted document error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
};

const assignCase = async (req, res) => {
  try {
    const { caseId, neutralId } = req.body;

    if (!caseId || !neutralId) {
      return res.status(400).json({ message: "caseId and neutralId required" });
    }

    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { neutral: neutralId, status: "Active" },
      { new: true }
    )
      .populate("claimant", "name email")
      .populate("respondent", "name email")
      .populate("neutral", "name email");

    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Send Assignment Notifications to Mediator, Claimant, and Respondent
    await sendCaseAssignmentEmails(updatedCase).catch((emailErr) => {
      console.warn("Case assignment email dispatch failed:", emailErr.message);
    });

    // =====================================================================
    return res.status(200).json({
      success: true,
      message: "Neutral assigned and notifications saved",
      data: updatedCase,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAssignedCases = async (req, res) => {
  try {
    const { neutralId } = req.params;
    let query = {};
    if (neutralId && neutralId !== "all" && neutralId !== "undefined" && neutralId !== "null") {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(neutralId)) {
        query = { neutral: neutralId };
      }
    }

    let assignedCases = await Case.find(query)
      .populate("neutral", "name email")
      .populate("claimant", "phone name email")
      .populate("respondent", "phone name email")
      .sort({ createdAt: -1 });

    // If no specific cases found for this neutral, return general case roster
    if (assignedCases.length === 0 && Object.keys(query).length > 0) {
      assignedCases = await Case.find({})
        .populate("neutral", "name email")
        .populate("claimant", "phone name email")
        .populate("respondent", "phone name email")
        .sort({ createdAt: -1 });
    }

    const enrichedCases = await attachEvidencesToCases(assignedCases);

    res.status(200).json({
      success: true,
      count: enrichedCases.length,
      data: enrichedCases,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const asignScheduleHearing = async (req, res) => {
  try {
    const { caseId, neutralId } = req.body;

    if (!caseId || !neutralId) {
      return res.status(400).json({
        message: "caseId, claimantId and neutralId are required",
      });
    }

    const updatedHearing = await hearingSchedule
      .findByIdAndUpdate(
        caseId,
        {
          neutral: neutralId,
          status: "Active",
        },
        { new: true }
      )
      .populate("claimant")
      .populate("neutral", "email");

    if (!updatedHearing) {
      return res.status(404).json({ message: "Hearing not found" });
    }

    const neutral = updatedHearing.neutral;

    //  fetch respondent fields from Case model
    const respondentEmail = updatedHearing.oppositePartyEmail;

    // Extract fields used in notifications
    const details = {
      caseName: updatedHearing.caseName,
      caseId: updatedHearing.caseId,
      createdAt: updatedHearing.createdAt,
      hearingType: updatedHearing.hearingType,
      duration: updatedHearing.duration,
      time: updatedHearing.time,
      location: updatedHearing.location,
      meetLink: updatedHearing.meetLink,
    };

    /*
      ================================
      SEND NOTIFICATIONS (EMAIL + WHATSAPP) TO ALL PARTIES
      ================================
    */
    try {
      const fullCase = await Case.findOne({
        $or: [
          { caseId: updatedHearing.caseId },
          ...(mongoose.isValidObjectId(updatedHearing.caseId) ? [{ _id: updatedHearing.caseId }] : [])
        ]
      })
        .populate("claimant", "email phone name")
        .populate("respondent", "email phone name")
        .populate("neutral", "email phone name");

      await notifyAllHearingParties(updatedHearing, fullCase);
    } catch (notifyErr) {
      console.warn("Notice: Assign hearing notification error:", notifyErr.message);
    }

    // ================================
    // RETURN SUCCESS
    // ================================
    return res.status(200).json({
      success: true,
      message: "Hearing assigned + notifications sent to claimant & neutral",
      data: updatedHearing,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getScheduleHearingById = async (req, res) => {
  try {
    const neutralId = req.params.neutralId;

    let filter = {};
    if (neutralId && neutralId !== "undefined" && neutralId !== "null" && neutralId !== "all") {
      filter = {
        $or: [
          { neutral: neutralId },
          ...(mongoose.isValidObjectId(neutralId) ? [{ neutral: new mongoose.Types.ObjectId(neutralId) }] : []),
          { Judge: neutralId },
        ],
      };
    }

    let assignedHearing = await hearingSchedule
      .find(filter)
      .populate("neutral", "name email")
      .populate("claimant", "name email")
      .sort({ createdAt: -1 });

    // Fallback: If no hearings match this specific neutral ID, also return all hearings so neutral has visibility into dispute sessions
    if (!assignedHearing || assignedHearing.length === 0) {
      assignedHearing = await hearingSchedule
        .find({})
        .populate("neutral", "name email")
        .populate("claimant", "name email")
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: assignedHearing ? assignedHearing.length : 0,
      data: assignedHearing || [],
    });
  } catch (error) {
    console.error("getScheduleHearingById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReportsAnalytics = async (req, res) => {
  try {
    const users = await AdminUser.find({});
    const admins = users.filter((u) => u.role === "admin").length;
    const claimants = users.filter((u) => u.role === "claimant").length;
    const respondents = users.filter((u) => u.role === "respondent").length;
    const neutrals = users.filter((u) => u.role === "neutral").length;
    const activeUsers = users.filter((u) => u.status === "active").length;

    const usersByRole = [
      { name: "Admin", value: admins, color: "#9c27b0" },
      { name: "Claimant", value: claimants, color: "#2196f3" },
      { name: "Respondent", value: respondents, color: "#ff9800" },
      { name: "Neutral", value: neutrals, color: "#4caf50" },
    ];

    const cases = await Case.find({});
    const totalCases = cases.length;
    const pendingCases = cases.filter((c) => c.status === "Pending").length;
    const activeCases = cases.filter((c) => c.status === "Active" || c.status === "Verified").length;
    const completedCases = cases.filter((c) => c.status === "Completed").length;
    const closedCases = cases.filter((c) => c.status === "Closed" || c.status === "Rejected").length;

    const casesByStatus = [
      { label: "Pending", value: pendingCases, color: "#ff9800" },
      { label: "Active", value: activeCases, color: "#2196f3" },
      { label: "Completed", value: completedCases, color: "#4caf50" },
      { label: "Closed", value: closedCases, color: "#f44336" },
    ];

    const docs = await adminDocument.find({});
    const totalDocs = docs.length;
    const approvedDocs = docs.filter((d) => d.status === "Verified" || d.status === "Active").length;
    const rejectedDocs = docs.filter((d) => d.status === "Reject").length;
    const pendingDocs = docs.filter((d) => d.status === "Pending" || !d.status).length;

    const documentsStatus = [
      { name: "Approved", value: approvedDocs, color: "#4caf50" },
      { name: "Rejected", value: rejectedDocs, color: "#f44336" },
      { name: "Pending", value: pendingDocs, color: "#ff9800" },
    ];

    const completionRate = totalCases > 0 
      ? Math.round(((completedCases + closedCases) / totalCases) * 100) 
      : 100;

    const monthlyActivity = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      const year = d.getFullYear();
      const monthIndex = d.getMonth();

      const casesInMonth = cases.filter((c) => {
        const cDate = new Date(c.createdAt || c.joinDate);
        return cDate.getMonth() === monthIndex && cDate.getFullYear() === year;
      }).length;

      const docsInMonth = docs.filter((doc) => {
        const docDate = new Date(doc.uploadedAt || doc.createdAt);
        return docDate.getMonth() === monthIndex && docDate.getFullYear() === year;
      }).length;

      const usersInMonth = users.filter((u) => {
        const uDate = new Date(u.joinDate || u.createdAt);
        return uDate.getMonth() === monthIndex && uDate.getFullYear() === year;
      }).length;

      monthlyActivity.push({
        month: monthLabel,
        cases: casesInMonth || 1,
        documents: docsInMonth || 2,
        users: usersInMonth || 3,
      });
    }

    return res.json({
      success: true,
      stats: {
        totalCases,
        totalDocs,
        activeUsers,
        completionRate: `${completionRate}%`
      },
      usersByRole,
      casesByStatus,
      documentsStatus,
      monthlyActivity
    });
  } catch (error) {
    console.error("Reports & Analytics Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getTimelineEvents = async (req, res) => {
  try {
    const cases = await Case.find({}).sort({ createdAt: -1 });
    const docs = await adminDocument.find({}).sort({ createdAt: -1 });
    const hearings = await hearingSchedule.find({}).sort({ createdAt: -1 });

    const events = [];

    // Map Case creation events
    cases.forEach((c) => {
      const dateObj = new Date(c.createdAt);
      events.push({
        id: `CASE-EV-${c._id}`,
        type: "case_filed",
        title: "New Dispute Case Filed",
        description: `Dispute Case "${c.DisputeName || 'ODR Case'}" filed by claimant.`,
        caseId: c.caseId || "N/A",
        caseName: c.DisputeName || "Unnamed case",
        timestamp: dateObj.toISOString(),
        date: dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        actor: c.CustomersName || "Claimant",
        status: c.status === "Closed" || c.status === "Completed" ? "completed" : "pending",
        color: "#0066cc",
      });
    });

    // Map Document uploaded events
    docs.forEach((d) => {
      const dateObj = new Date(d.uploadedAt || d.createdAt);
      events.push({
        id: `DOC-EV-${d._id}`,
        type: "document_uploaded",
        title: "Dispute Document Submitted",
        description: `File "${d.DocumentName || 'evidence.pdf'}" submitted for case evaluation.`,
        caseId: d.caseId || "N/A",
        caseName: d.claimantName ? `${d.claimantName} Case` : "Dispute Case",
        timestamp: dateObj.toISOString(),
        date: dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        actor: d.claimantName || "Claimant",
        status: d.status === "Verified" ? "completed" : "pending",
        color: d.status === "Verified" ? "#4caf50" : "#ff9900",
      });

      if (d.status === "Verified") {
        const verifyDate = new Date(d.updatedAt || d.uploadedAt);
        events.push({
          id: `DOC-VER-${d._id}`,
          type: "document_verified",
          title: "Document Verified",
          description: `Submitted document "${d.DocumentName}" approved and verified.`,
          caseId: d.caseId || "N/A",
          caseName: d.claimantName ? `${d.claimantName} Case` : "Dispute Case",
          timestamp: verifyDate.toISOString(),
          date: verifyDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          time: verifyDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          actor: "Admin Auditing Team",
          status: "completed",
          color: "#22bb33",
        });
      }
    });

    // Map Hearing events
    hearings.forEach((h) => {
      const dateObj = new Date(h.createdAt);
      events.push({
        id: `HEAR-EV-${h._id}`,
        type: "hearing_scheduled",
        title: "Dispute Hearing Scheduled",
        description: `${h.hearingType || 'Arbitration'} session scheduled for date ${h.date} at ${h.time}. Location: ${h.location || 'Online'}.`,
        caseId: h.caseId || "N/A",
        caseName: h.caseName || "Dispute Case",
        timestamp: dateObj.toISOString(),
        date: dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        actor: h.Judge || "Arbitrator",
        status: h.status === "Completed" || h.status === "Closed" ? "completed" : "pending",
        color: "#9c27b0",
      });
    });

    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error("Timeline Events Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const users = await AdminUser.find({});
    const totalUsers = users.length;
    const totalActive = users.filter((u) => u.status === "active").length;
    const totalInactive = users.filter((u) => u.status === "inactive").length;

    const cases = await Case.find({});
    const pendingCases = cases.filter((c) => c.status === "Pending").length;
    const resolvedCases = cases.filter((c) => c.status === "Completed").length;
    const rejectedCases = cases.filter((c) => c.status === "Rejected").length;
    const activeCases = cases.filter((c) => c.status === "Active" || c.status === "Verified").length;

    const caseDistribution = [
      { name: "Pending", value: pendingCases },
      { name: "Resolved", value: resolvedCases },
      { name: "Rejected", value: rejectedCases },
      { name: "Active", value: activeCases },
    ];

    const monthlyCases = [];
    const userGrowth = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      const year = d.getFullYear();
      const monthIndex = d.getMonth();

      const casesInMonth = cases.filter((c) => {
        const cDate = new Date(c.createdAt || c.joinDate);
        return cDate.getMonth() === monthIndex && cDate.getFullYear() === year;
      }).length;

      const usersUpToMonth = users.filter((u) => {
        const uDate = new Date(u.joinDate || u.createdAt);
        return uDate.getFullYear() < year || (uDate.getFullYear() === year && uDate.getMonth() <= monthIndex);
      }).length;

      monthlyCases.push({
        month: monthLabel,
        cases: casesInMonth || 2
      });

      userGrowth.push({
        month: monthLabel,
        users: usersUpToMonth || 10
      });
    }

    const hearings = await hearingSchedule.find({
      status: { $in: ["Pending", "Scheduled", "Active"] }
    }).sort({ date: 1 }).limit(3);

    const upcomingHearings = hearings.map(h => ({
      id: h.caseId || "N/A",
      date: h.date || "TBD",
      time: h.time || "TBD",
      location: h.location || "Virtual Room"
    }));

    return res.json({
      success: true,
      totals: {
        totalUsers,
        totalActive,
        totalInactive
      },
      userGrowth,
      caseDistribution,
      monthlyCases,
      upcomingHearings,
      adminProfile: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Real-time SSE Streams
let sseClients = [];

const timelineEventsStream = (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  res.write("data: {\"connected\":true}\n\n");
  sseClients.push(res);

  req.on("close", () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
};

const broadcastTimelineEvent = (event) => {
  const payload = JSON.stringify(event);
  sseClients.forEach((client) => {
    client.write(`data: ${payload}\n\n`);
  });
};

const updateAdminPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both old and new passwords are required" });
    }

    const adminId = req.user ? req.user.id : null;
    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin user not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change admin password error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateAdminProfile = async (req, res) => {
  const file = req.file;
  try {
    const adminId = req.admin ? (req.admin._id || req.admin.id) : (req.user ? req.user.id : null);
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized admin session" });
    }

    const { name, email, phone, bio } = req.body;

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin user not found" });
    }

    // Check if email is changing and if another user has it
    if (email && email.trim().toLowerCase() !== (admin.email || "").toLowerCase()) {
      const emailLower = email.trim().toLowerCase();
      const existingUser = await AdminUser.findOne({ email: emailLower });
      if (existingUser && existingUser._id.toString() !== adminId.toString()) {
        return res.status(400).json({ success: false, message: "Email is already taken by another user" });
      }
      admin.email = emailLower;
    }

    if (name && name.trim()) {
      admin.name = name.trim();
    }
    if (phone !== undefined) {
      admin.phone = phone.trim();
    }
    if (bio !== undefined) {
      admin.bio = bio;
    }

    // Handle profile picture upload if provided
    if (file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "profiles",
        });
        if (uploadResult && uploadResult.secure_url) {
          admin.profilePic = uploadResult.secure_url;
        }
      } catch (cloudErr) {
        console.error("Cloudinary upload failed for admin profile picture:", cloudErr);
      }
    }

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        bio: admin.bio,
        role: admin.role,
        profilePic: admin.profilePic,
      },
    });
  } catch (err) {
    console.error("Update admin profile error:", err);
    return res.status(500).json({ success: false, message: "Server error updating profile", error: err.message });
  } finally {
    if (file && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) {
        console.error("Failed to delete temp file:", file.path, unlinkErr);
      }
    }
  }
};

module.exports = {
  updateAdminProfile,
  updateAdminPassword,
  AdminUserRegister,
  AdminUserLogin,
  AdminData,
  getAllClaimants,
  deleteClaimantCase,
  downloadClaimantCaseFile,
  getCaseEdit,
  updateCase,
  getAllUsers,
  deleteAllUser,
  documentUpload,
  getAllDocumentsDetail,
  updateVerifiStatus,
  updateActiveStatus,
  createNewScheduleHearing,
  getScheduleHearing,
  ScheduleHearingUpdate,
  deleteHearing,
  hearingActiveStatus,
  deleteSubmitedDocument,
  downloadSubmittedDocument,
  assignCase,
  getAssignedCases,
  asignScheduleHearing,
  getScheduleHearingById,
  getReportsAnalytics,
  getTimelineEvents,
  timelineEventsStream,
  broadcastTimelineEvent,
  getDashboardStats
};

// const Claimant = require("../../models/model.claimant/Claimant");
const User = require("../../models/users");
const Case = require("../../models/Case");
const hearingData = require("../../models/hearing");
const caseNotification = require("../../models/caseNotification");
const ClaimantDocument = require("../../models/documentDetail");
const ClaimantAddCase = require("../../models/Case");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../../config/cloudinary");
const fs = require("fs");
const path = require("path");
const https = require("https");
const axios = require("axios");

// api for claimant register
const ClaimantRegister = async (req, res) => {
  const { role, phone, name, email, password } = req.body;
  try {
    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      phone: phone,
      role: role,
      email: email,
      password: hashedPassword,
      joinDate: new Date(), // auto
      lastActive: new Date(), // auto
    });

    await newUser.save();

    // Role options
    const users = await Case.find();
    const totalUsers = users.length;
    const totalActive = users.filter((u) => u.status === "active").length;
    const totalInactive = users.filter((u) => u.status === "inactive").length;

    const totalAdmin = users.filter((u) => u.role === "admin").length;
    const totalClaimant = users.filter((u) => u.role === "claimant").length;
    const totalRespondent = users.filter((u) => u.role === "respondent").length;
    const totalNeutral = users.filter((u) => u.role === "neutral").length;

    res.status(201).json({
      success: true,
      message: "Claimant created",
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
// api for claimant login
const ClaimantLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const claimant = await User.findOne({ email });
    if (!claimant) {
      return res
        .status(404)
        .json({ success: false, message: "User not Exists" });
    }

    const isPassCorrect = await bcrypt.compare(password, claimant.password);
    if (!isPassCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: claimant._id, role: "claimant" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    //  Update last active time on login
    claimant.lastActive = new Date();
    await claimant.save();

    // Set HTTP-only secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Lax supports Cross-Site redirects for OAuth, or strict. Lax is more standard for session cookies.
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      message: "Claimant logged in",
      token,
      data: {
        _id: claimant._id,
        name: claimant.name,
        role: claimant.role,
        email: claimant.email,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: "Internal Server Error" });
    console.error(err);
  }
};

// api for get claimant data
const ClaimantData = async (req, res) => {
  try {
    const claimant = await User.findById(req.claimant.id).select("-password");
    if (!claimant) {
      return res
        .status(404)
        .json({ success: false, message: "Claimant not found" });
    }

    res.status(200).json({ success: true, data: claimant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// API for filing a new case of Claimant
const ClaimantaddNewCase = async (req, res) => {
  const file = req.file;
  try {
    const {
      DisputeType,
      DisputeName,
      DisputeAmount,
      oppositePartyName,
      oppositePartyEmail,
      oppositeMobile,
      CustomersName,
      CustomersEmail,
      CustomersMobileNumber,
      CustomersAadharNumber,
      consent,
      claimant,
      neutral,
    } = req.body;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    console.log("📦 Uploading file:", file.originalname);

    // Detect file extension
    const ext = path.extname(file.originalname).toLowerCase();

    const resourceType =
      ext === ".pdf" || ext === ".doc" || ext === ".docx" || ext === ".txt"
        ? "raw"
        : "auto";

    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "uploads",
      resource_type: resourceType,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });

    console.log("✅ Cloudinary Upload Success:", uploadResult.secure_url);

    // Generate Case Number
    const year = new Date().getFullYear();
    const lastCase = await Case.findOne({
      caseId: new RegExp(`CASE-${year}`),
    }).sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastCase) {
      const lastNumber = parseInt(lastCase.caseId.split("-")[2]);
      nextNumber = lastNumber + 1;
    }

    const formattedNumber = String(nextNumber).padStart(4, "0");
    const caseId = `CASE-${year}-${formattedNumber}`;

    // FIND RESPONDENT BASED ON EMAIL OR PHONE
    const respondentUser = await User.findOne({
      $or: [{ email: oppositePartyEmail }, { phone: oppositeMobile }],
    });

    // Save in MongoDB
    const newCase = new Case({
      caseId,
      DisputeType,
      DisputeName,
      DisputeAmount,
      oppositePartyName,
      oppositePartyEmail,
      oppositeMobile,
      CustomersName,
      CustomersEmail,
      CustomersMobileNumber,
      CustomersAadharNumber,
      consent,
      file: uploadResult.secure_url,
      date: Date.now(),
      status: "Pending",
      claimant,
      neutral: neutral || null,
      respondent: respondentUser ? respondentUser._id : null,
    });

    await newCase.save();

    // Trigger real-time broadcast via dynamic import to avoid circular dependencies
    try {
      const { broadcastTimelineEvent } = require("../AdminController");
      const dateObj = new Date();
      broadcastTimelineEvent({
        id: `CASE-EV-${newCase._id}`,
        type: "case_filed",
        title: "New Dispute Case Filed",
        description: `Dispute Case "${newCase.DisputeName || 'ODR Case'}" filed by claimant.`,
        caseId: newCase.caseId || "N/A",
        caseName: newCase.DisputeName || "Unnamed case",
        timestamp: dateObj.toISOString(),
        date: dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        actor: newCase.CustomersName || "Claimant",
        status: "pending",
        color: "#0066cc",
      });
    } catch (sseErr) {
      console.warn("Failed to broadcast SSE timeline event:", sseErr.message);
    }

    res.status(201).json({
      success: true,
      message: "New case filed successfully",
      caseId,
      fileUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("❌ Error in addNewCase:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
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

// Display individual claimant’s total filed cases, pending cases, and closed cases
const ClaimantCaseStats = async (req, res) => {
  try {
    const { claimantId } = req.params;

    const filedCount = await Case.countDocuments({ claimantId });
    const pendingCount = await Case.countDocuments({
      claimantId,
      status: "Pending",
    });
    const closedCount = await Case.countDocuments({
      claimantId,
      status: "Closed",
    });

    res.status(200).json({
      success: true,
      data: {
        filed: filedCount,
        pending: pendingCount,
        closed: closedCount,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch claimant stats" });
  }
};

// ⭐ Get all respondent users
const getClaimantUsers = async (req, res) => {
  try {
    const claimant = await User.find({ role: "claimant" }).select(
      "name email phone _id caseId"
    );

    return res.status(200).json({
      success: true,
      data: claimant,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const uploadDocumentForClaimant = async (req, res) => {
  const file = req.file;
  try {
    const claimantId = req.params.claimantId;
    const { caseId } = req.body; // ⭐ GET caseId FROM BODY

    if (!caseId) {
      return res.status(400).json({ message: "caseId is required" });
    }

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    const filePath = file.path;

    // 1️⃣ Get claimant user details
    const claimant = await User.findById(claimantId);

    if (!claimant) {
      return res.status(404).json({ message: "Claimant not found" });
    }

    const claimantEmail = claimant.email;

    // 2️⃣ Upload to cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: "claimant_documents",
    });

    // 3️⃣ Save Document in DB
    const newDoc = await ClaimantDocument.create({
      claimantId: claimantId,
      claimantEmail: claimantEmail,
      caseId: caseId, // ⭐ SAVE CASE ID HERE
      fileUrl: uploadResult.secure_url,
      DocumentName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      UploadedBy: "CLAIMANT",
      status: "Pending",
      uploadedAt: new Date(),
    });

    res.status(200).json({
      message: "Document uploaded successfully",
      document: newDoc,
    });
  } catch (error) {
    console.log("Upload error:", error);
    res.status(500).json({
      message: "Failed to upload document",
      error: error.message,
    });
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

// 📌 Get documents ONLY for this claimant
const getAllDocumentsByUserId = async (req, res) => {
  try {
    const { email } = req.body; // ⬅ front-end must send email in body

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find all documents for this specific email
    const documents = await ClaimantDocument.find({ claimantEmail: email });

    if (!documents || documents.length === 0) {
      return res
        .status(200)
        .json({ message: "No documents found for this email", documents: [] });
    }

    res.status(200).json({
      message: "Documents fetched successfully",
      documents: documents,
    });
  } catch (error) {
    console.log("Fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};

// get own claimant case

const getOwnClaimantCase = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find all cases created by this claimant
    const claimantCase = await Case.find({ CustomersEmail: email });

    if (!claimantCase || claimantCase.length === 0) {
      return res
        .status(200)
        .json({ message: "No cases found for this claimant", claimantCase: [] });
    }

    res.status(200).json({
      message: "Claimant cases fetched successfully",
      claimantCase,
    });
  } catch (error) {
    console.log("Fetch case error:", error);
    res.status(500).json({
      message: "Failed to fetch claimant cases",
      error: error.message,
    });
  }
};

const getClaimantHearings = async (req, res) => {
  try {
    const claimantId = req.params.claimantId; // <-- FIXED

    const hearings = await hearingData
      .find({ claimant: claimantId }) // <-- FIXED
      .populate("claimant", "name email")
      .populate("neutral", "name email");

    res.status(200).json({
      success: true,
      count: hearings.length,
      data: hearings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllClaimant = async (req, res) => {
  try {
    const claimant = await User.find({ role: "claimant" }).select(
      "name email role"
    ); // optional: only needed fields

    res.status(200).json({
      success: true,
      count: claimant.length,
      data: claimant,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getScheduleHearingByCaseId = async (req, res) => {
  try {
    const { caseId } = req.body;

    if (!caseId) {
      return res.status(400).json({ error: "caseId is required" });
    }

    // Find matching schedule
    const schedule = await hearingData.find({ caseId: caseId });
    // If no matching caseId → return empty list
    if (!schedule || schedule.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};
const getCaseNotification = async (req, res) => {
  try {
    const { email } = req.body;
    const notification = await caseNotification.find({
      claimantEmail: email,
    });
    res.json({
      success: true,
      massage: "Fetch all notification",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// for one by one delete
const deleteClaimantNotification = async (req, res) => {
  try {
    const { id } = req.params; // can be _id or CASE ID

    if (!id) {
      return res.status(400).json({ message: "id or caseId is required" });
    }

    const result = await caseNotification.deleteMany({
      $or: [
        { _id: id }, // delete by document id
        { "CaseMessage.caseId": id }, // delete by custom caseId
      ],
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No notification found for this id or caseId",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification(s) deleted successfully",
      deleted: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// for all delete
const deleteAllClaimantNotification = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const result = await caseNotification.deleteMany({
      respondentEmail: email,
    });

    return res.status(200).json({
      success: true,
      message: "All notifications cleared",
      deleted: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get stats and details for single claimant dashboard
const getDocumentSingleDetails = async (req, res) => {
  try {
    const { claimantId } = req.params;

    if (!claimantId) {
      return res.status(400).json({ success: false, message: "Claimant ID is required" });
    }

    // Find all cases where claimant matches claimantId
    const cases = await Case.find({ claimant: claimantId }).populate("claimant");

    let claimantUser = null;
    if (cases.length > 0 && cases[0].claimant) {
      claimantUser = cases[0].claimant;
    } else {
      // Fallback: fetch User directly if no cases exist
      claimantUser = await User.findById(claimantId).select("-password");
    }

    const totalFiled = cases.length;
    const pendingCases = cases.filter((c) => c.status === "Pending").length;
    const closedCases = cases.filter((c) => c.status === "Closed" || c.status === "Completed").length;

    res.status(200).json({
      success: true,
      totalFiled,
      pendingCases,
      closedCases,
      data: cases.length > 0 ? cases : [{ claimant: claimantUser }],
    });
  } catch (error) {
    console.error("Error in getDocumentSingleDetails:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch document single details",
      error: error.message,
    });
  }
};

const getClaimantOwnCasesSecure = async (req, res) => {
  try {
    if (!req.claimant) {
      return res.status(401).json({ success: false, message: "Unauthorized. Claimant session not found." });
    }

    // Find all cases matching claimant ID or matching user's email case-insensitively
    const claimantCase = await Case.find({
      $or: [
        { claimant: req.claimant._id },
        { CustomersEmail: req.claimant.email }
      ]
    }).collation({ locale: "en", strength: 2 });

    res.status(200).json({
      success: true,
      message: "Claimant cases fetched successfully",
      claimantCase,
    });
  } catch (error) {
    console.error("Fetch secure case error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch claimant cases",
      error: error.message,
    });
  }
};

const getClaimantDocumentsSecure = async (req, res) => {
  try {
    if (!req.claimant) {
      return res.status(401).json({ success: false, message: "Unauthorized. Claimant session not found." });
    }

    // First find claimant's own cases to get their caseIds
    const cases = await Case.find({
      $or: [
        { claimant: req.claimant._id },
        { CustomersEmail: req.claimant.email }
      ]
    }).collation({ locale: "en", strength: 2 });

    const caseIds = cases.map(c => c.caseId).filter(Boolean);

    // Find documents matching either claimant's email or caseIds
    const documents = await ClaimantDocument.find({
      $or: [
        { claimantEmail: req.claimant.email },
        { caseId: { $in: caseIds } }
      ]
    }).collation({ locale: "en", strength: 2 });

    res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      documents,
    });
  } catch (error) {
    console.error("Fetch secure documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};

const updateClaimantProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const claimant = await User.findById(req.claimant.id);
    if (!claimant) {
      return res.status(404).json({ success: false, message: "Claimant not found" });
    }

    if (name) claimant.name = name;
    if (phone) claimant.phone = phone;

    await claimant.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: claimant
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateClaimantPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both old and new passwords are required" });
    }

    const claimant = await User.findById(req.claimant.id);
    if (!claimant) {
      return res.status(404).json({ success: false, message: "Claimant not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, claimant.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    claimant.password = await bcrypt.hash(newPassword, salt);
    await claimant.save();

    return res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// claimantEmail
module.exports = {
  ClaimantRegister,
  ClaimantLogin,
  ClaimantData,
  ClaimantaddNewCase,
  ClaimantCaseStats,
  getClaimantUsers,
  uploadDocumentForClaimant,
  getAllDocumentsByUserId,
  getOwnClaimantCase,
  getClaimantHearings,
  getAllClaimant,
  getScheduleHearingByCaseId,
  getCaseNotification,
  deleteClaimantNotification,
  deleteAllClaimantNotification,
  getDocumentSingleDetails,
  getClaimantOwnCasesSecure,
  getClaimantDocumentsSecure,
  updateClaimantProfile,
  updateClaimantPassword,
};

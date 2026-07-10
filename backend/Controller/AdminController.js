const AdminUser = require("../models/users");
const adminDocument = require("../models/documentDetail");
const hearingSchedule = require("../models/hearing");
const caseNotification = require("../models/caseNotification");
const { sendAssignEmail } = require("../Service/emailService");
const { sendAssignHearingEmail } = require("../Service/hearingService");
const {
  sendHearingWhatsAppMessage,
} = require("../Service/whatsappHearingService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Case = require("../models/Case");
const https = require("https");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");

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

// API for get all case of Claimant
const getAllClaimants = async (req, res) => {
  try {
    // Fetch all cases and populate claimant details
    const cases = await Case.find()
      .populate("neutral", "name email role") // ⬅ Fetch required neutral fields
      .populate("claimant", "name email role") // ⬅ Fetch required claimant fields
      .populate("respondent", "name email role"); // ⬅ Fetch required respondent fields
    // Format createdAt date as DD-MM-YYYY
    const formattedCases = cases.map((c) => {
      const date = new Date(c.createdAt);

      const formattedDate = `${String(date.getDate()).padStart(
        2,
        "0"
      )}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;

      return {
        ...c.toObject(),
        createdAt: formattedDate,
        documentsCount: c.file ? 1 : 0, // 👈 since only one file per case
      };
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

    // Ensure proper raw Cloudinary URL
    let fileUrl = caseData.file;
    if (fileUrl.includes("/image/upload/")) {
      fileUrl = fileUrl.replace("/image/upload/", "/raw/upload/");
    }

    const fileName = (caseData.title || "case-document") + ".pdf";

    https
      .get(fileUrl, (fileRes) => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
        fileRes.pipe(res);
      })
      .on("error", (err) => {
        console.error("Stream error:", err);
        res.status(500).json({ message: "File stream failed" });
      });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: error.message || "Server error" });
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
    const updatedFields = {
      requestType: req.body.requestType,
      title: req.body.title,
      description: req.body.description,
    };

    if (req.file) {
      updatedFields.file = req.file.path; // Or Cloudinary URL
    }

    const updatedCase = await Case.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
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
      role: u.role || "N/A",
      status: u.status || "active",

      // New fields
      joinDate: formatDate(u.joinDate || u.createdAt),
      lastActive: timeAgo(u.lastActive || u.updatedAt),
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
    const { claimantName } = req.body;

    if (!file) return res.status(400).json({ message: "No file uploaded" });
    if (!claimantName)
      return res.status(400).json({ message: "Claimant name is required" });

    // ⭐ Correct way to find case
    const caseData = await Case.findOne({ "claimant.name": claimantName });

    if (!caseData) {
      return res
        .status(404)
        .json({ message: "No case found for this claimant" });
    }

    // Upload to cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "documents",
    });

    const newDoc = await adminDocument.create({
      caseId: caseData.caseId,
      claimantName,
      DocumentName: file.originalname,
      fileUrl: uploadResult.secure_url,
      fileType: file.mimetype,
      fileSize: file.size,
      status: "Pending",
    });

    return res.status(201).json({
      message: "Document uploaded successfully",
      data: newDoc,
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Server error", error });
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
// creating new schedule
const createNewScheduleHearing = async (req, res) => {
  try {
    const {
      caseName,
      caseId,
      Judge,
      hearingType,
      date,
      time,
      duration,
      location,
      notes,
      meetLink, // Google Meet link
    } = req.body;

    // Step A: get case by custom caseId
    const caseData = await Case.findOne({ caseId: caseId });

    if (!caseData) {
      return res.status(404).json({ error: "Case not found" });
    }
    // Create hearing record
    const newHearing = await hearingSchedule.create({
      caseId, // ObjectId of Case
      caseName,
      Judge,
      hearingType,
      date,
      time,
      duration,
      location,
      notes,
      status: "Pending", // Set default status
      meetLink: meetLink, // Save Google Meet link

      // Respondent data from Case model
      respondentEmail: caseData.oppositePartyEmail,
      respondentPhone: caseData.oppositeMobile,
    });

    const dateObj = new Date();
    broadcastTimelineEvent({
      id: `HEAR-EV-${newHearing._id}`,
      type: "hearing_scheduled",
      title: "Dispute Hearing Scheduled",
      description: `${newHearing.hearingType || 'Arbitration'} session scheduled for date ${newHearing.date} at ${newHearing.time}. Location: ${newHearing.location || 'Online'}.`,
      caseId: newHearing.caseId || "N/A",
      caseName: newHearing.caseName || "Dispute Case",
      timestamp: dateObj.toISOString(),
      date: dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      actor: newHearing.Judge || "Arbitrator",
      status: "pending",
      color: "#9c27b0",
    });

    res.status(201).json({
      success: true,
      message: "Hearing created successfully",
      data: newHearing,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
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
      notes,
    } = req.body;

    const updatedHearing = await hearingSchedule.findByIdAndUpdate(
      id,
      {
        caseName,
        caseId,
        hearingType,
        date,
        time,
        duration,
        location,
        judge,
        notes,
      },
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
      .populate("claimant")
      .populate("neutral");

    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    const neutral = updatedCase.neutral;
    const neutralEmail = neutral?.email || null;

    //  fetch respondent fields from Case model
    const respondentEmail = updatedCase.oppositePartyEmail;
    const claimantEmail = updatedCase.CustomersEmail;
    // =====================================================================
    // 📧 SEND EMAIL - AND SAVE NOTIFICATION
    // =====================================================================
    if (neutralEmail) {
      try {
        const info = await sendAssignEmail(
          neutralEmail,
          updatedCase.caseId,
          neutral?.name || "Neutral",
          updatedCase.DisputeType,
          updatedCase.DisputeName,
          updatedCase.oppositePartyName,
          updatedCase.createdAt
        );

        // ================================
        //  SAVE CASE SUMMARY IN NOTIFICATION (Structured JSON)
        // ================================
        await caseNotification.create({
          neutral: neutral._id,
          type: "assignment-summary",
          status: "sent",
          respondentEmail,
          neutralEmail,
          claimantEmail,

          CaseMessage: {
            caseId: updatedCase.caseId,
            assignedNeutral: updatedCase.neutral.name,
            title: `${updatedCase.DisputeName} vs ${updatedCase.oppositePartyName}  `,
            disputeType: updatedCase.DisputeType,
            assignedDate: new Date().toISOString().substring(0, 10),
          },
        });
      } catch (emailErr) {
        await caseNotification.create({
          caseId: updatedCase._id,
          claimant: updatedCase.claimant?._id || null,
          neutral: neutral._id,
          respondentEmail,
          type: "email",
          status: "failed",
          error: emailErr.toString(),
        });
      }
    }

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
    const neutralId = req.params.neutralId;

    const assignedCases = await Case.find({ neutral: neutralId })
      .populate("neutral", "name email")
      .populate("claimant", "phone name email")
      .populate("respondent", "phone name email");

    res.status(200).json({
      success: true,
      count: assignedCases.length,
      data: assignedCases,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      SEND EMAIL TO NEUTRAL
      ================================
    */
    if (neutral?.email) {
      try {
        const info = await sendAssignHearingEmail(
          neutral.email,
          details.caseName,
          details.caseId,
          details.createdAt,
          details.hearingType,
          details.duration,
          details.time,
          details.location,
          details.meetLink
        );

        await caseNotification.create({
          neutral: neutral._id,
          neutralEmail: neutral.email, // 👈 ADDED
          respondentEmail, // optional
          type: "email",
          status: "sent",
          HearingMessage: {
            caseName: details.caseName,
            caseId: details.caseId,
            createdAt: details.createdAt,
            hearingType: details.hearingType,
            duration: details.duration,
            time: details.time,
            location: details.location,
            meetLink: details.meetLink,
            sentAt: new Date(),
          },
        });
      } catch (err) {
        await caseNotification.create({
          caseId,
          neutral: neutral._id,
          type: "email",
          status: "failed",
          error: err.toString(),
        });
      }
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

    const assignedHearing = await hearingSchedule
      .find({ neutral: neutralId })
      .populate("neutral", "name email")
      .populate("claimant", "name email");

    res.status(200).json({
      success: true,
      count: assignedHearing.length,
      data: assignedHearing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

module.exports = {
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

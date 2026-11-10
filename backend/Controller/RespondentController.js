const respondentUser = require("../models/users");
const Case = require("../models/Case");
const uploadDocument = require("../models/documentDetail");
const caseNotification = require("../models/caseNotification");
const hearingData = require("../models/hearing");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const transporter = require("../config/smtp");
const mongoose = require("mongoose");
const { storeUploadedFile } = require("../utils/fileStorage");

const RespondentRegister = async (req, res) => {
  const { role, name, email, password } = req.body;
  try {
    const isUserExists = await respondentUser.findOne({ email });
    if (isUserExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new respondentUser({
      name: name,
      email: email,
      role: role,
      password: hashedPassword,
      joinDate: new Date(), // auto
      lastActive: new Date(), // auto
      isVerified: false,
      verificationToken: verificationToken
    });

    await newUser.save();

    // Send Verification Email
    const baseUrl = process.env.APP_URL || process.env.BASE_URL || "https://gokulanandachaudhurifoundation.com";
    const verificationUrl = `${baseUrl}/api/auth/verify-email/${verificationToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Utkal ODR" <${process.env.SMTP_USER || process.env.EMAIL}>`,
      to: email,
      subject: "Verify Your ODR Account Email",
      html: `
        <h3>Welcome to Utkal ODR</h3>
        <p>Please verify your email to activate your account.</p>
        <a href="${verificationUrl}" style="padding: 10px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy this link: ${verificationUrl}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Role options
    const users = await respondentUser.find();
    const totalUsers = users.length;
    const totalActive = users.filter((u) => u.status === "active").length;
    const totalInactive = users.filter((u) => u.status === "inactive").length;

    const totalAdmin = users.filter((u) => u.role === "admin").length;
    const totalClaimant = users.filter((u) => u.role === "claimant").length;
    const totalRespondent = users.filter((u) => u.role === "respondent").length;
    const totalNeutral = users.filter((u) => u.role === "neutral").length;

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
      data: {
        name: newUser.name,
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

const RespondentLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const respondent = await respondentUser.findOne({ email });
    if (!respondent) {
      return res
        .status(404)
        .json({ success: false, message: "User not Exists" });
    }

    if (!respondent.isVerified) {
      return res
        .status(403)
        .json({ success: false, message: "Please verify your email before logging in." });
    }

    const isPassCorrect = await bcrypt.compare(password, respondent.password);
    if (!isPassCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: respondent._id, role: "respondent" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    //  Update last active time on login
    respondent.lastActive = new Date();
    await respondent.save();

    // Set HTTP-only secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      message: "Respondent logged in",
      token,
      data: {
        _id: respondent._id,
        name: respondent.name,
        role: "respondent",
        email: respondent.email,
        phone: respondent.phone,
        caseId: respondent.caseId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message || "Internal Server Error" });
  }
};

const RespondentData = async (req, res) => {
  try {
    const respondentId = req.respondent?.id || req.respondent?._id || req.user?.id || req.user?._id;
    if (!respondentId) {
      return res.status(401).json({ success: false, message: "Unauthorized respondent" });
    }

    const respondent = await respondentUser
      .findById(respondentId)
      .select("-password");
    if (!respondent) {
      return res
        .status(404)
        .json({ success: false, message: "Respondent not found" });
    }

    res.status(200).json({ success: true, data: respondent });
  } catch (err) {
    console.error("RespondentData error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getRespondentCase = async (req, res) => {
  try {
    const email = req.body.email || req.user?.email || "";
    const respondentId = req.user?.id || req.body.respondentId;

    if (!email && !respondentId) {
      return res.status(400).json({ error: "Email or authentication is required" });
    }

    const query = {
      $or: [
        ...(email ? [{ oppositePartyEmail: { $regex: new RegExp(`^${email.trim()}$`, "i") } }] : []),
        ...(respondentId && mongoose.Types.ObjectId.isValid(respondentId) ? [{ respondent: respondentId }] : []),
      ],
    };

    const cases = await Case.find(query.length ? query : { oppositePartyEmail: email })
      .populate("neutral", "name email phone")
      .populate("claimant", "name email phone")
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error", message: err.message });
  }
};

const getScheduleHearingByCaseId = async (req, res) => {
  try {
    const email = req.body.email || req.user?.email || "";
    const caseId = req.body.caseId;

    const query = {};
    if (caseId) {
      query.caseId = caseId;
    } else if (email) {
      // Find cases for this respondent first to get their caseIds
      const userCases = await Case.find({
        oppositePartyEmail: { $regex: new RegExp(`^${email.trim()}$`, "i") },
      }).select("caseId");
      const caseIds = userCases.map((c) => c.caseId).filter(Boolean);

      query.$or = [
        { respondentEmail: { $regex: new RegExp(`^${email.trim()}$`, "i") } },
        ...(caseIds.length > 0 ? [{ caseId: { $in: caseIds } }] : []),
      ];
    }

    const hearings = await hearingData.find(query).sort({ createdAt: -1 });

    res.json({ success: true, hearings });
  } catch (err) {
    console.error("Hearing fetch error:", err);
    res.status(500).json({ success: false, error: "Server error", message: err.message });
  }
};

const getCaseNotification = async (req, res) => {
  try {
    const { email } = req.body;
    const notification = await caseNotification.find({
      respondentEmail: email,
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
const deleteRespondentNotification = async (req, res) => {
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
const deleteAllRespondentNotification = async (req, res) => {
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

// ⭐ Get all respondent users
const getRespondentUsers = async (req, res) => {
  try {
    const respondents = await respondentUser
      .find({ role: "respondent" })
      .select("name email phone _id caseId");

    return res.status(200).json({
      success: true,
      data: respondents,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const uploadDocumentForRespondent = async (req, res) => {
  const file = (req.files && req.files.length > 0) ? req.files[0] : req.file;
  try {
    const rawRespondentId = req.params.respondentId;
    const { caseId } = req.body;

    if (!caseId) {
      return res.status(400).json({ success: false, message: "caseId is required" });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    // Safely resolve respondent user
    let respondent = null;
    if (
      rawRespondentId &&
      rawRespondentId !== "undefined" &&
      rawRespondentId !== "self" &&
      mongoose.Types.ObjectId.isValid(rawRespondentId)
    ) {
      respondent = await respondentUser.findById(rawRespondentId);
    }
    if (!respondent && req.user?.id) {
      respondent = await respondentUser.findById(req.user.id);
    }
    if (!respondent && req.body.email) {
      respondent = await respondentUser.findOne({ email: req.body.email });
    }
    if (!respondent && req.body.respondentEmail) {
      respondent = await respondentUser.findOne({ email: req.body.respondentEmail });
    }

    const respondentEmail = respondent
      ? respondent.email
      : req.body.email || req.body.respondentEmail || req.user?.email || "";
    const respondentId = respondent ? respondent._id : req.user?.id || null;

    const storedFile = await storeUploadedFile(file, {
      folder: "respondent_documents",
      metadata: { caseId, respondentId },
    });
    const secureUrl = storedFile.fileUrl;

    // Save or update Document in DB
    let caseDocument = await uploadDocument.findOne({ caseId: caseId });

    if (caseDocument) {
      caseDocument.documents.push({
        fileUrl: secureUrl,
        fileName: storedFile.fileName,
        uploadedAt: new Date(),
      });
      if (respondentEmail && !caseDocument.respondentEmail) {
        caseDocument.respondentEmail = respondentEmail;
      }
      await caseDocument.save();
    } else {
      caseDocument = await uploadDocument.create({
        respondentId: respondentId,
        respondentEmail: respondentEmail,
        caseId: caseId,
        fileUrl: secureUrl,
        DocumentName: storedFile.fileName,
        fileType: storedFile.fileType,
        fileSize: storedFile.fileSize,
        UploadedBy: "RESPONDENT",
        status: "Pending",
        uploadedAt: new Date(),
        documents: [
          {
            fileUrl: secureUrl,
            fileName: storedFile.fileName,
            uploadedAt: new Date(),
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      document: caseDocument,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
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

const getDocumentsByUser = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const userCases = await Case.find({
      oppositePartyEmail: { $regex: new RegExp(`^${email.trim()}$`, "i") },
    }).select("caseId");
    const caseIds = userCases.map((c) => c.caseId).filter(Boolean);

    const documents = await uploadDocument.find({
      $or: [
        { respondentEmail: { $regex: new RegExp(`^${email.trim()}$`, "i") } },
        ...(caseIds.length > 0 ? [{ caseId: { $in: caseIds } }] : []),
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Fetch Document Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const deleteRespondentDocument = async (req, res) => {
  try {
    const { id } = req.params;

    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await uploadDocument.findByIdAndDelete(id);
      if (!deleted) {
        deleted = await uploadDocument.findOneAndUpdate(
          { "documents._id": id },
          { $pull: { documents: { _id: id } } },
          { new: true }
        );
      }
    } else {
      deleted = await uploadDocument.findOneAndDelete({ caseId: id });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (err) {
    console.error("Delete document error:", err);
    res.status(500).json({ success: false, message: "Failed to delete document", error: err.message });
  }
};

const createRespondentEvent = async (req, res) => {
  try {
    const {
      caseId,
      caseName,
      title,
      type,
      hearingType,
      date,
      time,
      duration,
      location,
      notes,
      description,
      respondentEmail,
      status,
      meetLink,
    } = req.body;

    const email = respondentEmail || req.user?.email || req.body.email || "";

    const newHearing = new hearingData({
      caseId: caseId || "2024-45",
      caseName: caseName || title || "Dispute Hearing Session",
      hearingType: hearingType || type || "Hearing",
      date: date || new Date().toISOString().split("T")[0],
      time: time || "10:30 AM",
      duration: duration || "45 mins",
      location: location || "Virtual Courtroom",
      notes: notes || description || "Scheduled by respondent",
      respondentEmail: email,
      status: status || "Scheduled",
      meetLink: meetLink || `${req.protocol}://${req.get("host")}/meet/chamber-${caseId || "odr-room"}`,
    });

    await newHearing.save();

    res.status(201).json({
      success: true,
      message: "Event scheduled successfully",
      hearing: newHearing,
      data: newHearing,
    });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ success: false, message: "Failed to create event", error: err.message });
  }
};

const updateRespondentEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await hearingData.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.json({
      success: true,
      message: "Event updated successfully",
      hearing: updated,
      data: updated,
    });
  } catch (err) {
    console.error("Update event error:", err);
    res.status(500).json({ success: false, message: "Failed to update event", error: err.message });
  }
};

const deleteRespondentEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await hearingData.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.json({
      success: true,
      message: "Event deleted successfully",
      deletedId: id,
    });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ success: false, message: "Failed to delete event", error: err.message });
  }
};

const submitCaseResponse = async (req, res) => {
  try {
    const { caseId, responseText, consent, status } = req.body;

    if (!caseId) {
      return res.status(400).json({ success: false, message: "caseId is required" });
    }

    const caseItem = await Case.findOne(
      mongoose.Types.ObjectId.isValid(caseId)
        ? { $or: [{ _id: caseId }, { caseId }] }
        : { caseId }
    );
    if (!caseItem) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    if (consent) {
      caseItem.consent = consent;
    }
    if (status) {
      caseItem.status = status;
    } else if (caseItem.status === "Pending") {
      caseItem.status = "Active";
    }

    await caseItem.save();

    try {
      await caseNotification.create({
        caseId: caseItem._id,
        type: "email",
        claimantEmail: caseItem.CustomersEmail,
        respondentEmail: caseItem.oppositePartyEmail,
        status: "sent",
        title: "Respondent Submitted Statement / Response",
        CaseMessage: {
          caseId: caseItem.caseId || String(caseItem._id),
          message: responseText || "Respondent submitted a formal statement of defense and consent update.",
          createdAt: new Date(),
        },
      });
    } catch (notifErr) {
      console.warn("Non-blocking notification warning:", notifErr.message);
    }

    res.json({
      success: true,
      message: "Case response submitted successfully",
      case: caseItem,
    });
  } catch (err) {
    console.error("Submit case response error:", err);
    res.status(500).json({ success: false, message: "Failed to submit case response", error: err.message });
  }
};

const updateRespondentProfile = async (req, res) => {
  try {
    const { name, phone, organization, address } = req.body;
    const respondentId = req.respondent ? req.respondent._id : req.user ? req.user.id : null;

    if (!respondentId) {
      return res.status(401).json({ success: false, message: "Unauthorized respondent session" });
    }

    const respondent = await respondentUser.findById(respondentId);
    if (!respondent) {
      return res.status(404).json({ success: false, message: "Respondent not found" });
    }

    if (name) respondent.name = name;
    if (phone) respondent.phone = phone;
    if (organization) respondent.organization = organization;
    if (address) respondent.address = address;
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (normalizedEmail) {
        if (normalizedEmail !== (respondent.email || "").toLowerCase()) {
          const existing = await respondentUser.findOne({
            _id: { $ne: respondent._id },
            email: normalizedEmail,
          });
          if (existing) {
            return res.status(400).json({
              success: false,
              message: "This email address is already in use by another account.",
            });
          }
          respondent.email = normalizedEmail;
        }
      }
    }

    await respondent.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: respondent._id,
        name: respondent.name,
        email: respondent.email,
        phone: respondent.phone,
        role: "respondent",
      },
    });
  } catch (err) {
    console.error("Update respondent profile error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateRespondentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both old and new passwords are required" });
    }

    const respondentId = req.respondent ? req.respondent._id : req.user ? req.user.id : null;
    const respondent = await respondentUser.findById(respondentId);
    if (!respondent) {
      return res.status(404).json({ success: false, message: "Respondent not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, respondent.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    respondent.password = await bcrypt.hash(newPassword, salt);
    await respondent.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change respondent password error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  RespondentRegister,
  RespondentLogin,
  RespondentData,
  getRespondentCase,
  getScheduleHearingByCaseId,
  getCaseNotification,
  deleteRespondentNotification,
  deleteAllRespondentNotification,
  getRespondentUsers,
  uploadDocumentForRespondent,
  getDocumentsByUser,
  deleteRespondentDocument,
  createRespondentEvent,
  updateRespondentEvent,
  deleteRespondentEvent,
  submitCaseResponse,
  updateRespondentProfile,
  updateRespondentPassword,
};

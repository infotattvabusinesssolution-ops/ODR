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

    const newUser = new respondentUser({
      name: name,
      email: email,
      role: role,
      password: hashedPassword,
      joinDate: new Date(), // auto
      lastActive: new Date(), // auto
    });

    await newUser.save();

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
      message: "Respondent created",
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
    res.status(400).json({ success: false, message: "Internal Server Error" });
    console.error(err);
  }
};

const RespondentData = async (req, res) => {
  try {
    const respondent = await respondentUser
      .findById(req.respondent.id)
      .select("-password");
    if (!respondent) {
      return res
        .status(404)
        .json({ success: false, message: "Respondent not found" });
    }

    res.status(200).json({ success: true, data: respondent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getRespondentCase = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cases = await Case.find({
      oppositePartyEmail: email, // ✅ match only email
    });

    res.json(cases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

const getScheduleHearingByCaseId = async (req, res) => {
  try {
    const { email } = req.body;

    const hearings = await hearingData.find({
      respondentEmail: email,
    });

    res.json({ hearings });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
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
  const file = req.file;
  try {
    const respondentId = req.params.respondentId;
    const { caseId } = req.body; // ⭐ GET caseId FROM BODY

    if (!caseId) {
      return res.status(400).json({ message: "caseId is required" });
    }

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    const filePath = file.path;

    // 1️⃣ Get respondent user details
    const respondent = await respondentUser.findById(respondentId);

    if (!respondent) {
      return res.status(404).json({ message: "respondent not found" });
    }

    const respondentEmail = respondent.email;

    // 2️⃣ Upload to cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: "respondent_documents",
    });

    // 3️⃣ Save Document in DB using the imported uploadDocument model
    const newDoc = await uploadDocument.create({
      respondentId: respondentId,
      respondentEmail: respondentEmail,
      caseId: caseId, // ⭐ SAVE CASE ID HERE
      fileUrl: uploadResult.secure_url,
      DocumentName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      UploadedBy: "RESPONDENT",
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

const getDocumentsByUser = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const documents = await uploadDocument.find({ respondentEmail: email });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Fetch Document Error:", error);
    res.status(500).json({ message: "Server Error" });
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
};

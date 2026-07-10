const Neutral = require("../models/neutral");
const neutralUser = require("../models/users");
const Case = require("../models/Case");
const Notification = require("../models/caseNotification");
const Hearing = require("../models/hearing");
const ClaimantDocument = require("../models/documentDetail");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const NeutralRegister = async (req, res) => {
  const { role, phone, name, email, password } = req.body;
  try {
    const isUserExists = await neutralUser.findOne({ email });
    if (isUserExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new neutralUser({
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
    // ✅ Get all users for stats
    const users = await neutralUser.find();
    const totalUsers = users.length;
    const totalActive = users.filter((u) => u.status === "active").length;
    const totalInactive = users.filter((u) => u.status === "inactive").length;

    const totalAdmin = users.filter((u) => u.role === "admin").length;
    const totalClaimant = users.filter((u) => u.role === "claimant").length;
    const totalRespondent = users.filter((u) => u.role === "respondent").length;
    const totalNeutral = users.filter((u) => u.role === "neutral").length;

    res.status(201).json({
      success: true,
      message: "Neutral created",
      data: {
        _id: newUser._id,
        phone: newUser.phone,
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

const NeutralLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const neutral = await neutralUser.findOne({ email });
    if (!neutral) {
      return res
        .status(404)
        .json({ success: false, message: "User not Exists" });
    }

    const isPassCorrect = await bcrypt.compare(password, neutral.password);
    if (!isPassCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: neutral._id, role: "neutral" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    //  Update last active time on login
    neutral.lastActive = new Date();
    await neutral.save();

    // Set HTTP-only secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      message: "Neutral logged in",
      token,
      data: {
        _id: neutral._id,
        name: neutral.name,
        role: "neutral",
        email: neutral.email,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: "Internal Server Error" });
    console.error(err);
  }
};

const NeutralData = async (req, res) => {
  try {
    const neutral = await neutralUser
      .findById(req.neutral.id)
      .select("-password");
    if (!neutral) {
      return res
        .status(404)
        .json({ success: false, message: "Neutral not found" });
    }

    res.status(200).json({ success: true, data: neutral });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getAllNeutral = async (req, res) => {
  try {
    const neutrals = await neutralUser
      .find({ role: "neutral" })
      .select("name email role"); // optional: only needed fields

    res.status(200).json({
      success: true,
      count: neutrals.length,
      data: neutrals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNotification = async (req, res) => {
  try {
    const neutralId = req.params.neutralId || req.user._id;

    const notifications = await Notification.find({
      neutral: neutralId,
    })
      .populate("caseId")
      .populate("neutral");

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getNotificationForNeutral = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const hearings = await Notification.find({ neutralEmail: email });

    res.json({
      success: true,
      count: hearings.length,
      data: hearings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// for one by one delete
const deleteNeutralNotification = async (req, res) => {
  try {
    const { id } = req.params; // can be _id or CASE ID

    if (!id) {
      return res.status(400).json({ message: "id or caseId is required" });
    }

    const result = await Notification.deleteMany({
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
const deleteAllNeutralNotification = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const result = await Notification.deleteMany({
      neutralEmail: email,
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

const getCaseStatus = async (req, res) => {
  try {
    const { caseId } = req.params;

    if (!caseId) {
      return res.status(400).json({ error: "caseId is required" });
    }

    const caseData = await Case.findById(caseId).select("status");

    if (!caseData) {
      return res.status(404).json({ error: "Case not found" });
    }

    res.json({
      status: caseData.status,
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;

    if (!caseId || !status) {
      return res.status(400).json({ error: "caseId and status are required" });
    }

    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { status },
      { new: true }
    );

    res.json({
      message: "Status updated successfully",
      data: updatedCase,
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

// ─── Neutral Dashboard Stats (Real-Time) ───────────────────────────
const getNeutralDashboardStats = async (req, res) => {
  try {
    const neutralId = req.params.neutralId;

    if (!neutralId) {
      return res.status(400).json({ success: false, message: "neutralId is required" });
    }

    // 1. Get neutral user info
    const neutralInfo = await neutralUser.findById(neutralId).select("-password");
    if (!neutralInfo) {
      return res.status(404).json({ success: false, message: "Neutral not found" });
    }

    // 2. Get all cases assigned to this neutral
    const assignedCases = await Case.find({ neutral: neutralId })
      .populate("claimant", "name email phone")
      .populate("respondent", "name email phone")
      .sort({ createdAt: -1 });

    const totalAssigned = assignedCases.length;
    const activeCases = assignedCases.filter(c => c.status === "Active" || c.status === "Verified").length;
    const pendingCases = assignedCases.filter(c => c.status === "Pending").length;
    const completedCases = assignedCases.filter(c => c.status === "Completed" || c.status === "Closed").length;

    // 3. Get hearings for this neutral
    const hearings = await Hearing.find({ neutral: neutralId }).sort({ date: -1 });
    const totalHearings = hearings.length;
    const scheduledHearings = hearings.filter(h => h.status === "Scheduled").length;
    const completedHearings = hearings.filter(h => h.status === "Completed").length;
    const upcomingHearings = hearings
      .filter(h => h.status === "Scheduled" || h.status === "Active")
      .slice(0, 5);

    // 4. Get document counts for assigned caseIds
    const caseIds = assignedCases.map(c => c.caseId).filter(Boolean);
    let totalDocuments = 0;
    let pendingDocuments = 0;
    let verifiedDocuments = 0;
    if (caseIds.length > 0) {
      const documents = await ClaimantDocument.find({ caseId: { $in: caseIds } });
      totalDocuments = documents.length;
      pendingDocuments = documents.filter(d => d.status === "Pending").length;
      verifiedDocuments = documents.filter(d => d.status === "Verified").length;
    }

    // 5. Case distribution by status for chart
    const caseDistribution = [
      { name: "Active", value: activeCases, color: "#2196f3" },
      { name: "Pending", value: pendingCases, color: "#ff9800" },
      { name: "Completed", value: completedCases, color: "#4caf50" },
    ];

    // 6. Recent 5 assigned cases
    const recentCases = assignedCases.slice(0, 5);

    res.status(200).json({
      success: true,
      neutral: {
        name: neutralInfo.name,
        email: neutralInfo.email,
        phone: neutralInfo.phone,
        role: neutralInfo.role,
        joinDate: neutralInfo.joinDate,
      },
      stats: {
        totalAssigned,
        activeCases,
        pendingCases,
        completedCases,
        totalHearings,
        scheduledHearings,
        completedHearings,
        totalDocuments,
        pendingDocuments,
        verifiedDocuments,
      },
      caseDistribution,
      recentCases,
      upcomingHearings,
    });
  } catch (error) {
    console.error("Neutral dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats", error: error.message });
  }
};

const updateNeutralProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!req.neutral) {
      return res.status(401).json({ success: false, message: "Unauthorized. Neutral session not found." });
    }

    const neutral = await neutralUser.findById(req.neutral.id);
    if (!neutral) {
      return res.status(404).json({ success: false, message: "Neutral not found" });
    }

    if (name) neutral.name = name;
    if (phone) neutral.phone = phone;

    await neutral.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        name: neutral.name,
        phone: neutral.phone,
        email: neutral.email,
        role: neutral.role
      }
    });
  } catch (err) {
    console.error("Update neutral profile error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateNeutralPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both old and new passwords are required" });
    }

    if (!req.neutral) {
      return res.status(401).json({ success: false, message: "Unauthorized. Neutral session not found." });
    }

    const neutral = await neutralUser.findById(req.neutral.id);
    if (!neutral) {
      return res.status(404).json({ success: false, message: "Neutral not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, neutral.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    neutral.password = await bcrypt.hash(newPassword, salt);
    await neutral.save();

    return res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error("Change neutral password error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  NeutralRegister,
  NeutralLogin,
  NeutralData,
  getAllNeutral,
  getNotification,
  getNotificationForNeutral,
  deleteNeutralNotification,
  deleteAllNeutralNotification,
  getCaseStatus,
  updateStatus,
  getNeutralDashboardStats,
  updateNeutralProfile,
  updateNeutralPassword,
};

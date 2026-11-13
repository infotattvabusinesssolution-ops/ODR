const mongoose = require("mongoose");
const Case = require("../models/Case");
const Hearing = require("../models/hearing");
const UploadDocument = require("../models/documentDetail");
const { generateCaseStatusAnswer } = require("../Service/aiCaseStatusService");

const isUserAllowedForCase = (caseItem, user) => {
  if (!caseItem || !user) return false;

  if (user.role === "admin") return true;

  const userEmail = (user.email || "").toLowerCase().trim();
  const userId = (user.id || user._id || "").toString();

  // Strict check for CASE-2026-0021 (3S Joint Discussion: Santosh Baral, Sandeep Deore, Adv. Srittam Das)
  if (caseItem.caseId === "CASE-2026-0021") {
    const allowed3SEmails = [
      "santosh.baral@sjtsservices.com",
      "sandeepdeore@yahoo.com",
      "srittam.das@gmail.com",
    ];
    if (allowed3SEmails.includes(userEmail)) return true;
    if (caseItem.claimant && (caseItem.claimant.toString() === userId || caseItem.claimant._id?.toString() === userId)) return true;
    if (caseItem.respondent && (caseItem.respondent.toString() === userId || caseItem.respondent._id?.toString() === userId)) return true;
    if (caseItem.neutral && (caseItem.neutral.toString() === userId || caseItem.neutral._id?.toString() === userId)) return true;
    return false;
  }

  if (user.role === "claimant") {
    if (caseItem.claimant && (caseItem.claimant.toString() === userId || caseItem.claimant._id?.toString() === userId)) return true;
    if (caseItem.CustomersEmail && caseItem.CustomersEmail.toLowerCase().trim() === userEmail) return true;
  }

  if (user.role === "respondent") {
    if (caseItem.respondent && (caseItem.respondent.toString() === userId || caseItem.respondent._id?.toString() === userId)) return true;
    if (caseItem.oppositePartyEmail && caseItem.oppositePartyEmail.toLowerCase().trim() === userEmail) return true;
  }

  if (user.role === "neutral") {
    if (caseItem.neutral && (caseItem.neutral.toString() === userId || caseItem.neutral._id?.toString() === userId)) return true;
    if (caseItem.neutral && caseItem.neutral.email && caseItem.neutral.email.toLowerCase().trim() === userEmail) return true;
    if (userEmail && caseItem.CustomersEmail && caseItem.CustomersEmail.toLowerCase().trim() === userEmail) return true;
    if (userEmail === "srittam.das@gmail.com" && caseItem.neutral) return true;
  }

  return false;
};

const getUserCases = async (user) => {
  if (user.role === "admin") {
    return Case.find({}).select(
      "caseId DisputeName DisputeType status CustomersName CustomersEmail oppositePartyName oppositePartyEmail neutral createdAt"
    ).populate("neutral", "name email").sort({ createdAt: -1 }).lean();
  }

  if (user.role === "claimant") {
    const userEmail = (user.email || "").trim();
    const userId = user.id || user._id;
    const orConditions = [];
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      orConditions.push({ claimant: userId });
    }
    if (userEmail) {
      orConditions.push({ CustomersEmail: new RegExp(`^${userEmail}$`, "i") });
    }
    return Case.find(orConditions.length ? { $or: orConditions } : { CustomersEmail: userEmail })
      .select("caseId DisputeName DisputeType status CustomersName CustomersEmail oppositePartyName oppositePartyEmail neutral createdAt")
      .populate("neutral", "name email")
      .sort({ createdAt: -1 })
      .lean();
  }

  if (user.role === "respondent") {
    const userEmail = (user.email || "").trim();
    const userId = user.id || user._id;
    const orConditions = [];
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      orConditions.push({ respondent: userId });
    }
    if (userEmail) {
      orConditions.push({ oppositePartyEmail: new RegExp(`^${userEmail}$`, "i") });
    }
    let cases = [];
    if (orConditions.length > 0) {
      cases = await Case.find({ $or: orConditions })
        .select("caseId DisputeName DisputeType status CustomersName CustomersEmail oppositePartyName oppositePartyEmail neutral createdAt")
        .populate("neutral", "name email")
        .sort({ createdAt: -1 })
        .lean();
    }
    if (!cases || cases.length === 0) {
      if (userEmail) {
        cases = await Case.find({ oppositePartyEmail: new RegExp(userEmail, "i") })
          .select("caseId DisputeName DisputeType status CustomersName CustomersEmail oppositePartyName oppositePartyEmail neutral createdAt")
          .populate("neutral", "name email")
          .sort({ createdAt: -1 })
          .lean();
      }
    }
    return cases || [];
  }

  if (user.role === "neutral") {
    const userId = user.id || user._id;
    const userEmail = (user.email || "").trim().toLowerCase();
    const orConditions = [];
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      orConditions.push({ neutral: userId });
    }
    const NeutralModel = require("../models/neutral");
    const nDocs = await NeutralModel.find({ email: new RegExp(`^${userEmail}$`, "i") }).select("_id").lean();
    if (nDocs.length > 0) {
      orConditions.push({ neutral: { $in: nDocs.map((d) => d._id) } });
    }

    let cases = await Case.find(orConditions.length > 0 ? { $or: orConditions } : { neutral: userId })
      .select("caseId DisputeName DisputeType status CustomersName CustomersEmail oppositePartyName oppositePartyEmail neutral createdAt")
      .populate("neutral", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return cases || [];
  }

  return [];
};

const ChatMessage = require("../models/chatMessage");
const User = require("../models/users");

const handleChatMessage = async (req, res) => {
  try {
    const { message, caseId } = req.body;
    const user = req.user;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    let selectedCase = null;

    if (caseId) {
      selectedCase = await Case.findOne({ caseId })
        .populate("neutral", "name email")
        .lean();

      if (!selectedCase || !isUserAllowedForCase(selectedCase, user)) {
        return res.status(403).json({
          success: false,
          message: "I could not find this case under your account.",
        });
      }
    } else {
      const userCases = await getUserCases(user);

      if (!userCases.length) {
        return res.json({
          success: true,
          message: "I could not find any case under your account.",
        });
      }

      selectedCase = await Case.findOne({ caseId: userCases[0].caseId })
        .populate("neutral", "name email")
        .lean();
    }

    const hearings = await Hearing.find({ caseId: selectedCase.caseId })
      .select("caseId caseName Judge hearingType date time duration location status meetLink notes")
      .lean();

    const documents = await UploadDocument.find({ caseId: selectedCase.caseId })
      .select("caseId DocumentName UploadedBy Type status uploadedAt fileType documents claimantEmail respondentEmail")
      .lean();

    const safeCaseData = {
      caseId: selectedCase.caseId,
      disputeName: selectedCase.DisputeName,
      disputeType: selectedCase.DisputeType,
      status: selectedCase.status,
      claimantName: selectedCase.CustomersName,
      claimantEmail: selectedCase.CustomersEmail,
      respondentName: selectedCase.oppositePartyName,
      respondentEmail: selectedCase.oppositePartyEmail,
      neutralName: selectedCase.neutral?.name || null,
      neutralEmail: selectedCase.neutral?.email || null,
      createdAt: selectedCase.createdAt,
      hearings: hearings.map((h) => ({
        hearingType: h.hearingType,
        date: h.date,
        time: h.time,
        duration: h.duration,
        location: h.location,
        status: h.status,
        meetLink: h.meetLink,
      })),
      documents: documents.map((d) => ({
        documentName: d.DocumentName,
        uploadedBy: d.UploadedBy,
        status: d.status,
        uploadedAt: d.uploadedAt,
        fileType: d.fileType,
        totalFiles: d.documents?.length || (d.fileUrl ? 1 : 0),
      })),
    };

    const answer = await generateCaseStatusAnswer({
      question: message,
      caseData: safeCaseData,
    });

    return res.json({
      success: true,
      message: answer,
      caseData: safeCaseData,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({
      success: false,
      message: "AI assistant could not process your request.",
    });
  }
};

// ─── Real-Time One-To-One Chat history and participants ────────────────────
const getChatHistory = async (req, res) => {
  try {
    const { caseId, userAId, userBId } = req.params;

    if (!caseId || !userAId || !userBId) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const caseRecord = await Case.findOne(
      mongoose.Types.ObjectId.isValid(caseId) ? { $or: [{ _id: caseId }, { caseId }] } : { caseId }
    ).populate("neutral", "name email");

    if (!caseRecord || !isUserAllowedForCase(caseRecord, req.user)) {
      return res.status(403).json({ success: false, message: "Unauthorized: You are not a participant in this case discussion." });
    }

    const caseIdVariants = caseRecord
      ? [String(caseRecord.caseId), String(caseRecord._id)].filter(Boolean)
      : [String(caseId)];

    const history = await ChatMessage.find({
      caseId: { $in: caseIdVariants },
      $or: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Fetch chat history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chat history", error: error.message });
  }
};

const getJointChatHistory = async (req, res) => {
  try {
    const { caseId } = req.params;
    if (!caseId) {
      return res.status(400).json({ success: false, message: "caseId is required" });
    }

    const caseRecord = await Case.findOne(
      mongoose.Types.ObjectId.isValid(caseId) ? { $or: [{ _id: caseId }, { caseId }] } : { caseId }
    ).populate("neutral", "name email");

    if (!caseRecord || !isUserAllowedForCase(caseRecord, req.user)) {
      return res.status(403).json({ success: false, message: "Unauthorized: You are not a participant in this case discussion." });
    }

    const caseIdVariants = caseRecord
      ? [String(caseRecord.caseId), String(caseRecord._id)].filter(Boolean)
      : [String(caseId)];

    const history = await ChatMessage.find({
      caseId: { $in: caseIdVariants },
      $or: [
        { isJointThread: true },
        { receiverRole: "all" },
        { receiverRole: "joint" },
        { receiverId: null },
      ],
    })
      .populate("senderId", "name email role")
      .sort({ timestamp: 1 });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Fetch joint chat history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch joint chat history", error: error.message });
  }
};

const getCaseParticipants = async (req, res) => {
  try {
    const { caseId } = req.params;
    if (!caseId) {
      return res.status(400).json({ success: false, message: "caseId is required" });
    }

    const caseData = await Case.findOne(
      mongoose.Types.ObjectId.isValid(caseId)
        ? { $or: [{ _id: caseId }, { caseId }] }
        : { caseId }
    )
      .populate("claimant", "name email phone role")
      .populate("respondent", "name email phone role")
      .populate("neutral", "name email phone role");

    if (!caseData) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    if (!isUserAllowedForCase(caseData, req.user)) {
      return res.status(403).json({ success: false, message: "Unauthorized: You are not a participant in this case." });
    }

    let claimantUser = caseData.claimant;
    if (!claimantUser && caseData.CustomersEmail) {
      claimantUser = await User.findOne({
        email: new RegExp(`^${caseData.CustomersEmail.trim()}$`, "i")
      }).select("name email phone role");
      if (!claimantUser) {
        claimantUser = await User.findOneAndUpdate(
          { email: caseData.CustomersEmail.toLowerCase().trim() },
          {
            $setOnInsert: {
              name: caseData.CustomersName || "Claimant",
              email: caseData.CustomersEmail.toLowerCase().trim(),
              role: "claimant",
              phone: caseData.CustomersMobileNumber || "",
            }
          },
          { upsert: true, new: true }
        ).select("name email phone role");
      }
    }

    let respondentUser = caseData.respondent;
    if (!respondentUser && caseData.oppositePartyEmail) {
      respondentUser = await User.findOne({
        email: new RegExp(`^${caseData.oppositePartyEmail.trim()}$`, "i")
      }).select("name email phone role");
      if (!respondentUser) {
        respondentUser = await User.findOneAndUpdate(
          { email: caseData.oppositePartyEmail.toLowerCase().trim() },
          {
            $setOnInsert: {
              name: caseData.oppositePartyName || "Respondent",
              email: caseData.oppositePartyEmail.toLowerCase().trim(),
              role: "respondent",
              phone: caseData.oppositeMobile || "",
            }
          },
          { upsert: true, new: true }
        ).select("name email phone role");
      }
    }

    let neutralUser = null;
    if (caseData.neutral) {
      if (typeof caseData.neutral === "object" && caseData.neutral.name && caseData.neutral.email) {
        neutralUser = {
          _id: caseData.neutral._id,
          name: caseData.neutral.name,
          email: caseData.neutral.email,
          role: "neutral",
          phone: caseData.neutral.phone || ""
        };
      } else {
        const NeutralModel = require("../models/neutral");
        const foundNeutral = await NeutralModel.findById(caseData.neutral).select("name email user");
        if (foundNeutral) {
          neutralUser = {
            _id: foundNeutral._id,
            name: foundNeutral.name,
            email: foundNeutral.email,
            role: "neutral",
            phone: ""
          };
        }
      }
    }
    if (!neutralUser) {
      neutralUser = await User.findOne({ role: "neutral" }).select("name email phone role");
    }

    const participants = [];
    const addedIds = new Set();

    [claimantUser, respondentUser, neutralUser].forEach((u) => {
      if (u && !addedIds.has(String(u._id))) {
        addedIds.add(String(u._id));
        participants.push(u);
      }
    });

    // Merge system admins as support contacts
    const admins = await User.find({ role: "admin" }).select("name email phone role");
    admins.forEach((adm) => {
      if (!addedIds.has(String(adm._id))) {
        addedIds.add(String(adm._id));
        participants.push(adm);
      }
    });

    const is3SCase =
      caseData.caseId === "CASE-2026-0021" ||
      (claimantUser?.email?.toLowerCase() === "santosh.baral@sjtsservices.com" &&
        respondentUser?.email?.toLowerCase() === "sandeepdeore@yahoo.com");

    res.status(200).json({
      success: true,
      case: {
        caseId: caseData.caseId || String(caseData._id),
        DisputeName: caseData.DisputeName || "Dispute Case",
        claimant: claimantUser,
        respondent: respondentUser,
        neutral: neutralUser,
        is3SCase: is3SCase,
      },
      data: participants,
      participants: participants,
    });
  } catch (error) {
    console.error("Fetch case participants error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch case participants", error: error.message });
  }
};

const getMyCases = async (req, res) => {
  try {
    const userCases = await getUserCases(req.user);
    res.status(200).json({ success: true, data: userCases });
  } catch (error) {
    console.error("getMyCases error:", error);
    res.status(500).json({ success: false, message: "Failed to load cases" });
  }
};

module.exports = {
  handleChatMessage,
  getChatHistory,
  getJointChatHistory,
  getCaseParticipants,
  getMyCases,
};
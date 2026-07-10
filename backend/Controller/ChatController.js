const Case = require("../models/Case");
const Hearing = require("../models/hearing");
const UploadDocument = require("../models/documentDetail");
const { generateCaseStatusAnswer } = require("../Service/aiCaseStatusService");

const isUserAllowedForCase = (caseItem, user) => {
  if (!caseItem || !user) return false;

  if (user.role === "admin") return true;

  if (
    user.role === "claimant" &&
    (caseItem.claimant?.toString() === user.id?.toString() ||
     caseItem.CustomersEmail?.toLowerCase() === user.email?.toLowerCase())
  ) {
    return true;
  }

  if (
    user.role === "respondent" &&
    (caseItem.respondent?.toString() === user.id?.toString() ||
     caseItem.oppositePartyEmail?.toLowerCase() === user.email?.toLowerCase())
  ) {
    return true;
  }

  if (
    user.role === "neutral" &&
    caseItem.neutral?.toString() === user.id?.toString()
  ) {
    return true;
  }

  return false;
};

const getUserCases = async (user) => {
  if (user.role === "admin") {
    return Case.find({}).select(
      "caseId DisputeName DisputeType status CustomersName CustomersEmail oppositePartyName oppositePartyEmail neutral createdAt"
    ).lean();
  }

  if (user.role === "claimant") {
    return Case.find({
      $or: [
        { claimant: user.id },
        { CustomersEmail: user.email }
      ]
    }).collation({ locale: "en", strength: 2 }).select(
      "caseId DisputeName DisputeType status CustomersName CustomersEmail oppositePartyName oppositePartyEmail neutral createdAt"
    ).lean();
  }

  if (user.role === "respondent") {
    return Case.find({
      $or: [
        { respondent: user.id },
        { oppositePartyEmail: user.email }
      ]
    }).collation({ locale: "en", strength: 2 }).select(
      "caseId DisputeName DisputeType status CustomersName CustomersEmail oppositePartyName oppositePartyEmail neutral createdAt"
    ).lean();
  }

  if (user.role === "neutral") {
    return Case.find({ neutral: user.id }).select(
      "caseId DisputeName DisputeType status CustomersName CustomersEmail oppositePartyName oppositePartyEmail neutral createdAt"
    ).lean();
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

    const history = await ChatMessage.find({
      caseId,
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

const getCaseParticipants = async (req, res) => {
  try {
    const { caseId } = req.params;
    if (!caseId) {
      return res.status(400).json({ success: false, message: "caseId is required" });
    }

    const caseData = await Case.findOne({ caseId })
      .populate("claimant", "name email phone role")
      .populate("respondent", "name email phone role")
      .populate("neutral", "name email phone role");

    if (!caseData) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    // Find all system administrators to list as support contacts
    const admins = await User.find({ role: "admin" }).select("name email phone role");

    const participants = [];

    if (caseData.claimant) participants.push(caseData.claimant);
    if (caseData.respondent) participants.push(caseData.respondent);
    if (caseData.neutral) participants.push(caseData.neutral);
    
    // Merge admins in contact lists
    admins.forEach(adm => {
      participants.push(adm);
    });

    res.status(200).json({
      success: true,
      case: {
        caseId: caseData.caseId,
        DisputeName: caseData.DisputeName,
      },
      data: participants,
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
  getCaseParticipants,
  getMyCases,
};
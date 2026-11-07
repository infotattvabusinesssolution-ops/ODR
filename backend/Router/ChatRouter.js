const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/Auth.js");
const {
  handleChatMessage,
  getChatHistory,
  getJointChatHistory,
  getCaseParticipants,
  getMyCases,
} = require("../Controller/ChatController");

// Apply verifyToken middleware to all chat routes
router.use(verifyToken);

// AI Chat endpoint
router.post("/message", handleChatMessage);

// One-to-One and Joint Real-Time Chat Endpoints
router.get("/cases", getMyCases);
router.get("/history/:caseId/:userAId/:userBId", getChatHistory);
router.get("/joint-history/:caseId", getJointChatHistory);
router.get("/participants/:caseId", getCaseParticipants);

module.exports = router;
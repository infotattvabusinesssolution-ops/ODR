const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.js");
const {
  handleChatMessage,
  getChatHistory,
  getCaseParticipants,
  getMyCases,
} = require("../Controller/ChatController");

// Apply verifyToken middleware to all chat routes
router.use(verifyToken);

// AI Chat endpoint
router.post("/message", handleChatMessage);

// One-to-One Real-Time Chat Endpoints
router.get("/cases", getMyCases);
router.get("/history/:caseId/:userAId/:userBId", getChatHistory);
router.get("/participants/:caseId", getCaseParticipants);

module.exports = router;
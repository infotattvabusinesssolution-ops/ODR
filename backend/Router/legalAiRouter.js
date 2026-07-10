const Express = require("express");
const router = Express.Router();
const { verifyToken } = require("../middlewares/auth.js");
const {
  legalResearch,
  contractReview,
  summarizeDoc,
  complianceCheck,
  litigationStrategy,
  predictiveAnalytics,
  generateDocument,
  translateExplain,
  compareContracts,
  legalChat,
  eDiscovery
} = require("../Controller/legalAiController");

// Secure all endpoints under JWT auth token verification
router.use(verifyToken);

router.post("/research", legalResearch);
router.post("/contract-review", contractReview);
router.post("/summarize", summarizeDoc);
router.post("/compliance", complianceCheck);
router.post("/litigation-strategy", litigationStrategy);
router.post("/predictive-analytics", predictiveAnalytics);
router.post("/generate-document", generateDocument);
router.post("/translate-explain", translateExplain);
router.post("/compare-contracts", compareContracts);
router.post("/chat", legalChat);
router.post("/e-discovery", eDiscovery);

module.exports = router;

const Express = require("express");
const router = Express.Router();
const {
  NeutralRegister,
  NeutralLogin,
  NeutralData,
  getAllNeutral,
  getNotification,
  getNotificationForNeutral,
  deleteNeutralNotification,
  deleteAllNeutralNotification,
  updateStatus,
  getCaseStatus,
  getNeutralDashboardStats,
  updateNeutralProfile,
  updateNeutralPassword,
} = require("../Controller/NeutralController");
const { verifyToken, authorizeRoles } = require("../middlewares/Auth.js");

const {
  uploadAwardDoc,
  getAwardsForNeutral,
  publishAwardDoc,
  deleteAwardDoc,
} = require("../Controller/NeutralAwardController");
const upload = require("../middlewares/multer.js");

router.post("/register", NeutralRegister);
router.post("/login", NeutralLogin);

router.get("/data", verifyToken, authorizeRoles("neutral"), NeutralData);
router.get("/get-all-neutral", getAllNeutral);
router.get("/notifications/:neutralId", getNotification);
router.post("/get-notifications", getNotificationForNeutral);
router.delete("/delete-neutral-notification/:id", deleteNeutralNotification);
router.delete(
  "/delete-all-neutral-notification/:email",
  deleteAllNeutralNotification
);
router.get("/get-status/:caseId", getCaseStatus);
router.put("/update-status/:caseId", updateStatus);

// Neutral Dashboard Stats (Real-Time)
router.get("/dashboard-stats/:neutralId", getNeutralDashboardStats);

// Neutral Profile and Password Updates
router.put("/update-profile", verifyToken, authorizeRoles("neutral"), updateNeutralProfile);
router.put("/update-password", verifyToken, authorizeRoles("neutral"), updateNeutralPassword);

// Neutral Orders / Awards / Notes Routes
router.post(
  "/awards/upload",
  verifyToken,
  authorizeRoles("neutral"),
  upload.single("file"),
  uploadAwardDoc
);
router.get("/awards/:neutralId", verifyToken, authorizeRoles("neutral"), getAwardsForNeutral);
router.put("/awards/:id/publish", verifyToken, authorizeRoles("neutral"), publishAwardDoc);
router.delete("/awards/:id", verifyToken, authorizeRoles("neutral"), deleteAwardDoc);

module.exports = router;

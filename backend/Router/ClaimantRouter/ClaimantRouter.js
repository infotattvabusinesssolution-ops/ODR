const Express = require("express");
const router = Express.Router();
const {
  ClaimantRegister,
  ClaimantLogin,
  ClaimantData,
  ClaimantaddNewCase,
  ClaimantCaseStats,
  getClaimantUsers,
  uploadDocumentForClaimant,
  getAllDocumentsByUserId,
  getOwnClaimantCase,
  getClaimantHearings,
  getAllClaimant,
  getScheduleHearingByCaseId,
  getCaseNotification,
  deleteClaimantNotification,
  deleteAllClaimantNotification,
  getDocumentSingleDetails,
  getClaimantOwnCasesSecure,
  getClaimantDocumentsSecure,
  updateClaimantProfile,
  updateClaimantPassword,
} = require("../../Controller/ClaimantController/ClaimantController.js");
const { verifyToken, authorizeRoles } = require("../../middlewares/auth.js");
const upload = require("../../middlewares/multer.js");

router.post("/register", ClaimantRegister);
router.post("/login", ClaimantLogin);
router.get("/data", verifyToken, authorizeRoles("claimant"), ClaimantData);
router.post("/add-new-case", upload.single("file"), ClaimantaddNewCase);
router.get("/claimant-case-stats", verifyToken, authorizeRoles("claimant"), ClaimantCaseStats);
router.get("/get-claimant-users", getClaimantUsers);

router.post(
  "/document-upload-by-claimant/:claimantId",
  upload.single("file"),
  uploadDocumentForClaimant
);
router.get("/get-document-single-details/:claimantId", getDocumentSingleDetails);
router.post("/get-document-details", getAllDocumentsByUserId);
router.post("/get-own-claimant-case", getOwnClaimantCase);
router.get("/get-claimant-hearings/:claimantId", getClaimantHearings);
router.get("/get-all-claimant", getAllClaimant);
router.post("/get-by-caseId", getScheduleHearingByCaseId);
router.post("/get-notification", getCaseNotification);
router.delete("/delete-claimant-notification/:id", deleteClaimantNotification);
router.delete(
  "/delete-all-claimant-notification/:email",
  deleteAllClaimantNotification
);

// Secure authenticated routes
router.get("/my-cases", verifyToken, authorizeRoles("claimant"), getClaimantOwnCasesSecure);
router.get("/my-documents", verifyToken, authorizeRoles("claimant"), getClaimantDocumentsSecure);
router.put("/update-profile", verifyToken, authorizeRoles("claimant"), updateClaimantProfile);
router.put("/update-password", verifyToken, authorizeRoles("claimant"), updateClaimantPassword);

module.exports = router;

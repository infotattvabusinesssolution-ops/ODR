const Express = require("express");
const router = Express.Router();
const upload = require("../middlewares/multer");
const {
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
} = require("../Controller/RespondentController");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.js");

router.post("/register", RespondentRegister);
router.post("/login", RespondentLogin);

router.get("/data", verifyToken, authorizeRoles("respondent"), RespondentData);
router.post("/my-case", getRespondentCase);
router.post("/get-hearing-by-caseId", getScheduleHearingByCaseId);
router.post("/get-notification", getCaseNotification);
router.delete(
  "/delete-respondent-notification/:id",
  deleteRespondentNotification
);
router.delete(
  "/delete-all-respondent-notification/:email",
  deleteAllRespondentNotification
);
router.get("/get-respondent-users", getRespondentUsers);
router.post("/document-upload-by-respondent/:respondentId", upload.single("documents"), uploadDocumentForRespondent);
router.get("/get-documents/:email", getDocumentsByUser);

module.exports = router;

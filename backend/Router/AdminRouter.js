const Express = require("express");
const router = Express.Router();
const { verifyToken, authorizeRoles } = require("../middlewares/auth.js");
const upload = require("../middlewares/multer");
const {
  AdminUserRegister,
  AdminUserLogin,
  AdminData,
  downloadClaimantCaseFile,
  getCaseEdit,
  updateCase,
  getAllClaimants,
  deleteClaimantCase,
  getAllUsers,
  deleteAllUser,
  documentUpload,
  getAllDocumentsDetail,
  updateVerifiStatus,
  updateActiveStatus,
  createNewScheduleHearing,
  getScheduleHearing,
  ScheduleHearingUpdate,
  deleteHearing,
  hearingActiveStatus,
  deleteSubmitedDocument,
  assignCase,
  getAssignedCases,
  asignScheduleHearing,
  getScheduleHearingById,
  getReportsAnalytics,
  getTimelineEvents,
  timelineEventsStream,
  getDashboardStats,
} = require("../Controller/AdminController");

router.post("/register", AdminUserRegister);
router.post("/login", AdminUserLogin);
router.get("/data", verifyToken, authorizeRoles("admin"), AdminData);
router.get("/dashboard-stats", verifyToken, authorizeRoles("admin"), getDashboardStats);
router.get("/reports-analytics", verifyToken, authorizeRoles("admin"), getReportsAnalytics);
router.get("/timeline-events", verifyToken, authorizeRoles("admin"), getTimelineEvents);
router.get("/timeline-events/stream", timelineEventsStream);
router.get("/cases", getAllClaimants);
router.delete("/delete-case/:id", deleteClaimantCase);
router.get("/download-case-file/:id", downloadClaimantCaseFile);
router.get("/get-case-edit/:id", getCaseEdit);
router.put("/update-case/:id", upload.single("file"), updateCase);

// get all users
router.get("/get-all-users", getAllUsers);
// delete all users
router.delete("/delete-all-users/:id", deleteAllUser);
//upload documents
router.post("/document-upload", upload.single("file"), documentUpload);
//get all documents details
router.get("/document-details", getAllDocumentsDetail);

// for update the status
router.post("/update-verify-status/:id", updateVerifiStatus);
router.post("/update-active-status/:id", updateActiveStatus);

// for newHearing
router.post("/new-hearing", createNewScheduleHearing);
router.get("/get-new-hearing", getScheduleHearing);
router.put("/update-hearing/:id", ScheduleHearingUpdate);
router.delete("/delete-hearing/:id", deleteHearing);
router.post("/hearing-active-status/:id", hearingActiveStatus);
router.delete("/delete-document/:id", deleteSubmitedDocument);
router.put("/assign-all-cases", assignCase);
router.get("/get-assign-cases/:neutralId", getAssignedCases);
router.put("/schedule-hearing", asignScheduleHearing);
router.get("/get-schedule-hearing/:neutralId", getScheduleHearingById);

module.exports = router;

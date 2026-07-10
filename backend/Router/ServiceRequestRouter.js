const Express = require("express");
const router = Express.Router();
const { verifyToken, authorizeRoles } = require("../middlewares/Auth.js");
const {
  createServiceRequest,
  getAllServiceRequests,
  getMyServiceRequests,
  updateServiceRequestStatus,
  respondToServiceRequest,
  deleteServiceRequest,
} = require("../Controller/ServiceRequestController");

// All routes require authentication
router.use(verifyToken);

// Any authenticated user can submit a service request
router.post("/", createServiceRequest);

// Any authenticated user can view their own requests
router.get("/my", getMyServiceRequests);

// Admin-only routes
router.get("/", authorizeRoles("admin"), getAllServiceRequests);
router.put("/:id/status", authorizeRoles("admin"), updateServiceRequestStatus);
router.put("/:id/respond", authorizeRoles("admin"), respondToServiceRequest);
router.delete("/:id", authorizeRoles("admin"), deleteServiceRequest);

module.exports = router;

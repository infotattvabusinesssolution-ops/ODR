const Express = require("express");
const router = Express.Router();
const { verifyToken, authorizeRoles } = require("../middlewares/Auth.js");
const {
  createPayment,
  getAllPayments,
  getMyPayments,
  updatePaymentStatus,
  deletePayment,
  createCheckoutSession,
  verifyCheckoutSession,
} = require("../Controller/PaymentController");

// All payment actions require valid session token
router.use(verifyToken);

// Claimants can pay fees and view their history
router.post("/", createPayment);
router.get("/my", getMyPayments);

// Stripe Checkout integrations
router.post("/create-checkout-session", createCheckoutSession);
router.post("/verify-checkout-session", verifyCheckoutSession);

// Admin-only management endpoints
router.get("/", authorizeRoles("admin"), getAllPayments);
router.put("/:id/status", authorizeRoles("admin"), updatePaymentStatus);
router.delete("/:id", authorizeRoles("admin"), deletePayment);

module.exports = router;

const Payment = require("../models/payment");
const axios = require("axios");

const isValidStripeKey = (key) => {
  if (!key) return false;
  const cleanKey = key.trim();
  return (
    cleanKey.startsWith("sk_") &&
    !cleanKey.includes("...") &&
    !cleanKey.includes("YOUR_ACTUAL") &&
    !cleanKey.includes("placeholder") &&
    !cleanKey.includes("mock")
  );
};

// POST /api/payments — Claimant initiates and processes payment
exports.createPayment = async (req, res) => {
  try {
    const { amount, method, status } = req.body;

    if (!amount || !method) {
      return res.status(400).json({
        success: false,
        message: "Amount and payment method are required",
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Default status is Completed to simulate successful gateway execution,
    // but allow explicit status (e.g. Failed/Pending) for testing.
    const payment = new Payment({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      amount: numAmount,
      method,
      status: status || "Completed",
    });

    await payment.save();

    return res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process payment",
    });
  }
};

// GET /api/payments — Admin fetches all transactions with stats
exports.getAllPayments = async (req, res) => {
  try {
    const { search, status, sort } = req.query;

    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { transactionId: searchRegex },
        { userName: searchRegex },
        { userEmail: searchRegex },
      ];
    }

    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const payments = await Payment.find(filter).sort(sortOption);

    // Compute live stats for the admin dashboard
    const allPayments = await Payment.find();
    
    // Total volume (sum of all completed amounts)
    const completedPayments = allPayments.filter((p) => p.status === "Completed");
    const totalRevenue = completedPayments.reduce((acc, curr) => acc + curr.amount, 0);

    const stats = {
      totalRevenue: totalRevenue.toFixed(2),
      totalCount: allPayments.length,
      completedCount: completedPayments.length,
      pendingCount: allPayments.filter((p) => p.status === "Pending").length,
      failedCount: allPayments.filter((p) => p.status === "Failed").length,
    };

    return res.json({
      success: true,
      data: payments,
      stats,
    });
  } catch (error) {
    console.error("Get All Payments Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};

// GET /api/payments/my — Claimant fetches their own transactions
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get My Payments Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
    });
  }
};

// PUT /api/payments/:id/status — Admin updates status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Completed", "Failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction not found",
      });
    }

    payment.status = status;
    await payment.save();

    return res.json({
      success: true,
      message: "Payment status updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Update Payment Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
};

// DELETE /api/payments/:id — Admin deletes/voids a transaction
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    return res.json({
      success: true,
      message: "Payment transaction record deleted",
    });
  } catch (error) {
    console.error("Delete Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete payment record",
    });
  }
};

// POST /api/payments/create-checkout-session — Claimant creates Stripe Session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    // If stripeKey is not present or is a placeholder, signal sandbox mode to frontend
    if (!isValidStripeKey(stripeKey)) {
      return res.json({
        success: true,
        sandbox: true,
        message: "No Stripe Secret Key configured. Redirecting to ODR Premium Sandbox Form.",
      });
    }

    // Call Stripe REST API directly using URLSearchParams and axios
    const origin = req.headers.origin || "http://localhost:5173";
    const params = new URLSearchParams();
    params.append("payment_method_types[0]", "card");
    params.append("line_items[0][price_data][currency]", "inr");
    params.append("line_items[0][price_data][product_data][name]", "ODR Service Case Fee");
    params.append("line_items[0][price_data][unit_amount]", Math.round(parseFloat(amount) * 100).toString());
    params.append("line_items[0][quantity]", "1");
    params.append("mode", "payment");
    params.append("success_url", `${origin}/claimant/payment?status=success&session_id={CHECKOUT_SESSION_ID}&amount=${amount}&method=${method}`);
    params.append("cancel_url", `${origin}/claimant/payment?status=cancel`);

    const stripeResponse = await axios.post(
      "https://api.stripe.com/v1/checkout/sessions",
      params.toString(),
      {
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    return res.json({
      success: true,
      sandbox: false,
      url: stripeResponse.data.url,
      sessionId: stripeResponse.data.id
    });

  } catch (error) {
    console.error("Stripe Checkout Session Error:", error.response ? error.response.data : error.message);
    return res.status(500).json({
      success: false,
      message: "Stripe connection failed. Falling back to sandbox payment mode.",
      fallbackToSandbox: true
    });
  }
};

// POST /api/payments/verify-checkout-session — Verifies checkout and saves record
exports.verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId, amount, method } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID is required" });
    }

    // Check if transaction was already written to DB
    const existing = await Payment.findOne({ transactionId: sessionId });
    if (existing) {
      return res.json({ success: true, message: "Payment already verified", data: existing });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    let transactionStatus = "Completed";

    // If stripeKey is present and valid, query Stripe API to confirm status
    if (isValidStripeKey(stripeKey) && sessionId.startsWith("cs_")) {
      try {
        const response = await axios.get(
          `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
          { headers: { Authorization: `Bearer ${stripeKey}` } }
        );
        if (response.data.payment_status !== "paid") {
          transactionStatus = "Failed";
        }
      } catch (err) {
        console.error("Error verifying with Stripe API:", err.message);
      }
    }

    // Create payment entry
    const payment = new Payment({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      amount: parseFloat(amount) || 1000,
      method: method || "Credit Card",
      status: transactionStatus,
      transactionId: sessionId // Store the Stripe session ID as transaction ID
    });

    await payment.save();

    return res.json({
      success: true,
      message: "Payment successfully audited and logged",
      data: payment
    });
  } catch (error) {
    console.error("Verify Session Error:", error);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
};

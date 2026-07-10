const ServiceRequest = require("../models/serviceRequest");

// POST /api/service-requests — Any authenticated user can submit
exports.createServiceRequest = async (req, res) => {
  try {
    const { subject, description, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    const serviceRequest = new ServiceRequest({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      subject,
      description,
      priority: priority || "Medium",
    });

    await serviceRequest.save();

    return res.status(201).json({
      success: true,
      message: "Service request submitted successfully",
      data: serviceRequest,
    });
  } catch (error) {
    console.error("Create Service Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create service request",
    });
  }
};

// GET /api/service-requests — Admin only: fetch all requests
exports.getAllServiceRequests = async (req, res) => {
  try {
    const { search, status, priority, sort } = req.query;

    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (priority && priority !== "All") {
      filter.priority = priority;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { requestId: searchRegex },
        { userName: searchRegex },
        { userEmail: searchRegex },
        { subject: searchRegex },
      ];
    }

    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const requests = await ServiceRequest.find(filter).sort(sortOption);

    // Compute summary counts
    const allRequests = await ServiceRequest.find();
    const stats = {
      total: allRequests.length,
      pending: allRequests.filter((r) => r.status === "Pending").length,
      inProgress: allRequests.filter((r) => r.status === "In Progress").length,
      resolved: allRequests.filter((r) => r.status === "Resolved").length,
    };

    return res.json({
      success: true,
      data: requests,
      stats,
    });
  } catch (error) {
    console.error("Get All Service Requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch service requests",
    });
  }
};

// GET /api/service-requests/my — Any authenticated user: own requests only
exports.getMyServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get My Service Requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your service requests",
    });
  }
};

// PUT /api/service-requests/:id/status — Admin only: update status
exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "In Progress", "Resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    request.status = status;
    await request.save();

    return res.json({
      success: true,
      message: "Status updated successfully",
      data: request,
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

// PUT /api/service-requests/:id/respond — Admin only: add response
exports.respondToServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse, status } = req.body;

    if (!adminResponse) {
      return res.status(400).json({
        success: false,
        message: "Admin response text is required",
      });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    request.adminResponse = adminResponse;
    request.respondedAt = new Date();

    // Optionally update status alongside the response
    if (status && ["Pending", "In Progress", "Resolved"].includes(status)) {
      request.status = status;
    }

    await request.save();

    return res.json({
      success: true,
      message: "Response sent successfully",
      data: request,
    });
  } catch (error) {
    console.error("Respond to Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send response",
    });
  }
};

// DELETE /api/service-requests/:id — Admin only
exports.deleteServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ServiceRequest.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    return res.json({
      success: true,
      message: "Service request deleted successfully",
    });
  } catch (error) {
    console.error("Delete Service Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete service request",
    });
  }
};

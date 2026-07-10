const jwt = require("jsonwebtoken");
const UserClaimant = require("../models/users");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "my_secrect_code_is_9123891238"
    );

    if (decoded.role !== "claimant") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Claimants only",
      });
    }

    const claimant = await UserClaimant.findById(decoded.id);
    if (!claimant) {
      return res.status(401).json({
        success: false,
        message: "Claimant not found",
      });
    }

    // ⭐ CORRECT: attach as req.claimant so controller works
    req.claimant = claimant;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};

const jwt = require("jsonwebtoken");
const Respondent = require("../models/respondent");

module.exports = respondentAuthMiddleware = async (req, res, next) => {
  try {
    // Get Token
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    // Verify Token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "my_secrect_code_is_9123891238"
    );
    if (decoded.role !== "respondent") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Respondent only" });
    }

    // Fetch Claimant
    const respondent = await Respondent.findById(decoded.id);
    if (!respondent) {
      return res
        .status(401)
        .json({ success: false, message: "Respondent not found" });
    }

    req.respondent = respondent;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

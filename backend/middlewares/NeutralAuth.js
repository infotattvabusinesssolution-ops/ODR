const jwt = require("jsonwebtoken");
const neutralUser = require("../models/users");

module.exports = neutralAuthMiddleware = async (req, res, next) => {
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
    if (decoded.role !== "neutral") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Neutral only" });
    }

    // Fetch Claimant
    const neutral = await neutralUser.findById(decoded.id);
    if (!neutral) {
      return res
        .status(401)
        .json({ success: false, message: "Neutral not found" });
    }

    req.neutral = neutral;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

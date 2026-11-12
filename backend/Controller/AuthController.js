const { adminAuth } = require("../config/firebase");
const User = require("../models/users");
const jwt = require("jsonwebtoken");

function buildPhoneCandidates(phone) {
  if (!phone || typeof phone !== "string") return [];
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return Array.from(
    new Set(
      [
        trimmed,
        digits,
        last10,
        last10 ? `+91${last10}` : "",
        last10 ? `91${last10}` : "",
        last10 ? `+91 ${last10}` : "",
      ].filter(Boolean)
    )
  );
}

const firebaseLogin = async (req, res) => {
  const { idToken, role } = req.body;

  try {
    if (!idToken) {
      return res.status(400).json({ success: false, message: "Firebase ID Token is required" });
    }

    // Admins are not allowed to login via Firebase
    if (role === "admin") {
      return res.status(403).json({ success: false, message: "Admin cannot login via Firebase" });
    }

    // Verify the Firebase ID token
    if (!adminAuth) {
      return res.status(500).json({ success: false, message: "Firebase Admin is not properly configured on the server." });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // The decoded token will have an email (if Gmail login) or phone_number (if Phone login)
    const email = decodedToken.email;
    const phone = decodedToken.phone_number;
    const name = decodedToken.name || (email ? email : (phone || "User"));

    let user = null;

    if (email) {
      user = await User.findOne({ email: new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    } else if (phone) {
      const phoneCandidates = buildPhoneCandidates(phone);
      const validRequestedRole = role && ["claimant", "respondent", "neutral"].includes(role) ? role : null;
      if (validRequestedRole) {
        user = await User.findOne({ phone: { $in: phoneCandidates }, role: validRequestedRole });
      }
      if (!user) {
        user = await User.findOne({ phone: { $in: phoneCandidates } });
      }
    }

    // If user does not exist, we automatically register them
    if (!user) {
      // Default to "claimant" if no role is provided
      const assignedRole = role && ["claimant", "respondent", "neutral"].includes(role) ? role : "claimant";
      
      user = await User.create({
        email: email || "",
        phone: phone || "",
        name: name,
        role: assignedRole,
        status: "active",
        isVerified: true,
      });
    } else {
      // If user exists but selected a different role (and not admin), update their role
      let changed = false;
      if (role && ["claimant", "respondent", "neutral"].includes(role) && user.role !== role && user.role !== "admin") {
        user.role = role;
        changed = true;
      }
      if ((!user.name || user.name === "Firebase User" || user.name === "User") && name && name !== "Firebase User") {
        user.name = name;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    // Double check that an admin didn't somehow bypass
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Admin cannot login via Firebase" });
    }

    // Generate our standard backend JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "default_secret", 
      { expiresIn: "10d" }
    );

    // Update last active time on login
    user.lastActive = new Date();
    await user.save();

    // Set HTTP-only secure cookie to overwrite any existing token cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
    });

    return res.status(200).json({
      success: true,
      message: "Firebase Login successful",
      token,
      role: user.role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Firebase Login Error:", error);
    return res.status(401).json({ success: false, message: "Invalid Firebase token or server error" });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification link" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Redirect to login page or show success message
    const loginUrl = (process.env.FRONTEND_URL || "https://gokulanandachaudhurifoundation.com") + "/login";
    return res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h2 style="color: #16a34a;">Email Verified Successfully!</h2>
          <p>You can now close this window and log in to your account.</p>
          <a href="${loginUrl}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Go to Login</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Email Verification Error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  firebaseLogin,
  verifyEmail,
};

const crypto = require("crypto");
const { adminAuth } = require("../config/firebase");
const User = require("../models/users");
const Case = require("../models/Case");
const PhoneOtp = require("../models/phoneOtp");
const transporter = require("../config/smtp");
const jwt = require("jsonwebtoken");

const ALLOWED_FIREBASE_ROLES = ["claimant", "respondent", "neutral"];
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

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

function normalizePhone10(phone) {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "";
  return digits.slice(-10);
}

function isUsableEmail(email) {
  if (typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  return trimmed.includes("@") && !trimmed.endsWith("@otp.odr");
}

function maskEmail(email) {
  const trimmed = (email || "").trim();
  const atIdx = trimmed.indexOf("@");
  if (atIdx <= 0) return trimmed;
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx);
  if (local.length <= 2) return `${local[0]}***${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}${domain}`;
}

function hashPhoneOtp(phoneKey, otp) {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET || "default_secret")
    .update(`${phoneKey}:${otp}`)
    .digest("hex");
}

function pickValidRole(role) {
  return role && ALLOWED_FIREBASE_ROLES.includes(role) ? role : null;
}

/**
 * Resolve a non-admin user and contact email associated with a phone number.
 */
async function resolvePhoneAccount(phoneCandidates, requestedRole) {
  const validRole = pickValidRole(requestedRole);
  const matchingUsers = await User.find({ phone: { $in: phoneCandidates } });
  const nonAdminUsers = matchingUsers.filter((u) => u.role !== "admin");
  const onlyAdmin = matchingUsers.length > 0 && nonAdminUsers.length === 0;
  if (onlyAdmin) {
    return { onlyAdmin: true, user: null, email: "", name: "" };
  }

  let selectedUser = null;
  if (validRole) {
    selectedUser =
      nonAdminUsers.find((u) => u.role === validRole && isUsableEmail(u.email)) ||
      nonAdminUsers.find((u) => u.role === validRole) ||
      null;
  }
  if (!selectedUser) {
    selectedUser = nonAdminUsers.find((u) => isUsableEmail(u.email)) || nonAdminUsers[0] || null;
  }

  let email = selectedUser && isUsableEmail(selectedUser.email) ? selectedUser.email.trim() : "";
  let name = selectedUser?.name || "";

  if (!email) {
    const matchedCase = await Case.findOne({
      $or: [
        { CustomersMobileNumber: { $in: phoneCandidates } },
        { oppositeMobile: { $in: phoneCandidates } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    if (matchedCase) {
      const claimantMatch = phoneCandidates.includes((matchedCase.CustomersMobileNumber || "").trim());
      if (claimantMatch && isUsableEmail(matchedCase.CustomersEmail)) {
        email = matchedCase.CustomersEmail.trim();
        name = name || matchedCase.CustomersName || "";
      } else if (isUsableEmail(matchedCase.oppositePartyEmail)) {
        email = matchedCase.oppositePartyEmail.trim();
        name = name || matchedCase.oppositePartyName || "";
      }
    }
  }

  return { onlyAdmin: false, user: selectedUser, email, name };
}

/**
 * Persist role/name updates, issue JWT + auth cookie, and return standard login JSON.
 */
async function issueSessionResponse(req, res, user, role, message) {
  const validRole = pickValidRole(role);
  let changed = false;

  if (validRole && user.role !== validRole && user.role !== "admin") {
    user.role = validRole;
    changed = true;
  }
  if (user.role === "admin") {
    return res.status(403).json({ success: false, message: "Admin cannot login via Firebase or Phone OTP" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "10d" }
  );

  user.lastActive = new Date();
  await user.save();

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message,
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
      const account = await resolvePhoneAccount(phoneCandidates, role);
      if (account.onlyAdmin) {
        return res.status(403).json({ success: false, message: "Admin cannot login via Firebase" });
      }
      user = account.user;
    }

    // If user does not exist, we automatically register them
    if (!user) {
      const assignedRole = pickValidRole(role) || "claimant";

      user = await User.create({
        email: email || "",
        phone: phone || "",
        name: name,
        role: assignedRole,
        status: "active",
        isVerified: true,
      });
    } else if ((!user.name || user.name === "Firebase User" || user.name === "User") && name && name !== "Firebase User") {
      user.name = name;
    }

    return await issueSessionResponse(req, res, user, role, "Firebase Login successful");
  } catch (error) {
    console.error("Firebase Login Error:", error);
    return res.status(401).json({ success: false, message: "Invalid Firebase token or server error" });
  }
};

/**
 * Server-side OTP fallback when carrier SMS is unavailable (e.g. Firebase Spark / DLT block).
 * Sends a 6-digit OTP to the email registered with the user's phone number via Hostinger SMTP.
 */
const sendPhoneOtp = async (req, res) => {
  try {
    const { phone, role } = req.body;
    if (role === "admin") {
      return res.status(403).json({ success: false, message: "Admin cannot login via Phone OTP" });
    }

    const clean10 = normalizePhone10(phone);
    if (!clean10) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit mobile number" });
    }

    const phoneKey = `+91${clean10}`;
    const phoneCandidates = buildPhoneCandidates(clean10);
    const { onlyAdmin, email, name } = await resolvePhoneAccount(phoneCandidates, role);

    if (onlyAdmin) {
      return res.status(403).json({ success: false, message: "Admin accounts must sign in using Email & Password" });
    }

    if (!email) {
      return res.status(404).json({
        success: false,
        code: "NO_REGISTERED_EMAIL",
        message:
          `Real SMS OTP is blocked on the server (Firebase requires Blaze billing / DLT SMS setup), and no registered email was found for ${phoneKey}. Please log in with Email & Password or register with both email and phone.`,
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = hashPhoneOtp(phoneKey, otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await PhoneOtp.findOneAndUpdate(
      { phoneKey },
      {
        $set: {
          phoneKey,
          role: pickValidRole(role) || "any",
          email,
          name: name || phoneKey,
          otpHash,
          attempts: 0,
          expiresAt,
        },
      },
      { upsert: true, new: true }
    );

    const fromAddress =
      process.env.SMTP_FROM ||
      `"Utkal ODR" <${process.env.SMTP_USER || process.env.EMAIL || "contact@utkalodr.com"}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Your Utkal ODR Login OTP",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #0f172a; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px;">Utkal ODR — One-Time Login Password</h2>
          </div>
          <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
            <p style="margin-top: 0;">Hello${name ? ` <strong>${name}</strong>` : ""},</p>
            <p>Use the verification code below to sign in with your registered mobile number <strong>${phoneKey}</strong>:</p>
            <div style="margin: 20px 0; padding: 14px 20px; background: #f1f5f9; border-radius: 8px; text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f172a;">
              ${otp}
            </div>
            <p style="font-size: 13px; color: #475569;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Sent via registered email because SMS delivery requires Firebase Blaze / DLT setup.</p>
          </div>
        </div>
      `,
    });

    const maskedEmail = maskEmail(email);
    return res.status(200).json({
      success: true,
      channel: "email",
      maskedEmail,
      message: `OTP sent to your registered email (${maskedEmail}) linked with ${phoneKey}`,
    });
  } catch (error) {
    console.error("Send Phone OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP via registered email. Please try again or use Email login.",
    });
  }
};

/**
 * Verify a server-issued 6-digit phone login OTP and issue a user session.
 */
const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp, role } = req.body;
    if (role === "admin") {
      return res.status(403).json({ success: false, message: "Admin cannot login via Phone OTP" });
    }

    const clean10 = normalizePhone10(phone);
    const cleanOtp = typeof otp === "string" ? otp.trim() : "";
    if (!clean10 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, message: "Please enter a valid phone number and 6-digit OTP" });
    }

    const phoneKey = `+91${clean10}`;
    const record = await PhoneOtp.findOne({ phoneKey });
    if (!record || record.expiresAt < new Date()) {
      if (record) await PhoneOtp.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: "OTP has expired or was not requested. Please request a new OTP." });
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await PhoneOtp.deleteOne({ _id: record._id });
      return res.status(429).json({ success: false, message: "Too many incorrect OTP attempts. Please request a new OTP." });
    }

    const candidateHash = Buffer.from(hashPhoneOtp(phoneKey, cleanOtp), "hex");
    const storedHash = Buffer.from(record.otpHash, "hex");
    const isMatch = candidateHash.length === storedHash.length && crypto.timingSafeEqual(candidateHash, storedHash);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ success: false, message: "Invalid OTP entered. Please check and try again." });
    }

    await PhoneOtp.deleteOne({ _id: record._id });

    const phoneCandidates = buildPhoneCandidates(clean10);
    const account = await resolvePhoneAccount(phoneCandidates, role);
    if (account.onlyAdmin) {
      return res.status(403).json({ success: false, message: "Admin accounts must sign in using Email & Password" });
    }

    let user = account.user;
    if (!user) {
      const assignedRole = pickValidRole(role) || "claimant";
      user = await User.create({
        email: record.email || "",
        phone: phoneKey,
        name: record.name || phoneKey,
        role: assignedRole,
        status: "active",
        isVerified: true,
      });
    } else if (!user.email && record.email) {
      user.email = record.email;
    }

    return await issueSessionResponse(req, res, user, role, "Phone OTP login successful");
  } catch (error) {
    console.error("Verify Phone OTP Error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
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
  sendPhoneOtp,
  verifyPhoneOtp,
  verifyEmail,
};

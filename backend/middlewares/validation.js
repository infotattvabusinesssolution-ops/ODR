// Lightweight self-contained schema validator to avoid external package dependencies
const validateBody = (rules) => {
  return (req, res, next) => {
    const errors = [];

    for (const [key, ruleset] of Object.entries(rules)) {
      const val = req.body[key];

      if (ruleset.required && (val === undefined || val === null || String(val).trim() === "")) {
        errors.push({ field: key, message: `${key} is required` });
        continue;
      }

      if (val !== undefined && val !== null && String(val).trim() !== "") {
        if (ruleset.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors.push({ field: key, message: `${key} must be a valid email address` });
        }
        if (ruleset.minLength && String(val).length < ruleset.minLength) {
          errors.push({ field: key, message: `${key} must be at least ${ruleset.minLength} characters` });
        }
        if (ruleset.enum && !ruleset.enum.includes(val)) {
          errors.push({ field: key, message: `${key} must be one of [${ruleset.enum.join(", ")}]` });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

// Common validation rules
const loginSchema = {
  email: { required: true, email: true },
  password: { required: true },
};

const registerSchema = {
  name: { required: true, minLength: 2 },
  email: { required: true, email: true },
  phone: { required: true, minLength: 10 },
  role: { required: true, enum: ["admin", "claimant", "respondent", "neutral"] },
  password: { required: true, minLength: 6 },
};

module.exports = {
  validateBody,
  loginSchema,
  registerSchema,
};

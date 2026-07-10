// In-memory store to track requests per client IP
const rateLimitStore = {};

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // default 15 minutes
  const max = options.max || 100; // default 100 requests per window
  const message = options.message || "Too many requests, please try again later.";

  return (req, res, next) => {
    // Get client IP address
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = [];
    }

    // Clean up timestamps older than the sliding window
    rateLimitStore[ip] = rateLimitStore[ip].filter((timestamp) => now - timestamp < windowMs);

    if (rateLimitStore[ip].length >= max) {
      return res.status(429).json({
        success: false,
        message: message,
      });
    }

    // Record the current request timestamp
    rateLimitStore[ip].push(now);
    next();
  };
};

module.exports = rateLimiter;

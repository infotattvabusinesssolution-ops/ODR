// Global error-handling middleware for Express
module.exports = (err, req, res, next) => {
  console.error("Express Error Catch:", err.stack || err);
  
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    message: message,
  });
};

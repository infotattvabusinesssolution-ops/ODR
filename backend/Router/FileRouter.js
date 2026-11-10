const express = require("express");
const { streamGridFsFile } = require("../utils/fileStorage");

const router = express.Router();

const handleServeFile = async (req, res) => {
  try {
    const { id, filename } = req.params;
    const download = req.query.download === "1" || req.query.download === "true";
    await streamGridFsFile(id, res, {
      download,
      fallbackFilename: filename ? decodeURIComponent(filename) : undefined,
    });
  } catch (error) {
    console.error("File serving error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to retrieve file" });
    }
  }
};

router.get("/:id", handleServeFile);
router.get("/:id/:filename", handleServeFile);

module.exports = router;

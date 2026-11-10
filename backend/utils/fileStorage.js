const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");

const GRIDFS_BUCKET_NAME = "case_files";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]);

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
};

/**
 * Resolve a reliable MIME type from extension and multer mimetype.
 */
function inferMimeType(fileName, explicitType) {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (explicitType && explicitType !== "application/octet-stream") {
    return explicitType;
  }
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

/**
 * Return the active MongoDB GridFSBucket for persistent document storage.
 */
function getGridFsBucket() {
  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error("MongoDB connection is not initialized for GridFS file storage.");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: GRIDFS_BUCKET_NAME,
  });
}

/**
 * Build the backend relative URL for a GridFS file record.
 */
function buildGridFsFileUrl(fileId, originalName) {
  const safeName = encodeURIComponent(path.basename(originalName || "document"));
  return `/api/files/${fileId}/${safeName}`;
}

/**
 * Extract the 24-hex GridFS ObjectId from a relative or absolute `/api/files/:id/...` URL.
 */
function extractGridFsFileId(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") return null;
  const match = fileUrl.match(/\/api\/files\/([a-fA-F0-9]{24})(?:[/?#]|$)/);
  return match ? match[1] : null;
}

/**
 * Extract a human-friendly filename from any stored URL (GridFS or Cloudinary).
 */
function extractFileNameFromUrl(fileUrl, fallback = "Case_Document") {
  if (!fileUrl || typeof fileUrl !== "string") return fallback;
  try {
    const cleanPath = fileUrl.split("?")[0].split("#")[0];
    const lastSegment = cleanPath.substring(cleanPath.lastIndexOf("/") + 1);
    return decodeURIComponent(lastSegment) || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Convert a relative backend path (e.g. `/api/files/...`) into an absolute URL for emails/external links.
 */
function resolveAbsoluteFileUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const baseUrl = (
    process.env.BACKEND_PUBLIC_URL ||
    process.env.API_BASE_URL ||
    "https://gokulanandachaudhurifoundation.com"
  ).replace(/\/+$/, "");
  return `${baseUrl}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

/**
 * Store a file buffer or local path directly inside MongoDB GridFS.
 */
async function uploadToGridFs({ filePath, buffer, originalName, contentType, metadata = {} }) {
  const safeName = path.basename(originalName || (filePath ? path.basename(filePath) : "document"));
  const resolvedType = inferMimeType(safeName, contentType);
  const bucket = getGridFsBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(safeName, {
      contentType: resolvedType,
      metadata: {
        ...metadata,
        originalName: safeName,
        uploadedAt: new Date(),
      },
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      const fileId = uploadStream.id.toString();
      resolve({
        fileId,
        fileUrl: buildGridFsFileUrl(fileId, safeName),
        fileName: safeName,
        fileType: resolvedType,
        storage: "gridfs",
      });
    });

    if (buffer && Buffer.isBuffer(buffer)) {
      uploadStream.end(buffer);
    } else if (filePath) {
      const readStream = fs.createReadStream(filePath);
      readStream.on("error", (err) => {
        uploadStream.destroy(err);
        reject(err);
      });
      readStream.pipe(uploadStream);
    } else {
      reject(new Error("Either buffer or filePath is required for GridFS upload."));
    }
  });
}

/**
 * Persist a multer uploaded file reliably across localhost & production:
 * - Images use Cloudinary (with automatic GridFS fallback if Cloudinary rejects/fails).
 * - PDFs, Word docs, text files, and buffer uploads use MongoDB GridFS so downloads never hit Cloudinary 401 ACL blocks.
 */
async function storeUploadedFile(file, { folder = "uploads", metadata = {}, cleanupTemp = true } = {}) {
  if (!file) {
    throw new Error("No file provided to storeUploadedFile.");
  }

  const originalName = file.originalname || file.filename || (file.path ? path.basename(file.path) : "document");
  const ext = path.extname(originalName).toLowerCase();
  const isImage = IMAGE_EXTENSIONS.has(ext) && !(file.mimetype || "").toLowerCase().includes("pdf");

  let result = null;

  if (isImage && file.path) {
    try {
      const cloudRes = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      });
      result = {
        fileId: null,
        fileUrl: cloudRes.secure_url,
        fileName: originalName,
        fileType: inferMimeType(originalName, file.mimetype),
        fileSize: file.size || cloudRes.bytes || 0,
        storage: "cloudinary",
      };
    } catch (cloudErr) {
      console.warn(`Cloudinary image upload failed (${cloudErr.message}); storing in GridFS instead.`);
    }
  }

  if (!result) {
    const gridRes = await uploadToGridFs({
      filePath: file.path,
      buffer: file.buffer,
      originalName,
      contentType: file.mimetype,
      metadata: { folder, ...metadata },
    });
    const statSize =
      file.size ||
      (file.buffer ? file.buffer.length : 0) ||
      (file.path && fs.existsSync(file.path) ? fs.statSync(file.path).size : 0);
    result = {
      ...gridRes,
      fileSize: statSize,
    };
  }

  if (cleanupTemp && file.path) {
    await fs.promises.unlink(file.path).catch(() => {});
  }

  return result;
}

/**
 * Stream a GridFS file by ObjectId to an Express HTTP response.
 */
async function streamGridFsFile(fileId, res, { download = false, fallbackFilename } = {}) {
  if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
    res.status(400).json({ success: false, message: "Invalid file ID" });
    return false;
  }

  const bucket = getGridFsBucket();
  const objectId = new mongoose.Types.ObjectId(fileId);
  const files = await bucket.find({ _id: objectId }).toArray();

  if (!files || files.length === 0) {
    res.status(404).json({ success: false, message: "File not found" });
    return false;
  }

  const fileDoc = files[0];
  const fileName = path.basename(fileDoc.filename || fallbackFilename || "document");
  const contentType = inferMimeType(fileName, fileDoc.contentType);
  const asciiFallback = fileName.replace(/[\r\n"\\]/g, "_");
  const disposition = download ? "attachment" : "inline";

  res.setHeader("Content-Type", contentType);
  if (typeof fileDoc.length === "number") {
    res.setHeader("Content-Length", String(fileDoc.length));
  }
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
  );
  res.setHeader("Cache-Control", "public, max-age=3600");

  return new Promise((resolve) => {
    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.on("error", (err) => {
      console.error("GridFS read stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error streaming file" });
      } else {
        res.end();
      }
      resolve(false);
    });
    res.on("finish", () => resolve(true));
    downloadStream.pipe(res);
  });
}

/**
 * Download either a GridFS-stored file or a remote Cloudinary/HTTP URL as an attachment.
 */
async function serveStoredFileDownload(fileUrl, res, { fileName = "document", explicitType } = {}) {
  const gridFsId = extractGridFsFileId(fileUrl);
  if (gridFsId) {
    return streamGridFsFile(gridFsId, res, {
      download: true,
      fallbackFilename: fileName,
    });
  }

  let downloadUrl = resolveAbsoluteFileUrl(fileUrl);
  if (downloadUrl.includes("/image/upload/") && !downloadUrl.includes("fl_attachment")) {
    downloadUrl = downloadUrl.replace("/image/upload/", "/image/upload/fl_attachment/");
  } else if (downloadUrl.includes("/raw/upload/") && !downloadUrl.includes("fl_attachment")) {
    downloadUrl = downloadUrl.replace("/raw/upload/", "/raw/upload/fl_attachment/");
  }

  const streamUrl = (targetUrl, redirectsLeft = 3) =>
    new Promise((resolve) => {
      const client = targetUrl.startsWith("http:") ? http : https;
      client
        .get(targetUrl, (fileRes) => {
          if (
            fileRes.statusCode >= 300 &&
            fileRes.statusCode < 400 &&
            fileRes.headers.location &&
            redirectsLeft > 0
          ) {
            fileRes.resume();
            streamUrl(fileRes.headers.location, redirectsLeft - 1).then(resolve);
            return;
          }

          if (fileRes.statusCode >= 400) {
            fileRes.resume();
            if (!res.headersSent) {
              res.status(fileRes.statusCode).json({
                success: false,
                message: `Remote storage returned HTTP ${fileRes.statusCode}`,
              });
            }
            resolve(false);
            return;
          }

          const safeName = path.basename(fileName || "document");
          const contentType = inferMimeType(safeName, explicitType || fileRes.headers["content-type"]);
          const asciiFallback = safeName.replace(/[\r\n"\\]/g, "_");
          res.setHeader("Content-Type", contentType);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
          );
          res.on("finish", () => resolve(true));
          fileRes.pipe(res);
        })
        .on("error", (err) => {
          console.error("Remote file stream error:", err.message);
          if (!res.headersSent) {
            res.status(500).json({ success: false, message: "File streaming failed" });
          }
          resolve(false);
        });
    });

  return streamUrl(downloadUrl);
}

/**
 * Create a standardized UploadDocument entry for a file uploaded during case registration/editing.
 */
async function createCaseFilingDocument(
  UploadDocumentModel,
  { caseData, storedFile, uploadedBy = "CLAIMANT", status = "Verified" }
) {
  if (!UploadDocumentModel || !caseData || !storedFile?.fileUrl) return null;
  try {
    return await UploadDocumentModel.create({
      caseId: caseData.caseId,
      claimantName: caseData.CustomersName || "Claimant",
      claimantEmail: caseData.CustomersEmail || "",
      respondentEmail: caseData.oppositePartyEmail || "",
      DocumentName: storedFile.fileName,
      fileUrl: storedFile.fileUrl,
      fileType: storedFile.fileType,
      fileSize: storedFile.fileSize || 0,
      UploadedBy: uploadedBy,
      Type: "Case Filing",
      status,
      uploadedAt: new Date(),
      documents: [
        {
          fileUrl: storedFile.fileUrl,
          fileName: storedFile.fileName,
          uploadedAt: new Date(),
        },
      ],
    });
  } catch (err) {
    console.error("⚠️ Failed to create Case Filing UploadDocument record:", err.message);
    return null;
  }
}

module.exports = {
  GRIDFS_BUCKET_NAME,
  inferMimeType,
  getGridFsBucket,
  buildGridFsFileUrl,
  extractGridFsFileId,
  extractFileNameFromUrl,
  resolveAbsoluteFileUrl,
  uploadToGridFs,
  storeUploadedFile,
  streamGridFsFile,
  serveStoredFileDownload,
  createCaseFilingDocument,
};

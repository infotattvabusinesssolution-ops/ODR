import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, ExternalLink, Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { resolveFileUrl, getDownloadFileUrl } from "../../../api/axiosConfig";

const getCleanUrl = (url = "") => url.split("#")[0].split("?")[0].trim();

const isImageFileUrl = (url = "") =>
  /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(getCleanUrl(url));

const getDownloadUrl = (url = "") => getDownloadFileUrl(url);

/**
 * Full-viewport document preview modal rendered via React Portal so nested
 * modals or CSS transforms never clip or crop tall/wide documents.
 */
export default function DocumentPreviewModal({
  isOpen,
  fileUrl,
  title = "Document Preview",
  onClose,
}) {
  const [zoomMode, setZoomMode] = useState("fit"); // "fit" | "custom"
  const [zoomPercent, setZoomPercent] = useState(100);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setZoomMode("fit");
    setZoomPercent(100);
    setPreviewFailed(false);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, fileUrl, onClose]);

  if (!isOpen || !fileUrl) return null;

  const resolvedFileUrl = resolveFileUrl(fileUrl);
  const cleanUrl = getCleanUrl(resolvedFileUrl);
  const isImage = isImageFileUrl(resolvedFileUrl);
  const isPdf = /\.pdf$/i.test(cleanUrl) || /\.pdf(\?|#|$)/i.test(title || "");
  const canShowPdfIframe = isPdf && !resolvedFileUrl.includes("res.cloudinary.com");
  const displaySrc = isImage
    ? resolvedFileUrl
    : isPdf && !canShowPdfIframe
    ? resolvedFileUrl.replace(/\.pdf(\?.*)?$/i, ".jpg$1")
    : null;
  const canShowImagePreview = Boolean(displaySrc) && !previewFailed;
  const downloadUrl = getDownloadUrl(resolvedFileUrl);

  const handleZoomIn = () => {
    setZoomMode("custom");
    setZoomPercent((prev) => Math.min(250, prev + 25));
  };

  const handleZoomOut = () => {
    setZoomMode("custom");
    setZoomPercent((prev) => Math.max(50, prev - 25));
  };

  const handleFitScreen = () => {
    setZoomMode("fit");
    setZoomPercent(100);
  };

  const controlBtnStyle = (active = false) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "5px 10px",
    borderRadius: "6px",
    border: active ? "1px solid #0284c7" : "1px solid #cbd5e1",
    backgroundColor: active ? "#e0f2fe" : "#ffffff",
    color: active ? "#0369a1" : "#334155",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  });

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(3px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        padding: "16px",
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1080px",
          height: "90vh",
          maxHeight: "90vh",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
            flexWrap: "wrap",
            backgroundColor: "#ffffff",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "420px",
            }}
            title={title}
          >
            {title}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {canShowImagePreview && (
              <>
                <button
                  type="button"
                  onClick={handleFitScreen}
                  style={controlBtnStyle(zoomMode === "fit")}
                  title="Fit full document inside window"
                >
                  <Maximize2 size={14} />
                  Fit
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  style={controlBtnStyle(false)}
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569", minWidth: "40px", textAlign: "center" }}>
                  {zoomMode === "fit" ? "Fit" : `${zoomPercent}%`}
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  style={controlBtnStyle(false)}
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "4px",
              }}
              aria-label="Close document preview"
            >
              <X size={18} color="#334155" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Viewport (minHeight: 0 prevents flex overflow/clipping) */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            backgroundColor: "#f1f5f9",
            display: "flex",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          {canShowPdfIframe ? (
            <iframe
              src={resolvedFileUrl}
              title={title || "PDF Preview"}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "65vh",
                border: "none",
                borderRadius: "6px",
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 12px rgba(15, 23, 42, 0.1)",
              }}
            />
          ) : canShowImagePreview ? (
            <img
              src={displaySrc}
              alt={title}
              onError={() => setPreviewFailed(true)}
              style={
                zoomMode === "fit"
                  ? {
                      maxWidth: "100%",
                      maxHeight: "100%",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                      margin: "auto",
                      borderRadius: "6px",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 2px 12px rgba(15, 23, 42, 0.1)",
                    }
                  : {
                      width: `${zoomPercent}%`,
                      maxWidth: "none",
                      height: "auto",
                      display: "block",
                      margin: "auto",
                      borderRadius: "6px",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 2px 12px rgba(15, 23, 42, 0.1)",
                    }
              }
            />
          ) : (
            <div
              style={{
                margin: "auto",
                textAlign: "center",
                padding: "2rem",
                maxWidth: "420px",
              }}
            >
              <FileText size={56} color="#94a3b8" style={{ margin: "0 auto 1rem auto" }} />
              <h4 style={{ color: "#1e293b", margin: "0 0 0.5rem 0", fontSize: "17px" }}>
                Inline Preview Unavailable
              </h4>
              <p style={{ color: "#64748b", margin: "0 0 1.25rem 0", fontSize: "13.5px" }}>
                Open the file in a new browser tab or download a copy using the buttons below.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
            backgroundColor: "#ffffff",
          }}
        >
          <a
            href={resolvedFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "13px",
            }}
          >
            <ExternalLink size={15} />
            Open in New Tab
          </a>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "#ffffff",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "13px",
            }}
          >
            <Download size={15} />
            Download Original
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

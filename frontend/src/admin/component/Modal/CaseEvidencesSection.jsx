import React, { useMemo, useState } from "react";
import { Download, Eye, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

/**
 * Reusable section displaying all evidences and documents linked to a case.
 * Supports viewing in a new tab, inline image thumbnails, and downloading individual files.
 */
export default function CaseEvidencesSection({ caseData, showThumbnails = false }) {
  const [downloadingId, setDownloadingId] = useState(null);

  const evidences = useMemo(() => {
    if (Array.isArray(caseData?.evidences) && caseData.evidences.length > 0) {
      return caseData.evidences;
    }
    if (typeof caseData?.file === "string" && caseData.file.trim()) {
      return [
        {
          _id: `${caseData._id || "case"}-primary`,
          name: "Primary Case Document",
          fileUrl: caseData.file.trim(),
          type: "Case Filing",
          status: caseData.status || "Submitted",
          uploadedBy: "Claimant",
          uploadedAt: caseData.createdAt,
        },
      ];
    }
    return [];
  }, [caseData]);

  const isImageUrl = (url = "", name = "") => {
    const target = `${url} ${name}`.toLowerCase();
    return /\.(png|jpe?g|webp|gif)(\?|$|\s)/.test(target);
  };

  const getDownloadUrl = (rawUrl) => {
    if (!rawUrl) return "";
    if (rawUrl.includes("/image/upload/") && !rawUrl.includes("fl_attachment")) {
      return rawUrl.replace("/image/upload/", "/image/upload/fl_attachment/");
    }
    return rawUrl;
  };

  const handleDownloadEvidence = async (ev) => {
    if (!ev?.fileUrl) {
      toast.error("File URL is unavailable for this document.");
      return;
    }

    const fileName = ev.name || `Evidence_${caseData?.caseId || "Case"}`;
    const downloadUrl = getDownloadUrl(ev.fileUrl);
    setDownloadingId(ev._id);

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      toast.success(`Downloaded "${fileName}"`);
    } catch (err) {
      console.warn("Direct blob download fallback:", err.message);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusStyle = (status = "") => {
    const norm = String(status).toLowerCase();
    if (norm === "verified" || norm === "active") {
      return { background: "#dcfce7", color: "#166534" };
    }
    if (norm === "reject" || norm === "rejected") {
      return { background: "#fee2e2", color: "#991b1b" };
    }
    return { background: "#fef3c7", color: "#92400e" };
  };

  const formatDate = (val) => {
    if (!val) return "";
    const parsed = new Date(val);
    if (isNaN(parsed.getTime())) return String(val);
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (evidences.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          background: "#f8fafc",
          border: "1px dashed #cbd5e1",
          borderRadius: "8px",
          color: "#64748b",
          textAlign: "center",
          fontSize: "13px",
        }}
      >
        No documents or evidences uploaded for this case yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {evidences.map((ev, index) => {
        const isImg = isImageUrl(ev.fileUrl, ev.name);
        const statusStyle = getStatusStyle(ev.status);
        const isDownloading = downloadingId === ev._id;

        return (
          <div
            key={ev._id || `${index}-${ev.fileUrl}`}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "200px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: isImg ? "#eff6ff" : "#fff7ed",
                    color: isImg ? "#2563eb" : "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isImg ? <ImageIcon size={18} /> : <FileText size={18} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "13.5px",
                      color: "#0f172a",
                      wordBreak: "break-word",
                    }}
                  >
                    {index + 1}. {ev.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "4px",
                      fontSize: "11.5px",
                      color: "#64748b",
                    }}
                  >
                    <span
                      style={{
                        ...statusStyle,
                        padding: "1px 8px",
                        borderRadius: "999px",
                        fontWeight: 600,
                      }}
                    >
                      {ev.status || "Pending"}
                    </span>
                    <span>• {ev.type || "Evidence"}</span>
                    {ev.uploadedBy && <span>• By {ev.uploadedBy}</span>}
                    {ev.uploadedAt && <span>• {formatDate(ev.uploadedAt)}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <a
                  href={ev.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 11px",
                    borderRadius: "6px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <Eye size={14} />
                  View
                </a>
                <button
                  type="button"
                  onClick={() => handleDownloadEvidence(ev)}
                  disabled={isDownloading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 11px",
                    borderRadius: "6px",
                    background: "#ecfdf5",
                    color: "#047857",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "1px solid #a7f3d0",
                    cursor: isDownloading ? "wait" : "pointer",
                  }}
                >
                  {isDownloading ? (
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Download size={14} />
                  )}
                  Download
                </button>
              </div>
            </div>

            {showThumbnails && isImg && (
              <a
                href={ev.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Click to open full size in new tab"
                style={{ display: "block" }}
              >
                <img
                  src={ev.fileUrl}
                  alt={ev.name}
                  style={{
                    width: "100%",
                    maxHeight: "220px",
                    objectFit: "contain",
                    background: "#f8fafc",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

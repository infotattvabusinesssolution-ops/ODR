import {
  CheckSquare,
  Eye,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
  RefreshCw,
  FileText,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance, { resolveFileUrl, getDownloadFileUrl } from "../../api/axiosConfig";
import { documentDetailsApi } from "../../api/AdminApi";
import DocumentPreviewModal from "./Modal/DocumentPreviewModal";

const getDownloadUrl = getDownloadFileUrl;

const formatRoleLabel = (uploadedBy = "") => {
  const norm = String(uploadedBy).trim().toLowerCase();
  if (norm === "respondent") return "Respondent";
  if (norm === "admin") return "Admin";
  if (norm === "neutral" || norm === "mediator") return "Mediator";
  return "Claimant";
};

const getPartyColor = (party) => {
  if (party === "Respondent") return "#22bb33";
  if (party === "Admin") return "#8b5cf6";
  return "#0066cc";
};

const getStatusBadgeStyle = (status = "") => {
  const norm = String(status).trim().toLowerCase();
  if (norm === "verified" || norm === "active" || norm === "approved") {
    return { label: "Verified", color: "#16a34a" };
  }
  if (norm === "reject" || norm === "rejected") {
    return { label: "Rejected", color: "#dc2626" };
  }
  return { label: status || "Pending Review", color: "#d97706" };
};

export default function ScrutinizeSubmissions() {
  const [isMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 480 : false
  );
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const neutralId = localStorage.getItem("userId");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const targetId = neutralId || "all";
      const res = await axiosInstance.get(`/admin/get-assign-cases/${targetId}`);
      const cases =
        res.data?.success && Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];

      const items = [];
      for (const caseItem of cases) {
        const evidences = Array.isArray(caseItem.evidences) ? caseItem.evidences : [];
        const caseTitle =
          caseItem.DisputeName ||
          `${caseItem.CustomersName || "Claimant"} vs. ${
            caseItem.oppositePartyName || "Respondent"
          }`;

        for (const ev of evidences) {
          const submittedBy = formatRoleLabel(ev.uploadedBy);
          items.push({
            id: `${caseItem._id}-${ev._id || ev.fileUrl}`,
            caseMongoId: caseItem._id,
            caseId: caseItem.caseId || caseItem._id?.slice(-6) || "CASE",
            caseTitle,
            documentRecordId: ev.documentRecordId || null,
            documentName: ev.name || "Submitted Evidence",
            fileUrl: resolveFileUrl(ev.fileUrl || ""),
            type: ev.type || "Evidence",
            submittedBy,
            submittedByColor: getPartyColor(submittedBy),
            submittedDate: ev.uploadedAt
              ? new Date(ev.uploadedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Recent",
            status: ev.status || "Pending",
          });
        }
      }

      setSubmissions(items);
    } catch (error) {
      console.error("Error loading mediator submissions:", error);
      toast.error("Failed to load case submissions");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [neutralId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleStatusUpdate = async (submission, actionType) => {
    if (!submission.documentRecordId) {
      toast.info("Primary filing attachments cannot change verification status individually.");
      return;
    }

    setUpdatingId(submission.id);
    try {
      if (actionType === "approve") {
        await documentDetailsApi.updateVerifyStatus(
          submission.documentRecordId,
          "Verified"
        );
        setSubmissions((prev) =>
          prev.map((item) =>
            item.documentRecordId === submission.documentRecordId
              ? { ...item, status: "Verified" }
              : item
          )
        );
        toast.success(`Verified "${submission.documentName}"`);
      } else {
        await documentDetailsApi.updateActiveStatus(
          submission.documentRecordId,
          "Reject"
        );
        setSubmissions((prev) =>
          prev.map((item) =>
            item.documentRecordId === submission.documentRecordId
              ? { ...item, status: "Reject" }
              : item
          )
        );
        toast.info(`Marked "${submission.documentName}" as Rejected`);
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update submission status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownload = async (submission) => {
    if (!submission.fileUrl) {
      toast.error("File URL not available");
      return;
    }
    const downloadUrl = getDownloadUrl(submission.fileUrl);
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = submission.documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded "${submission.documentName}"`);
    } catch {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesParty = filterType === "all" || s.submittedBy === filterType;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.caseId.toLowerCase().includes(q) ||
      s.caseTitle.toLowerCase().includes(q) ||
      s.documentName.toLowerCase().includes(q);
    return matchesParty && matchesSearch;
  });

  const styles = {
    container: {
      padding: isMobile ? "1rem" : "2rem",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      backgroundColor: "#ff9900",
      color: "#fff",
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      marginBottom: isMobile ? "1rem" : "1.5rem",
      fontSize: "18px",
      fontWeight: "600",
      flexWrap: "wrap",
    },
    controlsRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "1.5rem",
      flexWrap: "wrap",
    },
    filterSection: {
      display: "flex",
      gap: "0.75rem",
      flexWrap: "wrap",
      alignItems: "center",
    },
    filterLabel: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#333",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    filterButton: (isActive) => ({
      padding: "0.5rem 1rem",
      backgroundColor: isActive ? "#ff9900" : "#fff",
      color: isActive ? "#fff" : "#333",
      border: `1px solid ${isActive ? "#ff9900" : "#ddd"}`,
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "600",
      transition: "all 0.2s ease",
    }),
    searchBox: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "0.45rem 0.75rem",
      minWidth: isMobile ? "100%" : "280px",
    },
    submissionsList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    submissionCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      overflow: "hidden",
      transition: "all 0.3s ease",
    },
    submissionHeader: {
      padding: "1rem 1.25rem",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "1rem",
      flexWrap: "wrap",
    },
    submissionInfo: {
      flex: 1,
      minWidth: 0,
    },
    submissionTitle: {
      fontSize: "15px",
      fontWeight: "bold",
      color: "#1e293b",
      marginBottom: "0.25rem",
      wordBreak: "break-word",
    },
    submissionMeta: {
      fontSize: "13px",
      color: "#64748b",
      marginBottom: "0.5rem",
    },
    submissionParty: (color) => ({
      display: "inline-block",
      padding: "0.2rem 0.7rem",
      backgroundColor: color + "22",
      color,
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
      marginRight: "0.5rem",
    }),
    statusBadge: (color) => ({
      display: "inline-block",
      padding: "0.2rem 0.75rem",
      backgroundColor: color + "22",
      color,
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      whiteSpace: "nowrap",
    }),
    submissionContent: {
      padding: "0.85rem 1.25rem",
      fontSize: "12.5px",
      color: "#64748b",
    },
    submissionFooter: {
      display: "flex",
      gap: "0.5rem",
      padding: "0.85rem 1.25rem",
      backgroundColor: "#f8fafc",
      borderTop: "1px solid #eee",
      flexWrap: "wrap",
    },
    actionButton: (bgColor) => ({
      flex: 1,
      minWidth: "90px",
      padding: "0.5rem 0.75rem",
      backgroundColor: bgColor + "18",
      color: bgColor,
      border: "1px solid " + bgColor + "33",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.35rem",
    }),
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <CheckSquare size={24} />
          Scrutinize Submissions (Claimant / Respondent)
        </div>
        <button
          type="button"
          onClick={fetchSubmissions}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.45)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div style={styles.controlsRow}>
        <div style={styles.filterSection}>
          <div style={styles.filterLabel}>
            <Filter size={16} />
            Filter:
          </div>
          {["all", "Claimant", "Respondent"].map((type) => (
            <button
              key={type}
              type="button"
              style={styles.filterButton(filterType === type)}
              onClick={() => setFilterType(type)}
            >
              {type === "all" ? "All Submissions" : type}
            </button>
          ))}
        </div>

        <div style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Case ID (e.g. CASE-2026-0021) or document..."
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: "13px",
            }}
          />
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <Loader2
            size={36}
            color="#ff9900"
            style={{ margin: "0 auto 0.75rem auto", animation: "spin 1s linear infinite" }}
          />
          <div>Loading real case submissions &amp; evidences...</div>
        </div>
      ) : filteredSubmissions.length > 0 ? (
        <div style={styles.submissionsList}>
          {filteredSubmissions.map((submission) => {
            const statusMeta = getStatusBadgeStyle(submission.status);
            const isBusy = updatingId === submission.id;
            return (
              <div key={submission.id} style={styles.submissionCard}>
                <div style={styles.submissionHeader}>
                  <div style={styles.submissionInfo}>
                    <div style={styles.submissionTitle}>{submission.documentName}</div>
                    <div style={styles.submissionMeta}>
                      Case #{submission.caseId} — {submission.caseTitle}
                    </div>
                    <div>
                      <span style={styles.submissionParty(submission.submittedByColor)}>
                        {submission.submittedBy}
                      </span>
                      <span style={styles.statusBadge(statusMeta.color)}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={styles.submissionContent}>
                  Type: <strong>{submission.type}</strong> • Uploaded: {submission.submittedDate}
                </div>

                <div style={styles.submissionFooter}>
                  <button
                    type="button"
                    style={styles.actionButton("#0066cc")}
                    onClick={() =>
                      setPreviewDoc({
                        fileUrl: submission.fileUrl,
                        title: `${submission.documentName} — ${submission.caseId}`,
                      })
                    }
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button
                    type="button"
                    style={styles.actionButton("#0d9488")}
                    onClick={() => handleDownload(submission)}
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    style={styles.actionButton("#16a34a")}
                    onClick={() => handleStatusUpdate(submission, "approve")}
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    style={styles.actionButton("#dc2626")}
                    onClick={() => handleStatusUpdate(submission, "reject")}
                  >
                    <AlertCircle size={14} />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "3rem 2rem",
            textAlign: "center",
            color: "#64748b",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <FileText size={44} color="#cbd5e1" style={{ margin: "0 auto 0.75rem auto" }} />
          <div style={{ fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
            No Submitted Evidences Found
          </div>
          <div style={{ fontSize: "13px" }}>
            Evidences uploaded by parties for your assigned cases will appear here automatically.
          </div>
        </div>
      )}

      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        fileUrl={previewDoc?.fileUrl}
        title={previewDoc?.title || "Document Preview"}
        onClose={() => setPreviewDoc(null)}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

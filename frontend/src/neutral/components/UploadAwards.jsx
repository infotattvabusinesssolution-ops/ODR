import {
  FileUp,
  Plus,
  Download,
  Eye,
  Trash2,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import ModalComponent from "./Modal/ModalComponent";
import axiosInstance from "../../api/axiosConfig";

export default function UploadAwards() {
  const [isMobile] = useState(window.innerWidth <= 480);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [awards, setAwards] = useState([]);
  const [assignedCases, setAssignedCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    caseId: "",
    documentType: "Award",
    summary: "",
    file: null,
  });

  const neutralId = localStorage.getItem("userId");

  // Fetch neutral's uploaded awards/orders
  const fetchAwards = useCallback(async () => {
    if (!neutralId) return;
    try {
      const res = await axiosInstance.get(`/neutral/awards/${neutralId}`);
      if (res.data?.success) {
        setAwards(res.data.data || []);
      }
    } catch (error) {
      console.error("Fetch awards error:", error);
      toast.error("Failed to load uploaded documents");
    }
  }, [neutralId]);

  // Fetch assigned cases for dropdown selection
  const fetchAssignedCases = useCallback(async () => {
    if (!neutralId) return;
    setLoadingCases(true);
    try {
      const res = await axiosInstance.get(`/admin/get-assign-cases/${neutralId}`);
      if (res.data?.success) {
        setAssignedCases(res.data.data || []);
      }
    } catch (error) {
      console.error("Fetch assigned cases error:", error);
    } finally {
      setLoadingCases(false);
    }
  }, [neutralId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAwards(), fetchAssignedCases()]);
      setLoading(false);
    };
    init();
  }, [fetchAwards, fetchAssignedCases]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        file: e.target.files[0],
      }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.caseId) {
      toast.error("Please select a Case ID");
      return;
    }
    if (!formData.file) {
      toast.error("Please attach a document file");
      return;
    }

    setUploading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append("caseId", formData.caseId);
      dataToSend.append("documentType", formData.documentType);
      dataToSend.append("summary", formData.summary);
      dataToSend.append("file", formData.file);

      const res = await axiosInstance.post("/neutral/awards/upload", dataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success("Document uploaded successfully as Draft!");
        setFormData({ caseId: "", documentType: "Award", summary: "", file: null });
        setOpenModal(false);
        fetchAwards();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (id) => {
    setPublishingId(id);
    try {
      const res = await axiosInstance.put(`/neutral/awards/${id}/publish`);
      if (res.data?.success) {
        toast.success("Document published successfully!");
        fetchAwards();
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Failed to publish document");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    setDeletingId(id);
    try {
      const res = await axiosInstance.delete(`/neutral/awards/${id}`);
      if (res.data?.success) {
        toast.success("Document deleted successfully!");
        fetchAwards();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const styles = {
    container: {
      padding: isMobile ? "1rem" : "2rem",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "linear-gradient(135deg, #ff9900 0%, #e68a00 100%)",
      color: "#fff",
      padding: "1rem 1.5rem",
      borderRadius: "12px",
      marginBottom: isMobile ? "1rem" : "2rem",
      fontSize: "18px",
      fontWeight: "600",
      flexWrap: isMobile ? "wrap" : "nowrap",
      gap: "1rem",
      boxShadow: "0 4px 12px rgba(255,153,0,0.15)",
    },
    uploadButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.625rem 1.25rem",
      backgroundColor: "#fff",
      border: "none",
      color: "#ff9900",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "700",
      transition: "transform 0.2s",
      boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
      gap: "1rem",
      marginBottom: "2rem",
    },
    statCard: (color) => ({
      backgroundColor: "#fff",
      padding: "1.25rem",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      borderLeft: `4px solid ${color}`,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
    }),
    statIcon: {
      fontSize: "24px",
      display: "flex",
      justifyContent: "center",
    },
    statNumber: {
      fontSize: "22px",
      fontWeight: "800",
      color: "#1e293b",
    },
    statLabel: {
      fontSize: "12px",
      color: "#64748b",
      fontWeight: "500",
    },
    awardsList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    awardCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
      transition: "all 0.2s ease",
    },
    awardHeader: {
      padding: "1rem 1.25rem",
      borderBottom: "1px solid #f1f5f9",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "1rem",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    awardInfo: {
      flex: 1,
    },
    awardTitle: {
      fontSize: "15px",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "0.25rem",
    },
    awardMeta: {
      fontSize: "12px",
      color: "#64748b",
      marginBottom: "0.5rem",
      fontWeight: "500",
    },
    typeAndStatus: {
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
    },
    typeBadge: (color) => ({
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      backgroundColor: color + "15",
      color: color,
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "700",
    }),
    statusBadge: (status) => {
      const colors = status === "Published" ? { bg: "#e8f5e9", txt: "#2e7d32" } : { bg: "#fff3e0", txt: "#e65100" };
      return {
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        backgroundColor: colors.bg,
        color: colors.txt,
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "700",
      };
    },
    awardContent: {
      padding: "1rem 1.25rem",
    },
    awardSummary: {
      fontSize: "13px",
      color: "#475569",
      lineHeight: "1.6",
    },
    awardFooter: {
      display: "flex",
      gap: "1rem",
      padding: "0.75rem 1.25rem",
      backgroundColor: "#f8fafc",
      borderTop: "1px solid #f1f5f9",
      fontSize: "12px",
      color: "#64748b",
      fontWeight: "500",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    footerItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.35rem",
    },
    awardActions: {
      padding: "1rem 1.25rem",
      backgroundColor: "#f8fafc",
      borderTop: "1px solid #f1f5f9",
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
    },
    actionButton: (bgColor, textColor = "#fff") => ({
      flex: 1,
      minWidth: "100px",
      padding: "8px",
      backgroundColor: bgColor,
      color: textColor,
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "700",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.35rem",
      transition: "opacity 0.2s",
    }),
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
    },
    label: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#475569",
    },
    select: {
      width: "100%",
      padding: "10px 14px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "#f8fafc",
      color: "#0f172a",
      outline: "none",
      boxSizing: "border-box",
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "#f8fafc",
      color: "#0f172a",
      outline: "none",
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      height: "80px",
      padding: "10px 14px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "#f8fafc",
      color: "#0f172a",
      outline: "none",
      boxSizing: "border-box",
      resize: "none",
    },
    filePickerZone: {
      border: "2px dashed #cbd5e1",
      borderRadius: "12px",
      padding: "20px",
      textAlign: "center",
      cursor: "pointer",
      backgroundColor: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
    },
    submitBtn: {
      backgroundColor: "#ff9900",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      fontWeight: "700",
      fontSize: "14px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(255,153,0,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      width: "100%",
      marginTop: "0.5rem",
    },
  };

  const publishedCount = awards.filter((a) => a.status === "Published").length;
  const draftCount = awards.filter((a) => a.status === "Draft").length;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh", gap: "12px" }}>
        <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "#ff9900" }} />
        <p style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Loading uploaded documents...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <FileUp size={24} />
          Upload Orders / Awards / Notes
        </span>
        <button
          style={styles.uploadButton}
          onClick={() => setOpenModal(true)}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Plus size={16} />
          Upload Document
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#3b82f6")}>
          <div style={styles.statIcon}>📋</div>
          <div style={styles.statNumber}>{awards.length}</div>
          <div style={styles.statLabel}>Total Documents</div>
        </div>

        <div style={styles.statCard("#22bb33")}>
          <div style={styles.statIcon}>✓</div>
          <div style={styles.statNumber}>{publishedCount}</div>
          <div style={styles.statLabel}>Published</div>
        </div>

        <div style={styles.statCard("#ff9900")}>
          <div style={styles.statIcon}>📝</div>
          <div style={styles.statNumber}>{draftCount}</div>
          <div style={styles.statLabel}>Draft</div>
        </div>
      </div>

      {/* Awards List */}
      {awards.length > 0 ? (
        <div style={styles.awardsList}>
          {awards.map((award) => (
            <div key={award._id} style={styles.awardCard}>
              <div style={styles.awardHeader}>
                <div style={styles.awardInfo}>
                  <div style={styles.awardTitle}>{award.fileName}</div>
                  <div style={styles.awardMeta}>
                    Case #{award.caseId} - {award.caseTitle}
                  </div>
                  <div style={styles.typeAndStatus}>
                    <span style={styles.typeBadge("#0066cc")}>{award.documentType}</span>
                    <span style={styles.statusBadge(award.status)}>{award.status}</span>
                  </div>
                </div>
              </div>

              {award.summary && (
                <div style={styles.awardContent}>
                  <div style={styles.awardSummary}>{award.summary}</div>
                </div>
              )}

              <div style={styles.awardFooter}>
                <div style={styles.footerItem}>
                  <FileText size={14} />
                  {award.fileSize}
                </div>
                <div style={styles.footerItem}>
                  <Clock size={14} />
                  {new Date(award.uploadedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div style={styles.awardActions}>
                <a
                  href={award.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", flex: 1, display: "flex" }}
                >
                  <button style={styles.actionButton("#3b82f6", "#fff")} type="button">
                    <Eye size={14} />
                    View File
                  </button>
                </a>

                {award.status === "Draft" ? (
                  <button
                    style={styles.actionButton("#22bb33", "#fff")}
                    onClick={() => handlePublish(award._id)}
                    disabled={publishingId === award._id}
                  >
                    {publishingId === award._id ? (
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Publish
                  </button>
                ) : (
                  <button style={styles.actionButton("#cbd5e1", "#64748b")} disabled>
                    Already Published
                  </button>
                )}

                <button
                  style={styles.actionButton("#ef4444", "#fff")}
                  onClick={() => handleDelete(award._id)}
                  disabled={deletingId === award._id}
                >
                  {deletingId === award._id ? (
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "4rem 1rem", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", color: "#64748b" }}>
          <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📁</div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#334155", margin: "0 0 4px 0" }}>No Uploaded Documents</h3>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>You haven't uploaded any orders, awards, or case review notes yet.</p>
        </div>
      )}

      {/* MODAL: UPLOAD NEW AWARD / ORDER */}
      {openModal && (
        <ModalComponent title="Upload Order / Award / Notes" onClose={() => setOpenModal(false)}>
          <form onSubmit={handleUploadSubmit} style={styles.form}>
            {/* Case Selection */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Select Assigned Case</label>
              {loadingCases ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Loading your cases...</span>
                </div>
              ) : (
                <select
                  style={styles.select}
                  value={formData.caseId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, caseId: e.target.value }))}
                  required
                >
                  <option value="">-- Select Case --</option>
                  {assignedCases.map((c) => (
                    <option key={c._id} value={c.caseId}>
                      {c.caseId} {c.DisputeName ? `(${c.DisputeName})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Document Type Selection */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Document Type</label>
              <select
                style={styles.select}
                value={formData.documentType}
                onChange={(e) => setFormData((prev) => ({ ...prev, documentType: e.target.value }))}
                required
              >
                <option value="Award">Award Decision</option>
                <option value="Order">Official Court Order</option>
                <option value="Notes">Internal Arbiter Notes</option>
              </select>
            </div>

            {/* Document File Selector */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Attach Document</label>
              <div
                style={styles.filePickerZone}
                onClick={() => document.getElementById("award-file-input").click()}
              >
                <Upload size={24} style={{ color: "#94a3b8", marginBottom: "4px" }} />
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                  {formData.file ? "Change attached file" : "Select file to upload"}
                </span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>PDF, DOCX, or Image formats</span>
                <input
                  id="award-file-input"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  required
                />
              </div>
              {formData.file && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  marginTop: "6px"
                }}>
                  <FileText size={16} color="#059669" />
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#065f46", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {formData.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, file: null }))}
                    style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Summary Textarea */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Brief Summary / Observation notes</label>
              <textarea
                style={styles.textarea}
                placeholder="Briefly summarize the decision, observations, or interim orders..."
                value={formData.summary}
                onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
              />
            </div>

            {/* Submit Upload */}
            <button type="submit" disabled={uploading} style={styles.submitBtn}>
              {uploading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </form>
        </ModalComponent>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

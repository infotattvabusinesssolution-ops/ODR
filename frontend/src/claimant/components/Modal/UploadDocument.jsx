import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Paperclip, Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import { ClaimantApi } from "../../../api/ClaimantApi";
import axiosInstance from "../../../api/axiosConfig";

export default function UploadDocument({ onClose, claimantId }) {
  const [formData, setFormData] = useState({
    file: null,
    caseId: "",
  });

  const email = localStorage.getItem("userEmail");
  const [claimantOwnCase, setClaimantOwnCase] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Fetch all claimant cases on mount
  useEffect(() => {
    const fetchClaimantOwnCase = async () => {
      setLoadingCases(true);
      try {
        const res = await ClaimantApi.getMyCases();
        setClaimantOwnCase(res.claimantCase || []);
      } catch (error) {
        console.error("Fetch claimant cases error:", error);
      } finally {
        setLoadingCases(false);
      }
    };
    fetchClaimantOwnCase();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData((prev) => ({
        ...prev,
        file: e.dataTransfer.files[0],
      }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        file: e.target.files[0],
      }));
    }
  };

  const handleCaseSelect = (e) => {
    setFormData((prev) => ({
      ...prev,
      caseId: e.target.value,
    }));
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      file: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.caseId) {
      toast.error("Please select a Case ID");
      return;
    }
    if (!formData.file) {
      toast.error("Please select or drop a file to upload");
      return;
    }

    setUploading(true);
    try {
      const { file, caseId } = formData;
      const formDataToSend = new FormData();
      formDataToSend.append("caseId", caseId);
      formDataToSend.append("claimantEmail", email || "");
      formDataToSend.append("file", file);

      // Use axiosInstance to route securely with auth headers and correct API domain
      const response = await axiosInstance.post(
        `/claimant/document-upload-by-claimant/${claimantId}`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200 || response.data?.success) {
        toast.success("Document uploaded successfully!");
        onClose();
      } else {
        toast.error(response.data?.message || "Failed to upload document!");
      }
    } catch (error) {
      console.error("Error submitting document upload:", error);
      toast.error(error.response?.data?.message || "Failed to upload document!");
    } finally {
      setUploading(false);
    }
  };

  const styles = {
    container: {
      padding: "10px",
      boxSizing: "border-box",
      width: "100%"
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      marginTop: "0.5rem"
    },
    label: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#475569",
      marginBottom: "0.35rem",
      display: "block"
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
      boxSizing: "border-box"
    },
    dropZone: (active) => ({
      border: `2px dashed ${active ? "#4caf50" : "#cbd5e1"}`,
      borderRadius: "12px",
      backgroundColor: active ? "rgba(76, 175, 80, 0.05)" : "#f8fafc",
      padding: "24px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px"
    }),
    uploadIcon: {
      color: "#64748b",
      marginBottom: "4px"
    },
    submitButton: {
      backgroundColor: "#4caf50",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      fontWeight: "700",
      fontSize: "14px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(76,175,80,0.2)",
      marginTop: "0.5rem",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px"
    },
    fileCard: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      backgroundColor: "#ecfdf5",
      border: "1px solid #a7f3d0",
      borderRadius: "8px",
      padding: "10px 14px",
      marginTop: "0.5rem"
    },
    fileText: {
      fontSize: "13px",
      color: "#065f46",
      fontWeight: "600",
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    removeButton: {
      background: "none",
      border: "none",
      color: "#dc2626",
      cursor: "pointer",
      padding: "2px",
      display: "flex",
      alignItems: "center"
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Case ID Selection */}
        <div>
          <label style={styles.label}>Select Related Case</label>
          {loadingCases ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span>Retrieving cases list...</span>
            </div>
          ) : (
            <select
              style={styles.select}
              value={formData.caseId}
              onChange={handleCaseSelect}
              required
            >
              <option value="">-- Choose Case ID --</option>
              {claimantOwnCase.map((c) => (
                <option key={c._id} value={c.caseId}>
                  {c.caseId} {c.DisputeName ? `(${c.DisputeName})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Drag & Drop Upload Zone */}
        <div>
          <label style={styles.label}>Document File</label>
          <div
            style={styles.dropZone(dragActive)}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-picker").click()}
          >
            <Upload size={32} style={styles.uploadIcon} />
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              Drag & Drop file here
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              or click to browse from files
            </span>
            <input
              id="file-picker"
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
              required={!formData.file}
            />
          </div>

          {/* Attached File display */}
          {formData.file && (
            <div style={styles.fileCard}>
              <FileText size={18} color="#059669" />
              <span style={styles.fileText}>{formData.file.name}</span>
              <span style={{ fontSize: "11px", color: "#047857", marginRight: "8px" }}>
                ({(formData.file.size / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                onClick={handleRemoveFile}
                style={styles.removeButton}
                title="Remove attachment"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={uploading}
          style={styles.submitButton}
        >
          {uploading ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span>Uploading document...</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>Upload Document</span>
            </>
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

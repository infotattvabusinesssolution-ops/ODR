import {
  Search,
  Upload,
  Download,
  Trash2,
  Eye,
  FileText,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  FileIcon,
  ConeIcon,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { documentDetailsApi } from "../../api/AdminApi";
import ModalComponent from "../../claimant/components/Modal/ModalComponent";
import UploadDocument from "../../claimant/components/Modal/UploadDocument";
import { ClaimantApi } from "../../api/ClaimantApi";
import axiosInstance from "../../api/axiosConfig";
import axios from "axios";

export default function SubmittedDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [documentData, setDocumentData] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [openModal, setOpenModal] = useState(null);

  const claimantId = localStorage.getItem("userId");
  const email = localStorage.getItem("userEmail");

  const fetchClaimantDocuments = async () => {
    try {
      const res = await ClaimantApi.getMyDocuments();
      return res.documents || [];
    } catch (error) {
      console.log("Fetch document error:", error);
      return [];
    }
  };

  const fetchClaimantHearings = useCallback(async () => {
    if (!claimantId) return;
    try {
      const res = await axiosInstance.get(`/claimant/get-claimant-hearings/${claimantId}`);
      if (res.data?.success) {
        setHearings(res.data.data || []);
      }
    } catch (err) {
      console.error("Fetch claimant hearings failed:", err);
    }
  }, [claimantId]);

  useEffect(() => {
    fetchClaimantDocuments().then((documents) => {
      setDocumentData(documents);
    });
    fetchClaimantHearings();
  }, [fetchClaimantHearings]);

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
        return { bg: "#e8f5e9", text: "#2e7d32", border: "#4caf50", icon: "✓" };
      case "pending":
        return {
          bg: "#fff3e0",
          text: "#f57c00",
          border: "#ff9800",
          icon: "⏳",
        };
      case "rejected":
        return { bg: "#ffebee", text: "#c62828", border: "#f44336", icon: "✕" };
      default:
        return { bg: "#f0f0f0", text: "#666", border: "#ccc", icon: "?" };
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "PDF":
        return "#f44336";
      case "DOCX":
        return "#2196f3";
      case "XLSX":
        return "#4caf50";
      default:
        return "#999";
    }
  };

  const filteredDocuments = documentData.filter((doc) => {
    const matchesSearch =
      (doc.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (doc.caseName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (doc.caseId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (doc.uploadedBy?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === "all" || doc.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const styles = {
    container: {
      padding: "clamp(1rem, 5vw, 2rem)",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#4caf50",
      color: "#fff",
      padding: "clamp(1rem, 3vw, 1.5rem)",
      borderRadius: "8px",
      marginBottom: "2rem",
      flexWrap: "wrap",
      gap: "1rem",
    },
    headerTitle: {
      fontSize: "clamp(18px, 5vw, 24px)",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    uploadButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.25rem",
      backgroundColor: "#fff",
      color: "#4caf50",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.3s ease",
      fontSize: "14px",
      whiteSpace: "nowrap",
    },
    controlsSection: {
      display: "flex",
      gap: "1rem",
      marginBottom: "2rem",
      flexWrap: "wrap",
    },
    searchBox: {
      flex: 1,
      minWidth: "250px",
      padding: "0.75rem 1rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      backgroundColor: "#fff",
    },
    filterContainer: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
      flexWrap: "wrap",
    },
    filterButton: (isActive) => ({
      padding: "0.75rem 1rem",
      backgroundColor: isActive ? "#4caf50" : "#fff",
      color: isActive ? "#fff" : "#666",
      border: `1px solid ${isActive ? "#4caf50" : "#ddd"}`,
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "500",
      transition: "all 0.3s ease",
      whiteSpace: "nowrap",
    }),
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem",
    },
    statCard: (color) => ({
      backgroundColor: "#fff",
      padding: "1rem",
      borderRadius: "8px",
      textAlign: "center",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      borderLeft: `4px solid ${color}`,
    }),
    statValue: {
      fontSize: "clamp(20px, 4vw, 28px)",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.25rem",
    },
    statLabel: {
      fontSize: "12px",
      color: "#999",
    },
    tableWrapper: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      overflow: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "1000px",
    },
    tableHeader: {
      backgroundColor: "#f5f5f5",
      borderBottom: "2px solid #ddd",
    },
    tableHeaderCell: {
      padding: "1rem",
      textAlign: "left",
      fontSize: "13px",
      fontWeight: "600",
      color: "#666",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    },
    tableRow: {
      borderBottom: "1px solid #eee",
      transition: "background-color 0.2s ease",
    },
    tableCell: {
      padding: "1rem",
      fontSize: "13px",
      color: "#333",
    },
    docNameCell: {
      fontWeight: "500",
      color: "#4caf50",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    statusBadge: (status) => {
      const colors = getStatusColor(status);
      return {
        display: "inline-block",
        padding: "0.35rem 0.75rem",
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      };
    },
    actionButtons: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
      flexWrap: "wrap",
    },
    actionButton: (bgColor) => ({
      padding: "0.5rem 0.75rem",
      backgroundColor: bgColor,
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px",
      transition: "opacity 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
    }),
    emptyState: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "3rem 1rem",
      textAlign: "center",
      color: "#666",
    },
    emptyIcon: {
      fontSize: "48px",
      marginBottom: "1rem",
      opacity: 0.5,
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>📄 Case Details</div>
        <button
          style={styles.uploadButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onClick={() => setOpenModal("upload")}
        >
          <Upload size={18} />
          Upload Document
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#4caf50")}>
          <div style={styles.statValue}>
            {documentData.filter((d) => d.status === "verified").length}
          </div>
          <div style={styles.statLabel}>Verified</div>
        </div>
        <div style={styles.statCard("#ff9800")}>
          <div style={styles.statValue}>
            {documentData.filter((d) => d.status === "pending").length}
          </div>
          <div style={styles.statLabel}>Pending Review</div>
        </div>
        <div style={styles.statCard("#f44336")}>
          <div style={styles.statValue}>
            {documentData.filter((d) => d.status === "rejected").length}
          </div>
          <div style={styles.statLabel}>Rejected</div>
        </div>
        <div style={styles.statCard("#2196f3")}>
          <div style={styles.statValue}>{documentData.length}</div>
          <div style={styles.statLabel}>Total Documents</div>
        </div>
      </div>

      {/* Controls Section */}
      <div style={styles.controlsSection}>
        <div style={styles.searchBox}>
          <Search size={18} color="#999" />
          <input
            type="text"
            placeholder="Search by document name, case ID, or uploader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={styles.filterContainer}>
          <Filter size={18} color="#666" />
          <button
            style={styles.filterButton(filterStatus === "all")}
            onClick={() => setFilterStatus("all")}
          >
            All
          </button>
          <button
            style={styles.filterButton(filterStatus === "verified")}
            onClick={() => setFilterStatus("verified")}
          >
            Verified
          </button>
          <button
            style={styles.filterButton(filterStatus === "pending")}
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </button>
          <button
            style={styles.filterButton(filterStatus === "rejected")}
            onClick={() => setFilterStatus("rejected")}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Documents Table View */}
      {filteredDocuments.length > 0 ? (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>Document Name</th>
                <th style={styles.tableHeaderCell}>Case ID</th>
                <th style={styles.tableHeaderCell}>Type</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Hearing</th>

                {/* <th style={styles.tableHeaderCell}>Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc, index) => {
                const statusColors = getStatusColor(doc.status);
                return (
                  <tr
                    key={index}
                    style={styles.tableRow}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9f9f9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={styles.tableCell}>
                      <div style={styles.docNameCell}>
                        <FileText size={16} color={getFileIcon(doc.fileType)} />
                        {doc.DocumentName}
                      </div>
                    </td>
                    <td style={styles.tableCell}>{doc.caseId}</td>
                    <td style={styles.tableCell}>{doc.fileType}</td>
                    <td style={styles.tableCell}>
                      <span style={styles.statusBadge(doc.status)}>
                        {doc.status}
                      </span>
                    </td>

                    <td style={styles.tableCell}>
                      {(() => {
                        const matchingHearing = hearings.find(h => h.caseId === doc.caseId);
                        const isScheduled = matchingHearing && matchingHearing.status !== "Pending";
                        return isScheduled ? (
                          <span style={{ fontWeight: "600", color: "#673ab7" }}>
                            {matchingHearing.date} · {matchingHearing.time}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                            Not Assigned
                          </span>
                        );
                      })()}
                    </td>

                    {/* <td style={styles.tableCell}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.actionButton("#2196f3")}
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          style={styles.actionButton("#4caf50")}
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        {doc.status === "pending" && (
                          <button
                            style={styles.actionButton("#f44336")}
                            title="Reject"
                          >
                            <AlertCircle size={14} />
                          </button>
                        )}
                        <button
                          style={styles.actionButton("#9c27b0")}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>

                        <button
                          className="btn btn-success"
                          onClick={() => updateStatus(row._id, "Verified")}
                        >
                          ✔ Verify
                        </button>

                        <button
                          className="btn btn-warning"
                          onClick={() => updateStatus(row._id, "Pending")}
                        >
                          🕒 Pending
                        </button>

                        <button
                          className="btn btn-danger"
                          onClick={() => updateStatus(row._id, "Rejected")}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📄</div>
          <div>No documents found matching your search criteria</div>
        </div>
      )}

      {openModal === "upload" && (
        <ModalComponent
          title="Upload Case Document"
          onClose={() => {
            setOpenModal(null);
            fetchClaimantDocuments().then((documents) => {
              setDocumentData(documents);
            });
            fetchClaimantHearings();
          }}
        >
          <UploadDocument
            onClose={() => {
              setOpenModal(null);
              fetchClaimantDocuments().then((documents) => {
                setDocumentData(documents);
              });
              fetchClaimantHearings();
            }}
            claimantId={claimantId}
          />
        </ModalComponent>
      )}
    </div>
  );
}

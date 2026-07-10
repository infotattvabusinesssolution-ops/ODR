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
} from "lucide-react";
import { useEffect, useState } from "react";
import { documentDetailsApi } from "../../api/AdminApi";
import ModalComponent from "../../admin/component/Modal/ModalComponent";
import UploadDocument from "../../admin/component/Modal/UploadDocument";
import { toast } from "react-toastify";

export default function SubmittedDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [documentData, setDocumentData] = useState([]);
  const [openModal, setOpenModal] = useState(null);
  const [toggleState, setToggleState] = useState({}); //for each id
  const [totalDoc, setTotalDoc] = useState([]);

  // for delete button
  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this case?"
    );
    if (!confirmDelete) return;
    documentDetailsApi
      .deleteSubmitDocument(id)
      .then((res) => {
        toast.success("Document deleted successfully");
        // Refresh case list after deletion
        setDocumentData((prevCases) =>
          prevCases.filter((caseItem) => caseItem._id !== id)
        );
      })
      .catch((err) => {
        alert(err.message || "Failed to delete case");
      });
  };

  const handleToggleOne = async (id, type) => {
    try {
      if (type === "verify") {
        const current = toggleState[id];
        const newStatus = current ? "Pending" : "Verified";

        await documentDetailsApi.updateVerifyStatus(id, newStatus);

        setToggleState((prev) => ({
          ...prev,
          [id]: !current,
        }));
      }

      if (type === "active") {
        const current = toggleState[`${id}-active`];
        const newStatus = current ? "Active" : "Reject";

        await documentDetailsApi.updateActiveStatus(id, newStatus);

        setToggleState((prev) => ({
          ...prev,
          [`${id}-active`]: !current,
        }));
      }
      console.log();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  useEffect(() => {
    const fetchDocumentDetals = async () => {
      try {
        const data = await documentDetailsApi.getAllDocumentsDetails();
        setDocumentData(data.data.documents);
        setTotalDoc(data.data.stats);
        console.log("all documents data", data.data);
      } catch (error) {
        console.error("Error fetching cases:", error);
      }
    };
    fetchDocumentDetals();
  }, []);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase().trim();

    switch (s) {
      case "verified":
        return { bg: "#e8f5e9", text: "#2e7d32", border: "#4caf50" }; // green
      case "pending":
        return { bg: "#e0e0e0", text: "#616161", border: "#9e9e9e" }; // gray
      case "active":
        return { bg: "#e3f2fd", text: "#1565c0", border: "#2196f3" }; // blue
      case "reject":
        return { bg: "#ffebee", text: "#c62828", border: "#f44336" }; // red
      default:
        return { bg: "#f0f0f0", text: "#666", border: "#ccc" };
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
      (doc.DocumentName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (doc.UploadedBy?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (doc.activeStatus?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (doc.Type?.toLowerCase() || "").includes(searchTerm.toLowerCase());

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
        <div style={styles.headerTitle}>📄 Submitted Documents</div>
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
          <div style={styles.statValue}>{totalDoc.totalVerified}</div>
          <div style={styles.statLabel}>Verified</div>
        </div>
        <div style={styles.statCard("#ff9800")}>
          <div style={styles.statValue}>{totalDoc.totalPendingReview}</div>
          <div style={styles.statLabel}>Pending Review</div>
        </div>
        <div style={styles.statCard("#f44336")}>
          <div style={styles.statValue}>{totalDoc.totalRejected}</div>
          <div style={styles.statLabel}>Rejected</div>
        </div>
        <div style={styles.statCard("#2196f3")}>
          <div style={styles.statValue}>{totalDoc.totalDocuments}</div>
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
            style={styles.filterButton(filterStatus === "Verified")}
            onClick={() => setFilterStatus("Verified")}
          >
            Verified
          </button>
          <button
            style={styles.filterButton(filterStatus === "Pending")}
            onClick={() => setFilterStatus("Pending")}
          >
            Pending
          </button>
          <button
            style={styles.filterButton(filterStatus === "Rejected")}
            onClick={() => setFilterStatus("Rejected")}
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
                <th style={styles.tableHeaderCell}>Uploaded By</th>
                <th style={styles.tableHeaderCell}>Upload Date</th>
                <th style={styles.tableHeaderCell}>Size</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc, index) => {
                const isOn = toggleState[doc._id] || false;
                const statusColors = getStatusColor(doc.status);
                const verifyIsOn = toggleState[doc._id] || false;
                const activeIsOn = toggleState[`${doc._id}-active`] || false;
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
                    <td style={styles.tableCell}>{doc.Type}</td>
                    <td style={styles.tableCell}>
                      <span style={styles.statusBadge(doc.status)}>
                        {doc.status}
                      </span>
                    </td>

                    <td style={styles.tableCell}>{doc.UploadedBy}</td>
                    <td style={styles.tableCell}>{doc.uploadedAt}</td>
                    <td style={styles.tableCell}>{doc.formattedSize}</td>
                    <td style={styles.tableCell}>
                      <div style={styles.actionButtons}>
                        {/* <button
                          style={styles.actionButton("#2196f3")}
                          title="View"
                        >
                          <Eye size={14} />
                        </button> */}
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
                          onClick={() => handleDelete(doc._id)}
                        >
                          <Trash2 size={14} />
                        </button>

                        <div key={doc._id} className="flex gap-4">
                          {/* Verified / Pending */}
                          <button>
                            <div
                              onClick={() => handleToggleOne(doc._id, "verify")}
                              className={`w-16 h-8 flex items-center rounded-full cursor-pointer transition relative
            ${verifyIsOn ? "bg-green-500" : "bg-gray-400"}`}
                            >
                              <span
                                className={`absolute top-1/2 -translate-y-1/2 text-[8px] text-white transition-all duration-300
              ${verifyIsOn ? "left-3" : "right-3"}`}
                              >
                                {verifyIsOn ? "Verified" : "Pending"}
                              </span>

                              <div
                                className={`w-4 h-4 bg-white rounded-full shadow absolute top-2 transition-all duration-300
              ${verifyIsOn ? "right-1" : "left-1"}`}
                              ></div>
                            </div>
                          </button>

                          {/* Active / Reject */}
                          <button>
                            <div
                              onClick={() => handleToggleOne(doc._id, "active")}
                              className={`w-16 h-8 flex items-center rounded-full cursor-pointer transition relative
            ${activeIsOn ? "bg-red-500" : "bg-blue-500"}`}
                            >
                              <span
                                className={`absolute top-1/2 -translate-y-1/2 text-[8px] text-white transition-all duration-300
              ${activeIsOn ? "left-3" : "right-3"}`}
                              >
                                {activeIsOn ? "Reject" : "Active"}
                              </span>

                              <div
                                className={`w-4 h-4 bg-white rounded-full shadow absolute top-2 transition-all duration-300
              ${activeIsOn ? "right-1" : "left-1"}`}
                              ></div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </td>
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
        <ModalComponent tittle="" onClose={() => setOpenModal(null)}>
          <UploadDocument onClose={() => setOpenModal(null)} />
        </ModalComponent>
      )}
    </div>
  );
}

import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronRight,
  Filter,
  Download,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { caseApi } from "../../api/AdminApi";
import { toast } from "react-toastify";
import axios from "axios";
import CaseFile from "../../admin/component/Modal/CaseFile.jsx";
import EditFile from "../../admin/component/Modal/EditFile.jsx";
import AllDetails from "../../admin/component/Modal/AllDetails.jsx";
import ModalComponent from "../../admin/component/Modal/ModalComponent.jsx";
import ViewFile from "./Modal/ViewFIle.jsx";
import { ClaimantApi } from "../../api/ClaimantApi";
import AsignCase from "../../admin/component/Modal/AsignCase.jsx";

export default function CaseManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [totalUsers, setTotalUsers] = useState(0);
  const [caseData, setCaseData] = useState([]);
  const [openModal, setOpenModal] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);

  // all case data fetching here
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await caseApi.getAllCases();
        setCaseData(data.data);
        console.log(data.data);
        setTotalUsers(data.totalUsers);
      } catch (error) {
        console.error("Error fetching cases:", error);
      }
    };
    fetchCases();
  }, []);

  // for delete button
  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this case?"
    );
    if (!confirmDelete) return;
    caseApi
      .deleteClaimantCase(id)
      .then((res) => {
        toast.success("Case deleted successfully");
        // Refresh case list after deletion
        setCaseData((prevCases) =>
          prevCases.filter((caseItem) => caseItem._id !== id)
        );
      })
      .catch((err) => {
        alert(err.message || "Failed to delete case");
      });
  };

  // for getting count of cases by status
  const getCasesByStatus = (status) => {
    const count = caseData.filter(
      (c) => c.status && c.status.toLowerCase() === status.toLowerCase()
    ).length;

    // If count < 10 → add leading zero (e.g., 01, 02, 09)
    return count < 10 ? `0${count}` : count;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return { bg: "#e8f5e9", text: "#2e7d32", border: "#4caf50" };
      case "pending":
        return { bg: "#fff3e0", text: "#f57c00", border: "#ff9800" };
      case "closed":
        return { bg: "#ffebee", text: "#c62828", border: "#f44336" };
      default:
        return { bg: "#f0f0f0", text: "#666", border: "#ccc" };
    }
  };

  const filteredCases = caseData.filter((caseItem) => {
    const search = searchTerm.toLowerCase();

    const disputeName = caseItem.DisputeName?.toLowerCase() || "";
    const oppositePartyName = caseItem.oppositePartyName?.toLowerCase() || "";
    const caseId = caseItem.caseId?.toLowerCase() || "";
    const caseNumber = caseItem._id?.toLowerCase() || "";
    const status = caseItem.status?.trim().toLowerCase() || "";

    const matchesSearch =
      disputeName.includes(search) ||
      oppositePartyName.includes(search) ||
      caseId.includes(search) ||
      caseNumber.includes(search) ||
      status.includes(search);

    const matchesFilter = filterStatus === "all" || status === filterStatus;

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
      backgroundColor: "#00bcd4",
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
    addButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.25rem",
      backgroundColor: "#fff",
      color: "#00bcd4",
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
      backgroundColor: isActive ? "#00bcd4" : "#fff",
      color: isActive ? "#fff" : "#666",
      border: `1px solid ${isActive ? "#00bcd4" : "#ddd"}`,
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
      minWidth: "900px",
    },
    tableHeader: {
      backgroundColor: "#f5f5f5",
      borderBottom: "2px solid #ddd",
    },
    tableHeaderCell: {
      padding: "1rem",
      textAlign: "center",
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
      textAlign: "center",
    },
    caseIdCell: {
      fontWeight: "600",
      color: "#00bcd4",
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
        <div style={styles.headerTitle}>📋 Case Management</div>
        <button
          style={styles.addButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onClick={() => setOpenModal("new")}
        >
          <Plus size={18} />
          New Case
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#4caf50")}>
          <div style={styles.statValue}>
            <div style={styles.statValue}>
              {caseData.filter((c) => c.status === "active").length} /{" "}
              {totalUsers}
            </div>
          </div>
          <div style={styles.statLabel}>Active Cases</div>
        </div>
        <div style={styles.statCard("#ff9800")}>
          <div style={styles.statValue}>{getCasesByStatus("Pending")}</div>
          <div style={styles.statLabel}>Pending Cases</div>
        </div>
        <div style={styles.statCard("#f44336")}>
          <div style={styles.statValue}>
            {caseData.filter((c) => c.status === "closed").length}
          </div>
          <div style={styles.statLabel}>Closed Cases</div>
        </div>
        <div style={styles.statCard("#2196f3")}>
          <div style={styles.statValue}>
            {caseData.filter((c) => c.status === "active").length}
            {totalUsers}
          </div>
          <div style={styles.statLabel}>Total Cases</div>
        </div>
      </div>

      {/* Controls Section */}
      <div style={styles.controlsSection}>
        <div style={styles.searchBox}>
          <Search size={18} color="#999" />
          <input
            type="text"
            placeholder="Search by case ID, number, or title..."
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
            style={styles.filterButton(filterStatus === "active")}
            onClick={() => setFilterStatus("active")}
          >
            Active
          </button>
          <button
            style={styles.filterButton(filterStatus === "pending")}
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </button>
          <button
            style={styles.filterButton(filterStatus === "closed")}
            onClick={() => setFilterStatus("closed")}
          >
            Closed
          </button>
        </div>
      </div>

      {/* Cases Table */}
      {filteredCases.length > 0 ? (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>Case ID</th>
                <th style={styles.tableHeaderCell}>Title</th>
                <th style={styles.tableHeaderCell}>Case Status</th>
                <th style={styles.tableHeaderCell}>Date Filed</th>
                <th style={styles.tableHeaderCell}>Parties</th>
                <th style={styles.tableHeaderCell}>Judge</th>
                <th style={styles.tableHeaderCell}>Documents</th>
                <th style={styles.tableHeaderCell}>Details</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((caseItem, index) => (
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
                  <td style={{ ...styles.tableCell, ...styles.caseIdCell }}>
                    {caseItem.caseId}
                  </td>
                  <td
                    style={styles.tableCell}
                  >{`${caseItem.DisputeName} vs ${caseItem.oppositePartyName} `}</td>
                  <td style={styles.tableCell}>
                    <span style={styles.statusBadge(caseItem.status)}>
                      {caseItem.status}
                    </span>
                  </td>
                  <td style={styles.tableCell}>{caseItem.createdAt}</td>
                  <td style={styles.tableCell}>{caseItem.DisputeName}</td>
                  <td style={styles.tableCell}>
                    {caseItem?.neutral?.name || "Not Assigned"}
                  </td>

                  <td style={styles.tableCell}>
                    <button
                      style={{
                        backgroundColor: "#e0e0e0",
                        color: "#333",
                        border: "none",
                        padding: "0.3rem 0.7rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {caseItem.documentsCount}
                    </button>
                  </td>
                  <td style={styles.tableCell}>
                    <button
                      style={styles.addButton}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      onClick={() => {
                        setOpenModal("details");
                        setSelectedCase(caseItem);
                      }}
                    >
                      Details
                    </button>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      {typeof caseItem.file === "string" && (
                        <a
                          style={styles.actionButton("#2196f3")}
                          title="View"
                          href={caseItem.file}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye size={14} />
                        </a>
                      )}
                      <button
                        style={styles.actionButton("#ff9800")}
                        title="Edit"
                        onClick={() => {
                          setSelectedCase(caseItem); // ✅ store clicked case data
                          setOpenModal("edit");
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        style={styles.actionButton("#f44336")}
                        title="Delete"
                        onClick={() => handleDelete(caseItem._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          caseApi.downloadClaimantCaseFile(caseItem._id)
                        }
                        style={styles.actionButton("#4caf50")}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        style={styles.actionButton("#4caf50")}
                        onClick={() => {
                          setSelectedCase(caseItem._id); // ✅ store clicked case data
                          setOpenModal("asignCase");
                        }}
                      >
                        Asign Case
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📁</div>
          <div>No cases found matching your search criteria</div>
        </div>
      )}
      {/* Reusable Modal */}

      {openModal === "new" && (
        <ModalComponent title="" onClose={() => setOpenModal(null)}>
          <CaseFile onClose={() => setOpenModal(null)} />
        </ModalComponent>
      )}

      {openModal === "edit" && selectedCase && (
        <ModalComponent title="" onClose={() => setOpenModal(null)}>
          <EditFile
            caseData={selectedCase} // ✅ pass selected case
            onClose={() => {
              setOpenModal(null);
              setSelectedCase(null);
            }}
          />
        </ModalComponent>
      )}

      {openModal === "view" && (
        <ModalComponent title="" onClose={() => setOpenModal(null)}>
          <ViewFile
            caseData={selectedCase}
            onClose={() => setOpenModal(null)}
          />
        </ModalComponent>
      )}
      {openModal === "details" && (
        <ModalComponent title="" onClose={() => setOpenModal(null)}>
          <AllDetails
            caseData={selectedCase}
            onClose={() => setOpenModal(null)}
          />
        </ModalComponent>
      )}
      {openModal === "asignCase" && selectedCase && (
        <ModalComponent title="" onClose={() => setOpenModal(null)}>
          <AsignCase
            selectedCaseId={selectedCase}
            onClose={() => setOpenModal(null)}
          />
        </ModalComponent>
      )}
    </div>
  );
}

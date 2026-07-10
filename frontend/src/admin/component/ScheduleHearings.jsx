import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Video,
  Eye,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
import NewHearing from "../../admin/component/Modal/NewHearing";
import UpdateNewHearing from "../../admin/component/Modal/UpdateNewHearing";
import ModalComponent from "../../admin/component/Modal/ModalComponent";
import AsignScheduleHearing from "../../admin/component/Modal/AsignScheduleHearing";
import { documentDetailsApi } from "../../api/AdminApi";
import { caseApi } from "../../api/AdminApi";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function ScheduleHearings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openModal, setOpenModal] = useState(null);
  const [newHearingData, setNewHearingData] = useState([]);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const [hearingData, setHearingData] = useState([]);

  const { caseId } = useParams(); // ✔ FIXED

  useEffect(() => {
    const getCaseById = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";
        const response = await axios.get(
          `${API_BASE_URL}/admin/get-new-hearing`
        );
        setNewHearingData(response.data.data);
        console.log(response.data);
      } catch (error) {
        console.log("data fetched error", error);
      }
    };
    getCaseById();
  }, []);
  // for delete
  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this case?"
    );
    if (!confirmDelete) return;
    documentDetailsApi
      .deleteHearing(id)
      .then((res) => {
        toast.success("Hearing deleted successfully");
        // Refresh case list after deletion
        setNewHearingData((prev) =>
          prev.filter((hearing) => hearing._id !== id)
        );
      })
      .catch((err) => {
        alert(err.message || "Failed to delete Hearing");
      });
  };

  // for handling status toggle button
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "Scheduled" ? "Pending" : "Scheduled";

      await documentDetailsApi.hearingActiveStatus(id, newStatus);

      console.log("Updated hearing status:", newStatus);
      setNewHearingData((prev) =>
        prev.map((h) => (h._id === id ? { ...h, status: newStatus } : h))
      );
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return {
          bg: "#e8f5e9",
          text: "#2e7d32",
          border: "#4caf50",
          label: "✓ Scheduled",
        };
      case "pending":
        return {
          bg: "#fff3e0",
          text: "#f57c00",
          border: "#ff9800",
          label: "⏳ Pending",
        };
      case "completed":
        return {
          bg: "#e3f2fd",
          text: "#1565c0",
          border: "#2196f3",
          label: "✓ Completed",
        };
      case "cancelled":
        return {
          bg: "#ffebee",
          text: "#c62828",
          border: "#f44336",
          label: "✕ Cancelled",
        };
      default:
        return {
          bg: "#f0f0f0",
          text: "#666",
          border: "#ccc",
          label: "Unknown",
        };
    }
  };

  const filteredHearings = (newHearingData || []).filter((hearing) => {
    const disputeName = hearing?.disputeName?.toLowerCase() || "";
    const caseId = hearing?.caseId?.toLowerCase() || "";
    const hearingType = hearing?.hearingType?.toLowerCase() || "";
    const judgeName = hearing?.judgeName?.toLowerCase() || "";

    return (
      disputeName.includes(searchTerm.toLowerCase()) ||
      caseId.includes(searchTerm.toLowerCase()) ||
      hearingType.includes(searchTerm.toLowerCase()) ||
      judgeName.includes(searchTerm.toLowerCase())
    );
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
      backgroundColor: "#2196f3",
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
    scheduleButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.25rem",
      backgroundColor: "#fff",
      color: "#2196f3",
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
      backgroundColor: isActive ? "#2196f3" : "#fff",
      color: isActive ? "#fff" : "#666",
      border: `1px solid ${isActive ? "#2196f3" : "#ddd"}`,
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
      minWidth: "1100px",
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
    caseNameCell: {
      fontWeight: "600",
      color: "#2196f3",
    },
    hearingTypeCell: {
      fontSize: "12px",
      color: "#666",
      fontWeight: "500",
    },
    dateTimeCell: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "13px",
    },
    locationCell: {
      display: "flex",
      alignItems: "center",
      gap: "0.35rem",
      fontSize: "12px",
      color: "#666",
    },

    statusBadge: (status) => {
      const getStatusColor = (status) => {
        switch (status) {
          case "Pending":
            return { bg: "#D1D5DB", textColor: "black", label: "Pending" }; // Yellow
          case "Scheduled":
            return { bg: "#00C951", textColor: "white", label: "Scheduled" }; // Green
          default:
            return { bg: "#9E9E9E", textColor: "white", label: status };
        }
      };

      const colors = getStatusColor(status);
      return {
        display: "inline-block",
        padding: "0.35rem 0.75rem",
        backgroundColor: colors.bg,
        color: colors.textColor, // ✅ FIXED (was colors.text)
        border: "1px solid transparent", // ✔ or remove border
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "600",
        whiteSpace: "nowrap",
      };
    },

    infoChip: {
      display: "inline-block",
      padding: "0.3rem 0.6rem",
      backgroundColor: "#f0f0f0",
      color: "#666",
      borderRadius: "4px",
      fontSize: "11px",
      marginRight: "0.3rem",
      whiteSpace: "nowrap",
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
        <div style={styles.headerTitle}>📅 Schedule Hearings</div>
        <button
          style={styles.scheduleButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onClick={() => {
            setOpenModal("newHearing");
          }}
        >
          <Plus size={18} />
          New Hearing
        </button>
      </div>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#2196f3")}>
          <div style={styles.statValue}>{""}</div>
          <div style={styles.statLabel}>Total Hearings</div>
        </div>
        <div style={styles.statCard("#4caf50")}>
          <div style={styles.statValue}>{""}</div>
          <div style={styles.statLabel}>Scheduled</div>
        </div>
        <div style={styles.statCard("#ff9800")}>
          <div style={styles.statValue}>{""}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard("#2196f3")}>
          <div style={styles.statValue}>{""}</div>
          <div style={styles.statLabel}>Assigned Judges</div>
        </div>
      </div>
      {/* Controls Section */}
      <div style={styles.controlsSection}>
        <div style={styles.searchBox}>
          <Search size={18} color="#999" />
          <input
            type="text"
            placeholder="Search by case, judge, location, or hearing type..."
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
            style={styles.filterButton(filterStatus === "Scheduled")}
            onClick={() => setFilterStatus("Scheduled")}
          >
            Scheduled
          </button>
          <button
            style={styles.filterButton(filterStatus === "Pending")}
            onClick={() => setFilterStatus("Pending")}
          >
            Pending
          </button>
        </div>
      </div>
      {/* Hearings Table */}
      {filteredHearings.length > 0 ? (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>Case Name</th>
                <th style={styles.tableHeaderCell}>Case Id</th>
                <th style={styles.tableHeaderCell}>Hearing Type</th>
                <th style={styles.tableHeaderCell}>Date</th>
                <th style={styles.tableHeaderCell}>Time</th>
                <th style={styles.tableHeaderCell}>Duration</th>
                <th style={styles.tableHeaderCell}>Location</th>
                <th style={styles.tableHeaderCell}>Judge</th>
                <th style={styles.tableHeaderCell}>Status</th>
                {/* <th style={styles.tableHeaderCell}>Details</th> */}
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHearings.map((hearing, index) => {
                const statusColors = getStatusColor(hearing.status);
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
                    <td style={{ ...styles.tableCell, ...styles.caseNameCell }}>
                      {`${hearing.caseName}`}
                    </td>
                    <td style={{ ...styles.tableCell, ...styles.caseNameCell }}>
                      {hearing.caseId}
                    </td>
                    <td
                      style={{ ...styles.tableCell, ...styles.hearingTypeCell }}
                    >
                      {hearing?.hearingType ? hearing.hearingType : "N/A"}
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.dateTimeCell}>
                        {hearing?.date || "N/A"}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div className="" style={styles.dateTimeCell}>
                        {" "}
                        {/* <Clock size={14} color="#2196f3" /> */}
                        {hearing?.time || "N/A"}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      {hearing?.duration || "N/A"}
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.locationCell}>
                        {/* <MapPin size={12} /> */}
                        {hearing?.location || "N/A"}
                      </div>
                    </td>
                    <td style={styles.tableCell}>{hearing.Judge}</td>
                    <td style={styles.tableCell}>
                      <span style={styles.statusBadge(hearing.status)}>
                        {hearing?.status || "N/A"}
                      </span>
                    </td>
                    {/* <td style={styles.tableCell}>
                      <div>
                        <span style={styles.infoChip}>
                          <Users
                            size={10}
                            style={{ display: "inline", marginRight: "2px" }}
                          />
                          {hearing.participants}
                        </span>
                        <span style={styles.infoChip}>
                          <FileText
                            size={10}
                            style={{ display: "inline", marginRight: "2px" }}
                          />
                          {hearing.documents}
                        </span>
                      </div>
                    </td> */}
                    <td style={styles.tableCell}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.actionButton("#ff9800")}
                          title="Edit"
                          onClick={() => {
                            setSelectedHearing(hearing);
                            setOpenModal("Edit");
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          style={styles.actionButton("#f44336")}
                          title="Delete"
                          onClick={() => handleDelete(hearing._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          style={styles.actionButton("#2196f3")}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          onClick={() => {
                            setSelectedCaseId(hearing._id);
                            setOpenModal("scheduleHearing");
                          }}
                        >
                          <Plus size={14} style={{ color: "white" }} />
                        </button>

                        {/* for join meeting  */}
                        <a
                          style={styles.actionButton("#2196f3")}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          href={hearing.meetLink} // <-- Your meeting link from DB
                          target="_blank" // <-- Opens Google Meet in new tab
                          rel="noopener noreferrer"
                        >
                          <Video size={14} />
                        </a>
                        <div key={hearing._id} className="flex gap-4">
                          <button type="button" style={{ background: "none", border: "none", padding: 0 }}>
                            <div
                              onClick={() => handleToggleStatus(hearing._id, hearing.status)}
                              className={`w-20 h-8 flex items-center rounded-full cursor-pointer transition relative
        ${hearing.status === "Scheduled" ? "bg-green-500" : "bg-gray-400"}`}
                            >
                              <span
                                className={`absolute top-1/2 -translate-y-1/2 text-[10px] text-white transition-all duration-300
          ${hearing.status === "Scheduled" ? "left-3" : "right-3"}`}
                              >
                                {hearing.status === "Scheduled"
                                  ? "Scheduled"
                                  : "Pending"}
                              </span>

                              <div
                                className={`w-4 h-4 bg-white rounded-full shadow absolute top-2 transition-all duration-300
          ${hearing.status === "Scheduled" ? "right-1" : "left-1"}`}
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
          <div style={styles.emptyIcon}>📅</div>
          <div>No hearings found matching your search criteria</div>
        </div>
      )}
      {openModal === "newHearing" && (
        <ModalComponent onClose={() => setOpenModal(null)}>
          <NewHearing
            onClose={() => {
              setOpenModal(null);
              setSelectedCaseId(null);
            }}
          />
        </ModalComponent>
      )}

      {openModal === "scheduleHearing" && selectedCaseId && (
        <ModalComponent onClose={() => setOpenModal(null)}>
          <AsignScheduleHearing
            selectedCaseId={selectedCaseId}
            onClose={() => {
              setOpenModal(null);
            }}
          />
        </ModalComponent>
      )}
      {openModal === "Edit" && selectedHearing && (
        <ModalComponent title="" onClose={() => setOpenModal(null)}>
          <UpdateNewHearing
            newHearingData={selectedHearing}
            onClose={() => {
              setOpenModal(null);
              setSelectedHearing(null);
            }}
          />
        </ModalComponent>
      )}
    </div>
  );
}

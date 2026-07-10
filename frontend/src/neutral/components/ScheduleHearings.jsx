import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  MapPin,
  Video,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import ScheduleHearingForm from "../../neutral/components/Modal/ScheduleHearingForm";
import EditScheduleHearing from "../../neutral/components/Modal/EditScheduleHearing";
import ModalComponent from "../../neutral/components/Modal/ModalComponent";
import { documentDetailsApi } from "../../api/AdminApi";
import { toast } from "react-toastify";
import axios from "axios";

export default function ScheduleHearings() {
  const [openModal, setOpenModal] = useState(null);
  const [newHearingData, setNewHearingData] = useState([]);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [totalData, setTotalData] = useState([]);

  const [ScheduleHearingData, setScheduleHearingData] = useState([]);

  const neutralId = localStorage.getItem("userId"); // neutral login id

  const fetchAssignedCases = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";
      const res = await axios.get(
        `${API_BASE_URL}/admin/get-schedule-hearing/${neutralId}`
      );
      setScheduleHearingData(res.data.data);
      console.log(res.data.data);
      console.log("Neutral ID:", neutralId);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchAssignedCases();
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
        setScheduleHearingData((prev) =>
          prev.filter((hearing) => hearing._id !== id)
        );
      })
      .catch((err) => {
        alert(err.message || "Failed to delete Hearing");
      });
  };

  const [isMobile] = useState(window.innerWidth <= 480);

  const [hearings] = useState([
    {
      id: 1,
      caseId: "2024-45",
      caseTitle: "Smith vs. Johnson",
      claimant: "Smith",
      respondent: "Johnson",
      scheduledDate: "25 Sep 2025",
      scheduledTime: "10:30 AM",
      location: "Virtual Courtroom",
      type: "Final Hearing",
      status: "Scheduled",
      statusColor: "#22bb33",
      participants: 3,
    },
    {
      id: 2,
      caseId: "2024-52",
      caseTitle: "ABC Corp vs. XYZ Ltd",
      claimant: "ABC Corp",
      respondent: "XYZ Ltd",
      scheduledDate: "28 Sep 2025",
      scheduledTime: "2:00 PM",
      location: "District Court - Room 3",
      type: "Pre-hearing Conference",
      status: "Scheduled",
      statusColor: "#2196f3",
      participants: 4,
    },
    {
      id: 3,
      caseId: "2024-48",
      caseTitle: "Estate of Brown",
      claimant: "Brown Estate",
      respondent: "Beneficiary",
      scheduledDate: "20 Sep 2025",
      scheduledTime: "11:00 AM",
      location: "Virtual Meeting Room",
      type: "Settlement Discussion",
      status: "Pending",
      statusColor: "#ff9900",
      participants: 2,
    },
  ]);

  const styles = {
    container: {
      padding: isMobile ? "1rem" : "2rem",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#ff9900",
      color: "#fff",
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      marginBottom: isMobile ? "1rem" : "2rem",
      fontSize: "18px",
      fontWeight: "600",
      flexWrap: isMobile ? "wrap" : "nowrap",
      gap: "1rem",
    },
    addButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 1rem",
      backgroundColor: "rgba(255,255,255,0.2)",
      border: "1px solid rgba(255,255,255,0.5)",
      color: "#fff",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      transition: "all 0.3s ease",
    },
    hearingsList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    hearingCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      overflow: "hidden",
      transition: "all 0.3s ease",
    },
    hearingHeader: {
      padding: "1rem",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "1rem",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    hearingTitle: {
      flex: 1,
    },
    hearingName: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.25rem",
    },
    hearingCaseId: {
      fontSize: "13px",
      color: "#999",
    },
    hearingType: {
      fontSize: "12px",
      color: "#666",
      marginTop: "0.25rem",
    },
    statusBadge: (color) => ({
      display: "inline-block",
      padding: "0.35rem 0.75rem",
      backgroundColor: color + "22",
      color: color,
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }),
    hearingContent: {
      padding: "1rem",
    },
    partiesSection: {
      fontSize: "13px",
      color: "#666",
      marginBottom: "1rem",
      padding: "0.75rem",
      backgroundColor: "#f9f9f9",
      borderRadius: "6px",
    },
    hearingDetails: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
      gap: "1rem",
      marginBottom: "1rem",
    },
    detailItem: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "flex-start",
    },
    detailIcon: {
      color: "#ff9900",
      flexShrink: 0,
      marginTop: "0.2rem",
    },
    detailText: {
      display: "flex",
      flexDirection: "column",
    },
    detailLabel: {
      fontSize: "11px",
      color: "#999",
      fontWeight: "600",
    },
    detailValue: {
      fontSize: "13px",
      color: "#333",
      fontWeight: "500",
    },
    hearingActions: {
      padding: "1rem",
      backgroundColor: "#f9f9f9",
      borderTop: "1px solid #eee",
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
    },
    actionButton: (bgColor) => ({
      flex: 1,
      minWidth: "80px",
      padding: "0.5rem",
      backgroundColor: bgColor + "22",
      color: bgColor,
      border: "1px solid " + bgColor + "33",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.3rem",
      transition: "all 0.3s ease",
    }),
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Calendar size={24} />
          Schedule & Manage Hearings
        </span>
        <button
          style={styles.addButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
          }}
          onClick={() => {
            setOpenModal("hearing");
          }}
        >
          <Plus size={16} />
          Schedule Hearing
        </button>
      </div>

      {/* Hearings List */}
      <div style={styles.hearingsList}>
        {ScheduleHearingData.map((hearing) => (
          <div
            key={hearing.id}
            style={styles.hearingCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={styles.hearingHeader}>
              <div style={styles.hearingTitle}>
                <div style={styles.hearingName}>{hearing.caseName}</div>
                <div style={styles.hearingCaseId}>Case #{hearing.caseId}</div>
                <div style={styles.hearingType}>⚖️ {hearing.hearingType}</div>
              </div>
              <div style={styles.statusBadge(hearing.statusColor)}>
                {hearing.status}
              </div>
            </div>

            <div style={styles.hearingContent}>
              {/* Parties */}
              <div style={styles.partiesSection}>
                <strong>{hearing.caseName}</strong> vs{" "}
                <strong>{hearing.caseName}</strong>
              </div>

              {/* Details Grid */}
              <div style={styles.hearingDetails}>
                <div style={styles.detailItem}>
                  <Calendar size={16} style={styles.detailIcon} />
                  <div style={styles.detailText}>
                    <div style={styles.detailLabel}>Date</div>
                    <div style={styles.detailValue}>{hearing.date}</div>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <Clock size={16} style={styles.detailIcon} />
                  <div style={styles.detailText}>
                    <div style={styles.detailLabel}>Time</div>
                    <div style={styles.detailValue}>{hearing.time}</div>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <MapPin size={16} style={styles.detailIcon} />
                  <div style={styles.detailText}>
                    <div style={styles.detailLabel}>Location</div>
                    <div style={styles.detailValue}>{hearing.location}</div>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <Users size={16} style={styles.detailIcon} />
                  <div style={styles.detailText}>
                    <div style={styles.detailLabel}>Participants</div>
                    <div style={styles.detailValue}>
                      {hearing.participants} people
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.hearingActions}>
              <a
                href={hearing.meetLink} // <-- Your meeting link from DB
                target="_blank" // <-- Opens Google Meet in new tab
                rel="noopener noreferrer"
                style={styles.actionButton("#0066cc")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#0066cc33";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#0066cc22";
                }}
              >
                <Video size={14} />
                Join
              </a>

              <button
                style={styles.actionButton("#ff9900")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff990033";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff990022";
                }}
                onClick={() => {
                  setOpenModal("Edit");
                  setSelectedHearing(hearing);
                }}
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                style={styles.actionButton("#ff5555")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff555533";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff555522";
                }}
                onClick={() => handleDelete(hearing._id)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {openModal === "hearing" && (
        <ModalComponent title="" onClose={() => setOpenModal(null)}>
          <ScheduleHearingForm onClose={() => setOpenModal(null)} />
        </ModalComponent>
      )}
      {openModal === "Edit" && selectedHearing && (
        <ModalComponent title="" onClose={() => setOpenModal(null)}>
          <EditScheduleHearing
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

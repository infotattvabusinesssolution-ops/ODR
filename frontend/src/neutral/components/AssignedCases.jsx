import {
  MessageSquare,
  Eye,
  Download,
  Plus,
  ChevronRight,
  Calendar,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosConfig";
import ModalComponent from "../../neutral/components/Modal/ModalComponent";
import ViewCaseDetails from "../../neutral/components/Modal/ViewCaseDetails";
import Action from "./Modal/Action";
import { Loader2, RefreshCw } from "lucide-react";

export default function AssignedCases() {
  const [openModal, setOpenModal] = useState(null);
  const [assignedCases, setAssignedCases] = useState([]);
  const [selectCaseData, setSelectCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const neutralId = localStorage.getItem("userId"); // neutral login id

  const fetchAssignedCases = async () => {
    setLoading(true);
    try {
      const targetId = neutralId || "all";
      const res = await axiosInstance.get(`/admin/get-assign-cases/${targetId}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAssignedCases(res.data.data);
      } else if (Array.isArray(res.data)) {
        setAssignedCases(res.data);
      } else {
        setAssignedCases([]);
      }
    } catch (error) {
      console.error("Error fetching assigned cases:", error);
      setAssignedCases([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAssignedCases();
  }, [neutralId]);

  const [isMobile] = useState(window.innerWidth <= 480);


  const styles = {
    container: {
      padding: isMobile ? "1rem" : "2rem",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      backgroundColor: "#ff9900",
      color: "#fff",
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      marginBottom: isMobile ? "1rem" : "2rem",
      fontSize: "18px",
      fontWeight: "600",
    },
    caseGrid: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fill, minmax(350px, 1fr))",
      gap: "1.5rem",
    },
    caseCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      overflow: "hidden",
      transition: "all 0.3s ease",
      cursor: "pointer",
    },
    caseHeader: {
      padding: "1rem",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "1rem",
    },
    caseTitle: {
      flex: 1,
    },
    caseName: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.25rem",
    },
    caseId: {
      fontSize: "13px",
      color: "#999",
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
    caseContent: {
      padding: "1rem",
    },
    parties: {
      fontSize: "13px",
      color: "#666",
      marginBottom: "1rem",
      padding: "0.75rem",
      backgroundColor: "#f9f9f9",
      borderRadius: "6px",
    },
    caseMetaGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0.75rem",
      marginBottom: "1rem",
    },
    metaItem: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "flex-start",
      fontSize: "12px",
    },
    metaIcon: {
      color: "#ff9900",
      flexShrink: 0,
      marginTop: "0.2rem",
    },
    metaText: {
      display: "flex",
      flexDirection: "column",
    },
    metaLabel: {
      fontSize: "11px",
      color: "#999",
      fontWeight: "600",
    },
    metaValue: {
      fontSize: "13px",
      color: "#333",
      fontWeight: "500",
    },
    statsSection: {
      display: "flex",
      gap: "1rem",
      padding: "0.75rem",
      backgroundColor: "#f9f9f9",
      borderRadius: "6px",
      marginBottom: "1rem",
    },
    statItem: {
      flex: 1,
      textAlign: "center",
    },
    statNumber: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#0066cc",
    },
    statLabel: {
      fontSize: "11px",
      color: "#666",
    },
    actionButtons: {
      display: "flex",
      gap: "0.5rem",
    },
    actionButton: (bgColor) => ({
      flex: 1,
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
        <MessageSquare size={24} />
        <span style={{ flex: 1 }}>Assigned Cases Overview</span>
        <button
          onClick={fetchAssignedCases}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "#fff",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "12px" }}>
          <Loader2 size={36} style={{ animation: "spin 1s linear infinite", color: "#ff9900" }} />
          <p style={{ fontSize: "14px", color: "#64748b" }}>Loading assigned dispute cases...</p>
        </div>
      ) : assignedCases.length === 0 ? (
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "3rem 1.5rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <MessageSquare size={48} color="#cbd5e1" style={{ margin: "0 auto 1rem" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>No Cases Assigned Yet</h3>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 1.5rem 0" }}>
            New dispute filings assigned to your mediator profile will appear here automatically.
          </p>
          <button
            onClick={fetchAssignedCases}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff9900",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Check for Updates
          </button>
        </div>
      ) : (
        /* Cases Grid */
        <div style={styles.caseGrid}>
          {assignedCases.map((caseItem, idx) => {
            const rawDate = caseItem.createdAt;
            const formattedDate = rawDate ? (typeof rawDate === "string" && rawDate.includes("T") ? rawDate.split("T")[0] : rawDate) : "Recent";
            return (
              <div
                key={caseItem._id || caseItem.id || idx}
                style={styles.caseCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.caseHeader}>
                  <div style={styles.caseTitle}>
                    <div style={styles.caseName}>{caseItem.DisputeType || caseItem.DisputeName || "Dispute Case"}</div>
                    <div style={styles.caseId}>Case #{caseItem.caseId || caseItem._id?.slice(-6)}</div>
                  </div>
                  <div style={styles.statusBadge(
                    caseItem.status === "Verified" || caseItem.status === "Completed" ? "#22bb33" :
                    caseItem.status === "Active" ? "#2196f3" :
                    caseItem.status === "Rejected" || caseItem.status === "Closed" ? "#f44336" :
                    "#ff9900"
                  )}>
                    {caseItem.status || "Assigned"}
                  </div>
                </div>

                <div style={styles.caseContent}>
                  {/* Parties */}
                  <div style={styles.parties}>
                    <strong>{caseItem.claimant?.name || caseItem.CustomersName || caseItem.DisputeName || "Claimant"}</strong> vs{" "}
                    <strong>{caseItem.respondent?.name || caseItem.oppositePartyName || "Respondent"}</strong>
                  </div>

                  {/* Metadata Grid */}
                  <div style={styles.caseMetaGrid}>
                    <div style={styles.metaItem}>
                      <Calendar size={14} style={styles.metaIcon} />
                      <div style={styles.metaText}>
                        <div style={styles.metaLabel}>Assigned</div>
                        <div style={styles.metaValue}>{formattedDate}</div>
                      </div>
                    </div>
                    <div style={styles.metaItem}>
                      <Calendar size={14} style={styles.metaIcon} />
                      <div style={styles.metaText}>
                        <div style={styles.metaLabel}>Hearing Status</div>
                        <div style={styles.metaValue}>{caseItem.nextHearing || "Online Hearing"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div style={styles.statsSection}>
                    <div style={styles.statItem}>
                      <div style={styles.statNumber}>
                        {caseItem.submissionsReceived || 1}
                      </div>
                      <div style={styles.statLabel}>Submissions</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statNumber}>
                        {caseItem.documentsCount ?? (caseItem.file ? 1 : 0)}
                      </div>
                      <div style={styles.statLabel}>Documents</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={styles.actionButtons}>
                    <button
                      style={styles.actionButton("#0066cc")}
                      onClick={() => {
                        setOpenModal("viewDetails");
                        setSelectCaseData(caseItem);
                      }}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      style={styles.actionButton("#22bb33")}
                      onClick={() => {
                        setSelectCaseData(caseItem);
                        setOpenModal("Action");
                      }}
                    >
                      Action
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* reusable modal for viewDetails  */}
      {openModal === "viewDetails" && (
        <ModalComponent
          title=""
          onClose={() => {
            setOpenModal(null);
          }}
        >
          <ViewCaseDetails
            assignedCases={selectCaseData}
            onClose={() => {
              setOpenModal(null);
              setSelectCaseData(null);
            }}
          />
        </ModalComponent>
      )}
      {/* // reusable modal for Action */}
      {openModal === "Action" && (
        <ModalComponent
          onClose={() => {
            setOpenModal(null);
            fetchAssignedCases();
          }}
        >
          <Action
            onClose={() => {
              setOpenModal(null);
              fetchAssignedCases();
            }}
            caseId={selectCaseData?._id} // <---- FIX
          />
        </ModalComponent>
      )}
    </div>
  );
}

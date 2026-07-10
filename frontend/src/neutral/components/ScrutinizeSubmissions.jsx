import {
  CheckSquare,
  Eye,
  Download,
  MessageCircle,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";

export default function ScrutinizeSubmissions() {
  const [isMobile] = useState(window.innerWidth <= 480);
  const [filterType, setFilterType] = useState("all");
  const [submissions] = useState([
    {
      id: 1,
      caseId: "2024-45",
      caseTitle: "Smith vs. Johnson",
      submittedBy: "Claimant",
      submittedByColor: "#0066cc",
      documentName: "Case Statement",
      submittedDate: "20 Sep 2025",
      status: "Pending Review",
      statusColor: "#ff9900",
      pages: 5,
      description: "Claimant's detailed case statement with evidence",
    },
    {
      id: 2,
      caseId: "2024-45",
      caseTitle: "Smith vs. Johnson",
      submittedBy: "Respondent",
      submittedByColor: "#22bb33",
      documentName: "Counter Statement",
      submittedDate: "21 Sep 2025",
      status: "Pending Review",
      statusColor: "#ff9900",
      pages: 4,
      description: "Respondent's counter arguments",
    },
    {
      id: 3,
      caseId: "2024-52",
      caseTitle: "ABC Corp vs. XYZ Ltd",
      submittedBy: "Claimant",
      submittedByColor: "#0066cc",
      documentName: "Supporting Evidence",
      submittedDate: "18 Sep 2025",
      status: "Approved",
      statusColor: "#22bb33",
      pages: 8,
      description: "Complete evidence package",
    },
    {
      id: 4,
      caseId: "2024-52",
      caseTitle: "ABC Corp vs. XYZ Ltd",
      submittedBy: "Respondent",
      submittedByColor: "#22bb33",
      documentName: "Documents",
      submittedDate: "19 Sep 2025",
      status: "Rejected",
      statusColor: "#ff5555",
      pages: 2,
      description: "Incomplete submission - requires additional documents",
    },
  ]);

  const filteredSubmissions = filterType === "all" 
    ? submissions 
    : submissions.filter(s => s.submittedBy === filterType);

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
    filterSection: {
      display: "flex",
      gap: "0.75rem",
      marginBottom: "1.5rem",
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
      transition: "all 0.3s ease",
    }),
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
      padding: "1rem",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "1rem",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    submissionInfo: {
      flex: 1,
      minWidth: 0,
    },
    submissionTitle: {
      fontSize: "15px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.25rem",
    },
    submissionMeta: {
      fontSize: "13px",
      color: "#666",
      marginBottom: "0.25rem",
    },
    submissionParty: (color) => ({
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      backgroundColor: color + "22",
      color: color,
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
      marginRight: "0.5rem",
    }),
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
    submissionContent: {
      padding: "1rem",
    },
    submissionDescription: {
      fontSize: "13px",
      color: "#666",
      marginBottom: "0.75rem",
      lineHeight: "1.5",
    },
    submissionFooter: {
      display: "flex",
      gap: "0.5rem",
      padding: "1rem",
      backgroundColor: "#f9f9f9",
      borderTop: "1px solid #eee",
      flexWrap: "wrap",
    },
    actionButton: (bgColor) => ({
      flex: 1,
      minWidth: "80px",
      padding: "0.5rem 0.75rem",
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
        <CheckSquare size={24} />
        Scrutinize Submissions (Claimant / Respondent)
      </div>

      {/* Filter Section */}
      <div style={styles.filterSection}>
        <div style={styles.filterLabel}>
          <Filter size={16} />
          Filter:
        </div>
        <button
          style={styles.filterButton(filterType === "all")}
          onClick={() => setFilterType("all")}
          onMouseEnter={(e) => {
            if (filterType !== "all") {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }
          }}
          onMouseLeave={(e) => {
            if (filterType !== "all") {
              e.currentTarget.style.backgroundColor = "#fff";
            }
          }}
        >
          All Submissions
        </button>
        <button
          style={styles.filterButton(filterType === "Claimant")}
          onClick={() => setFilterType("Claimant")}
          onMouseEnter={(e) => {
            if (filterType !== "Claimant") {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }
          }}
          onMouseLeave={(e) => {
            if (filterType !== "Claimant") {
              e.currentTarget.style.backgroundColor = "#fff";
            }
          }}
        >
          Claimant
        </button>
        <button
          style={styles.filterButton(filterType === "Respondent")}
          onClick={() => setFilterType("Respondent")}
          onMouseEnter={(e) => {
            if (filterType !== "Respondent") {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }
          }}
          onMouseLeave={(e) => {
            if (filterType !== "Respondent") {
              e.currentTarget.style.backgroundColor = "#fff";
            }
          }}
        >
          Respondent
        </button>
      </div>

      {/* Submissions List */}
      <div style={styles.submissionsList}>
        {filteredSubmissions.map((submission) => (
          <div
            key={submission.id}
            style={styles.submissionCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={styles.submissionHeader}>
              <div style={styles.submissionInfo}>
                <div style={styles.submissionTitle}>{submission.documentName}</div>
                <div style={styles.submissionMeta}>
                  Case #{submission.caseId} - {submission.caseTitle}
                </div>
                <div>
                  <span style={styles.submissionParty(submission.submittedByColor)}>
                    {submission.submittedBy}
                  </span>
                  <span style={styles.statusBadge(submission.statusColor)}>
                    {submission.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.submissionContent}>
              <div style={styles.submissionDescription}>
                {submission.description}
              </div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                Submitted: {submission.submittedDate} • {submission.pages} pages
              </div>
            </div>

            <div style={styles.submissionFooter}>
              <button
                style={styles.actionButton("#0066cc")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#0066cc33";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#0066cc22";
                }}
              >
                <Eye size={14} />
                View
              </button>
              <button
                style={styles.actionButton("#22bb33")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#22bb3333";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#22bb3322";
                }}
              >
                <CheckCircle size={14} />
                Approve
              </button>
              <button
                style={styles.actionButton("#ff5555")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff555533";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff555522";
                }}
              >
                <AlertCircle size={14} />
                Reject
              </button>
              <button
                style={styles.actionButton("#ff9900")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff990033";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff990022";
                }}
              >
                <MessageCircle size={14} />
                Notes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

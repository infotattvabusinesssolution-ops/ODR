import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Share2,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

export default function OnlineMeeting() {
  const [hearingData, setHearingData] = useState([]);
  const [loading, setLoading] = useState(true);

  // These must be taken from respondent login
  const userEmail = localStorage.getItem("userEmail");
  // const userPhone = localStorage.getItem("userPhone");

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await axios.post(
          "http://localhost:3636/respondent/get-hearing-by-caseId",
          {
            email: userEmail,
         
          }
        );
        setHearingData(res.data.hearings);
        console.log(res.data.hearings);
      } catch (error) {
        console.log("Error fetching respondent cases:", error);
      }
    };

    fetchCases();
  }, [userEmail]);

  const [isMobile] = useState(window.innerWidth <= 480);
  const [meetings] = useState([
    {
      id: 1,
      caseId: "2024-45",
      caseTitle: "Smith vs. Johnson",
      scheduledDate: "25 Sep 2025",
      scheduledTime: "10:30 AM",
      meetingLink: "https://video.odrcourtapp.com/meeting/abc123",
      duration: "45 mins",
      participants: 4,
      status: "Scheduled",
    },
    {
      id: 2,
      caseId: "2024-52",
      caseTitle: "ABC Corp vs. XYZ Ltd",
      scheduledDate: "28 Sep 2025",
      scheduledTime: "2:00 PM",
      meetingLink: "https://video.odrcourtapp.com/meeting/xyz789",
      duration: "60 mins",
      participants: 5,
      status: "Scheduled",
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
    meetingsList: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fill, minmax(350px, 1fr))",
      gap: "1.5rem",
    },
    meetingCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      overflow: "hidden",
      transition: "all 0.3s ease",
    },
    meetingHeader: {
      padding: "1rem",
      borderBottom: "1px solid #eee",
      backgroundColor: "#f9f9f9",
    },
    meetingTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.25rem",
    },
    meetingCaseId: {
      fontSize: "13px",
      color: "#999",
    },
    meetingContent: {
      padding: "1rem",
    },
    meetingDetails: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "1rem",
      marginBottom: "1rem",
      fontSize: "14px",
    },
    detailItem: {
      display: "flex",
      flexDirection: "column",
    },
    detailLabel: {
      fontSize: "12px",
      color: "#999",
      marginBottom: "0.25rem",
      fontWeight: "600",
    },
    detailValue: {
      color: "#333",
      fontWeight: "500",
    },
    statusBadge: {
      display: "inline-block",
      padding: "0.35rem 0.75rem",
      backgroundColor: "#22bb3322",
      color: "#22bb33",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "1rem",
      width: "fit-content",
    },
    meetingLink: {
      padding: "0.75rem",
      backgroundColor: "#f5f5f5",
      borderRadius: "6px",
      marginBottom: "1rem",
      fontSize: "12px",
      color: "#0066cc",
      wordBreak: "break-all",
      border: "1px solid #eee",
    },
    actionButtons: {
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
    },
    actionButton: (bgColor) => ({
      flex: 1,
      minWidth: "100px",
      padding: "0.5rem",
      backgroundColor: bgColor + "22",
      color: bgColor,
      border: "1px solid " + bgColor + "33",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.3rem",
      transition: "all 0.3s ease",
    }),
    emptyState: {
      textAlign: "center",
      padding: "3rem 1rem",
      color: "#999",
    },
    emptyIcon: {
      fontSize: "48px",
      marginBottom: "1rem",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Video size={24} />
        Online Meeting / Hearing
      </div>

      {/* Meetings List */}
      {hearingData.length > 0 ? (
        <div style={styles.meetingsList}>
          {hearingData.map((meeting) => (
            <div
              key={meeting.id}
              style={styles.meetingCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.meetingHeader}>
                <div style={styles.meetingTitle}>{meeting.caseName}</div>
                <div style={styles.meetingCaseId}>Case #{meeting.caseId}</div>
              </div>

              <div style={styles.meetingContent}>
                <div style={styles.statusBadge}>{meeting.status}</div>

                {/* Meeting Details */}
                <div style={styles.meetingDetails}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Date</div>
                    <div style={styles.detailValue}>{meeting.date}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Time</div>
                    <div style={styles.detailValue}>
                      {meeting.time}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Duration</div>
                    <div style={styles.detailValue}>{meeting.duration}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Participants</div>
                    <div style={styles.detailValue}>
                      <Users size={14} style={{ marginRight: "0.25rem" }} />
                      {meeting.participants}
                    </div>
                  </div>
                </div>

                {/* Meeting Link */}
                <div style={styles.meetingLink}>{meeting.meetLink}</div>

                {/* Action Buttons */}
                <div style={styles.actionButtons}>
                  {meeting.status === "Scheduled" ? (
                    <a
                      className="join-hearing-btn"
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video size={18} /> Join Now
                    </a>
                  ) : (
                    <button className="join-hearing-btn disabled" disabled>
                      {meeting.status}
                    </button>
                  )}
                  <button
                    style={styles.actionButton("#22bb33")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#22bb3333";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#22bb3322";
                    }}
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📹</div>
          <p>No scheduled meetings</p>
        </div>
      )}
    </div>
  );
}

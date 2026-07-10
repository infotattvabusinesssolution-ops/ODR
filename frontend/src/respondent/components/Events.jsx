import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Plus,
  ChevronRight,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

export default function Events() {
  const [isMobile] = useState(window.innerWidth <= 480);
  const [events] = useState([
    {
      id: 1,
      title: "Hearing - Smith vs. Johnson",
      type: "Hearing",
      date: "25 Sep 2025",
      time: "10:30 AM",
      location: "Virtual Courtroom",
      caseId: "2024-45",
      description: "Final hearing for case 2024-45",
      status: "Upcoming",
      icon: "⚖️",
    },
    {
      id: 2,
      title: "Document Submission Deadline",
      type: "Deadline",
      date: "23 Sep 2025",
      time: "5:00 PM",
      location: "Online Portal",
      caseId: "2024-45",
      description: "Submit all supporting documents",
      status: "Upcoming",
      icon: "📄",
    },
    {
      id: 3,
      title: "Pre-hearing Conference",
      type: "Conference",
      date: "28 Sep 2025",
      time: "2:00 PM",
      location: "District Court - Room 3",
      caseId: "2024-52",
      description: "Conference with judge and opposing counsel",
      status: "Upcoming",
      icon: "🤝",
    },
    {
      id: 4,
      title: "Case Resolution Meeting",
      type: "Meeting",
      date: "20 Sep 2025",
      time: "11:00 AM",
      location: "Virtual Meeting Room",
      caseId: "2024-48",
      description: "Discussion on case settlement",
      status: "Completed",
      icon: "✓",
    },
  ]);

  const upcomingEvents = events.filter((e) => e.status === "Upcoming");
  const completedEvents = events.filter((e) => e.status === "Completed");

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
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#333",
      marginTop: "2rem",
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    eventsList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      marginBottom: "2rem",
    },
    eventCard: {
      display: "flex",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
      borderLeft: "4px solid #ff9900",
    },
    eventIcon: {
      fontSize: "32px",
      flexShrink: 0,
      width: "50px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    eventContent: {
      flex: 1,
    },
    eventTitle: {
      fontSize: "15px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.5rem",
    },
    eventDescription: {
      fontSize: "13px",
      color: "#666",
      marginBottom: "0.5rem",
    },
    eventMeta: {
      display: "flex",
      gap: "1rem",
      flexWrap: "wrap",
      fontSize: "12px",
      color: "#999",
    },
    metaItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.3rem",
    },
    eventActions: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
    },
    actionButton: {
      padding: "0.5rem",
      backgroundColor: "#0066cc22",
      color: "#0066cc",
      border: "1px solid #0066cc33",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
    },
    emptyState: {
      textAlign: "center",
      padding: "2rem 1rem",
      color: "#999",
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span>📅 Events & Schedule</span>
        <button
          style={styles.addButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
          }}
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {/* Upcoming Events */}
      <div>
        <div style={styles.sectionTitle}>
          <AlertCircle size={20} color="#ff9900" />
          Upcoming Events ({upcomingEvents.length})
        </div>
        {upcomingEvents.length > 0 ? (
          <div style={styles.eventsList}>
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                style={styles.eventCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.eventIcon}>{event.icon}</div>
                <div style={styles.eventContent}>
                  <div style={styles.eventTitle}>{event.title}</div>
                  <div style={styles.eventDescription}>{event.description}</div>
                  <div style={styles.eventMeta}>
                    <div style={styles.metaItem}>
                      <Calendar size={12} />
                      {event.date}
                    </div>
                    <div style={styles.metaItem}>
                      <Clock size={12} />
                      {event.time}
                    </div>
                    <div style={styles.metaItem}>
                      <MapPin size={12} />
                      {event.location}
                    </div>
                    <div style={styles.metaItem}>Case #{event.caseId}</div>
                  </div>
                </div>
                <div style={styles.eventActions}>
                  <button
                    style={styles.actionButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#0066cc33";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#0066cc22";
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>No upcoming events</div>
        )}
      </div>

      {/* Completed Events */}
      <div>
        <div style={styles.sectionTitle}>Completed Events ({completedEvents.length})</div>
        {completedEvents.length > 0 ? (
          <div style={styles.eventsList}>
            {completedEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  ...styles.eventCard,
                  borderLeft: "4px solid #22bb33",
                  opacity: 0.7,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.eventIcon}>{event.icon}</div>
                <div style={styles.eventContent}>
                  <div style={styles.eventTitle}>{event.title}</div>
                  <div style={styles.eventDescription}>{event.description}</div>
                  <div style={styles.eventMeta}>
                    <div style={styles.metaItem}>
                      <Calendar size={12} />
                      {event.date}
                    </div>
                    <div style={styles.metaItem}>
                      <Clock size={12} />
                      {event.time}
                    </div>
                    <div style={styles.metaItem}>
                      <MapPin size={12} />
                      {event.location}
                    </div>
                    <div style={styles.metaItem}>Case #{event.caseId}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>No completed events</div>
        )}
      </div>
    </div>
  );
}

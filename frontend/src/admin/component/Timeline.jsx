import { Clock, FileText, Users, AlertCircle, CheckCircle, Edit, Trash2, Search, Filter, Calendar, MapPin, Eye, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosConfig";

export default function Timeline() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimelineEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/admin/timeline-events");
      if (response.data?.success) {
        // Map icon components dynamically based on event types
        const mappedData = response.data.data.map(item => {
          let icon = FileText;
          if (item.type === "document_verified") icon = CheckCircle;
          if (item.type === "hearing_scheduled") icon = Calendar;
          return {
            ...item,
            icon
          };
        });
        setEvents(mappedData);
      }
    } catch (err) {
      console.error("Fetch timeline failed:", err);
      setError("Failed to fetch case timeline logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineEvents();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";
    const eventSource = new EventSource(`${API_BASE_URL}/admin/timeline-events/stream`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.connected) return;

        // Map icons dynamically
        let icon = FileText;
        if (parsed.type === "document_verified") icon = CheckCircle;
        if (parsed.type === "hearing_scheduled") icon = Calendar;

        const newEventObj = {
          ...parsed,
          icon
        };

        // Update events state
        setEvents((prevEvents) => {
          if (prevEvents.some(e => e.id === newEventObj.id)) return prevEvents;
          return [newEventObj, ...prevEvents];
        });
      } catch (err) {
        console.error("Error parsing stream event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("Real-time event source disconnected. Retrying...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const getStatusBadge = (status) => {
    return status === "completed"
      ? { bg: "#e8f5e9", text: "#2e7d32", label: "✓ Completed" }
      : { bg: "#fff3e0", text: "#f57c00", label: "⏳ Pending" };
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.caseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.actor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || event.type === filterType;

    return matchesSearch && matchesType;
  });

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Event ID,Type,Title,Description,Case,Actor,Date,Status"].join(",") + "\n"
      + sortedEvents.map(e => `"${e.id}","${e.type}","${e.title}","${e.description}","${e.caseName}","${e.actor}","${e.date}","${e.status}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ODR_Timeline_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      backgroundColor: "#ff5722",
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
    exportButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.25rem",
      backgroundColor: "#fff",
      color: "#ff5722",
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
      backgroundColor: isActive ? "#ff5722" : "#fff",
      color: isActive ? "#fff" : "#666",
      border: `1px solid ${isActive ? "#ff5722" : "#ddd"}`,
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
    timelineContainer: {
      position: "relative",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
      gap: "2rem",
    },
    timelineItem: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      position: "relative",
    },
    timelineMarker: (color) => ({
      width: "50px",
      height: "50px",
      backgroundColor: color + "22",
      border: `2px solid ${color}`,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: color,
      flexShrink: 0,
      position: "relative",
      zIndex: 2,
    }),
    timelineContent: {
      flex: 1,
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "1.5rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      transition: "all 0.2s ease",
    },
    timelineHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: "0.75rem",
      flexWrap: "wrap",
      gap: "0.5rem",
    },
    timelineTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "0.25rem",
    },
    timelineDescription: {
      fontSize: "13px",
      color: "#666",
      marginBottom: "0.75rem",
      lineHeight: "1.5",
    },
    timelineMetadata: {
      display: "flex",
      gap: "1rem",
      fontSize: "12px",
      color: "#999",
      flexWrap: "wrap",
    },
    metadataItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.35rem",
    },
    statusBadge: (status) => {
      const colors = getStatusBadge(status);
      return {
        display: "inline-block",
        padding: "0.35rem 0.75rem",
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "600",
        whiteSpace: "nowrap",
      };
    },
    emptyState: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "3rem 1rem",
      textAlign: "center",
      color: "#666",
      width: "100%"
    },
    emptyIcon: {
      fontSize: "48px",
      marginBottom: "1rem",
      opacity: 0.5,
    },
    loadingContainer: {
      textAlign: "center",
      padding: "4rem 2rem",
      color: "#999",
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          📅 Timeline / Events
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            style={{ ...styles.exportButton, backgroundColor: "transparent", color: "#fff", border: "1px solid #fff" }}
            onClick={fetchTimelineEvents}
          >
            <RefreshCw size={16} />
            Sync Logs
          </button>
          <button
            style={styles.exportButton}
            onClick={handleExport}
            disabled={sortedEvents.length === 0}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#ff5722")}>
          <div style={styles.statValue}>{loading ? "..." : events.length}</div>
          <div style={styles.statLabel}>Total Events</div>
        </div>
        <div style={styles.statCard("#4caf50")}>
          <div style={styles.statValue}>
            {loading ? "..." : events.filter((e) => e.status === "completed").length}
          </div>
          <div style={styles.statLabel}>Completed</div>
        </div>
        <div style={styles.statCard("#ff9800")}>
          <div style={styles.statValue}>
            {loading ? "..." : events.filter((e) => e.status === "pending").length}
          </div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard("#2196f3")}>
          <div style={styles.statValue}>
            {loading ? "..." : new Set(events.map((e) => e.caseId)).size}
          </div>
          <div style={styles.statLabel}>Cases Involved</div>
        </div>
      </div>

      {/* Controls Section */}
      <div style={styles.controlsSection}>
        <div style={styles.searchBox}>
          <Search size={18} color="#999" />
          <input
            type="text"
            placeholder="Search by title, description, actor, or case name..."
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
            style={styles.filterButton(filterType === "all")}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button
            style={styles.filterButton(filterType === "case_filed")}
            onClick={() => setFilterType("case_filed")}
          >
            Cases
          </button>
          <button
            style={styles.filterButton(filterType === "document_uploaded")}
            onClick={() => setFilterType("document_uploaded")}
          >
            Documents
          </button>
          <button
            style={styles.filterButton(filterType === "hearing_scheduled")}
            onClick={() => setFilterType("hearing_scheduled")}
          >
            Hearings
          </button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#ff5722" }} />
          <p style={{ marginTop: "1rem" }}>Compiling timeline events sequence...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={{ ...styles.loadingContainer, color: "#f44336" }}>
          <p>⚠️ {error}</p>
          <button style={styles.exportButton} onClick={fetchTimelineEvents}>Retry</button>
        </div>
      ) : sortedEvents.length > 0 ? (
        <div style={styles.timelineContainer}>
          {sortedEvents.map((event) => {
            const IconComponent = event.icon;
            const statusColors = getStatusBadge(event.status);

            return (
              <div key={event.id} style={styles.timelineItem}>
                {/* Content */}
                <div
                  style={styles.timelineContent}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.12)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={styles.timelineHeader}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: event.color + "15",
                        color: event.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <IconComponent size={18} />
                      </div>
                      <div>
                        <div style={styles.timelineTitle}>{event.title}</div>
                        <div style={styles.timelineDescription}>
                          {event.description}
                        </div>
                      </div>
                    </div>
                    <span
                      style={styles.statusBadge(event.status)}
                    >
                      {statusColors.label}
                    </span>
                  </div>

                  <div style={styles.timelineMetadata}>
                    <div style={styles.metadataItem}>
                      <Calendar size={14} />
                      {event.date}
                    </div>
                    <div style={styles.metadataItem}>
                      <Clock size={14} />
                      {event.time}
                    </div>
                    <div style={styles.metadataItem}>
                      <Users size={14} />
                      <strong>By:</strong> {event.actor}
                    </div>
                    <div style={styles.metadataItem}>
                      <FileText size={14} />
                      <strong>Case:</strong> {event.caseName} ({event.caseId})
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📅</div>
          <div>No events found matching your search criteria</div>
        </div>
      )}
    </div>
  );
}

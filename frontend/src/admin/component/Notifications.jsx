import { Bell, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [ isMobile ] = useState(window.innerWidth < 480);

  const notifications = [
    {
      id: 1,
      type: "case",
      title: "New Case Assigned",
      description: "Case #1023 has been assigned to you",
      timeAgo: "5m ago",
      icon: "📋",
      color: "#0066cc",
      category: "All",
    },
    {
      id: 2,
      type: "update",
      title: "System Update",
      description: "The hearing module was upgraded.",
      timeAgo: "2h ago",
      icon: "📦",
      color: "#22bb33",
      category: "Update",
    },
    {
      id: 3,
      type: "alert",
      title: "Payment Alert",
      description: "Respondent has completed the payment for Case #1001.",
      timeAgo: "1d ago",
      icon: "⚠️",
      color: "#ff5555",
      category: "Alert",
    },
    {
      id: 4,
      type: "alert",
      title: "Payment Alert",
      description: "Respondent has completed the payment for Case #1001.",
      timeAgo: "1d ago",
      icon: "⚠️",
      color: "#ff5555",
      category: "Alert",
    },
    {
      id: 5,
      type: "update",
      title: "Old Notification",
      description: "This is from last week.",
      timeAgo: "6d ago",
      icon: "📦",
      color: "#22bb33",
      category: "Update",
    },
  ];

  const filters = ["All", "Alert", "Case", "Update"];

  const filteredNotifications =
    activeFilter === "All"
      ? notifications
      : notifications.filter((n) => n.category === activeFilter);

  const groupNotifications = (notifs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    notifs.forEach((notif) => {
      if (notif.timeAgo.includes("m ago") || notif.timeAgo.includes("h ago")) {
        groups.Today.push(notif);
      } else if (notif.timeAgo.includes("1d ago")) {
        groups.Yesterday.push(notif);
      } else {
        groups.Earlier.push(notif);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotifications(filteredNotifications);

  const styles = {
    container: {
      padding: "clamp(1rem, 5vw, 2rem)",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: isMobile ? "center" : "flex-start",
      alignItems: "center",
      gap: "0.75rem",
      backgroundColor: "#ff9900",
      color: "#fff",
      padding: "clamp(1rem, 3vw, 1.5rem)",
      borderRadius: "8px",
      marginBottom: "1.5rem",
      fontSize: "clamp(16px, 4vw, 20px)",
      fontWeight: "600",
    },
    filterContainer: {
      display: "flex",
      gap: "1rem",
      marginBottom: "1.5rem",
      flexWrap: "wrap",
    },
    filterButton: (isActive) => ({
      padding: "0.5rem 1rem",
      border: isActive ? "none" : "1px solid #ddd",
      borderRadius: "6px",
      backgroundColor: isActive ? "#ff9900" : "#fff",
      color: isActive ? "#fff" : "#333",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: isActive ? "600" : "500",
      transition: "all 0.3s ease",
      whiteSpace: "nowrap",
    }),
    groupTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
      marginTop: "1.5rem",
      marginBottom: "1rem",
    },
    notificationCard: {
      display: "flex",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: "#fff",
      borderRadius: "8px",
      marginBottom: "1rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
      cursor: "pointer",
      alignItems: "flex-start",
    },
    notificationIcon: {
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      flexShrink: 0,
      color: "#fff",
    },
    notificationContent: {
      flex: 1,
      minWidth: 0,
    },
    notificationTitle: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "0.25rem",
    },
    notificationDescription: {
      fontSize: "13px",
      color: "#666",
      lineHeight: "1.4",
      wordWrap: "break-word",
    },
    notificationTime: {
      fontSize: "12px",
      color: "#999",
      fontWeight: "500",
      marginTop: "0.5rem",
      whiteSpace: "nowrap",
    },
    emptyState: {
      textAlign: "center",
      padding: "3rem 1rem",
      color: "#999",
      backgroundColor: "#fff",
      borderRadius: "8px",
      marginTop: "2rem",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Bell size={22} />
        Notifications
      </div>

      {/* Filter Buttons */}
      <div style={styles.filterContainer}>
        {filters.map((filter) => (
          <button
            key={filter}
            style={styles.filterButton(activeFilter === filter)}
            onClick={() => setActiveFilter(filter)}
            onMouseEnter={(e) => {
              if (activeFilter !== filter) {
                e.currentTarget.style.backgroundColor = "#f0f0f0";
              }
            }}
            onMouseLeave={(e) => {
              if (activeFilter !== filter) {
                e.currentTarget.style.backgroundColor = "#fff";
              }
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {Object.entries(groupedNotifications).map(([groupName, notifs]) =>
        notifs.length > 0 ? (
          <div key={groupName}>
            <div style={styles.groupTitle}>{groupName}</div>
            {notifs.map((notification) => (
              <div
                key={notification.id}
                style={styles.notificationCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    ...styles.notificationIcon,
                    backgroundColor: notification.color,
                  }}
                >
                  {notification.icon}
                </div>
                <div style={styles.notificationContent}>
                  <div style={styles.notificationTitle}>
                    {notification.title}
                  </div>
                  <div style={styles.notificationDescription}>
                    {notification.description}
                  </div>
                </div>
                <div style={styles.notificationTime}>
                  {notification.timeAgo}
                </div>
              </div>
            ))}
          </div>
        ) : null
      )}

      {filteredNotifications.length === 0 && (
        <div style={styles.emptyState}>
          <Bell size={48} style={{ marginBottom: "1rem", opacity: 0.3, display: "block", margin: "0 auto 1rem" }} />
          <p>No notifications found</p>
        </div>
      )}
    </div>
  );
}

import { Bell, X, CheckCircle, AlertCircle, Info, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosConfig";

const resolveMeetLink = (link, caseId) => {
  const defaultLink = `/chamber/${caseId || "CASE-2026-0021"}`;
  if (!link) return defaultLink;

  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalhost && (link.includes("utkalodr.com") || link.includes("gokulanandachaudhurifoundation.com"))) {
      try {
        const parsed = new URL(link);
        return `${window.location.origin}${parsed.pathname}${parsed.search}`;
      } catch (e) {
        return link;
      }
    }
  }
  return link;
};

const parseNotificationDetails = (notification) => {
  if (!notification) {
    return {
      title: "Notification",
      caseId: "",
      message: "No details available.",
      type: "info",
      badge: "Info",
      link: null,
    };
  }

  // 1. Hearing notification
  if (notification.HearingMessage) {
    const hm = notification.HearingMessage;
    const hearingType = hm.hearingType || "Mediation Session";
    const caseId = hm.caseId || "";
    const caseName = hm.caseName || "";
    const time = hm.time ? ` at ${hm.time}` : "";
    const loc = hm.location ? ` • Location: ${hm.location}` : "";
    const rawLink = hm.meetLink || null;
    const link = resolveMeetLink(rawLink, caseId);

    return {
      title: `Hearing Scheduled: ${hearingType}`,
      caseId: caseId,
      message: `Hearing scheduled for ${caseName || caseId || "Dispute Case"}${time}${loc}`,
      type: "hearing",
      badge: hearingType,
      link: link,
    };
  }

  // 2. Document / Evidence upload
  if (notification.CaseMessage?.documentName) {
    const cm = notification.CaseMessage;
    return {
      title: cm.title || "New Evidence Uploaded",
      caseId: cm.caseId || "",
      message: `A new document "${cm.documentName}" was submitted by ${cm.uploadedBy || "a party"} for ${cm.caseName || cm.caseId || "the case"}.`,
      type: "evidence",
      badge: "New Evidence",
      link: cm.fileUrl || null,
    };
  }

  // 3. Case Assignment
  if (notification.CaseMessage?.assignedNeutral || notification.type === "assignment-summary") {
    const cm = notification.CaseMessage || {};
    return {
      title: cm.title ? `Case Assignment: ${cm.title}` : "New Dispute Case Assigned",
      caseId: cm.caseId || "",
      message: `Case update for ${cm.caseId ? cm.caseId + " - " : ""}${cm.title || "Dispute Case"} (${cm.disputeType || "Mediation"}).`,
      type: "assignment",
      badge: cm.disputeType || "Assignment",
      link: null,
    };
  }

  // 4. Other CaseMessage
  if (notification.CaseMessage) {
    const cm = notification.CaseMessage;
    const title = cm.title || "Case Notification";
    const caseId = cm.caseId || "";
    const msg = typeof cm === "string" ? cm : (cm.message || cm.title || JSON.stringify(cm));
    return {
      title: title,
      caseId: caseId,
      message: msg,
      type: "update",
      badge: "Case Update",
      link: null,
    };
  }

  // 5. Generic message
  if (notification.message) {
    return {
      title: notification.title || "Notification",
      caseId: notification.caseId || "",
      message: notification.message,
      type: notification.type || "info",
      badge: notification.type || "Update",
      link: null,
    };
  }

  // 6. Fallback (email/whatsapp delivery status)
  const channel = (notification.type || "System").toUpperCase();
  const target = notification.respondentEmail || notification.claimantEmail || "";
  return {
    title: `${channel} Alert (${notification.status || "sent"})`,
    caseId: "",
    message: notification.error || `Notification successfully dispatched to ${target || "you"}.`,
    type: notification.type || "info",
    badge: channel,
    link: null,
  };
};

export default function Notifications() {
  const [notificationData, setNotificationData] = useState([]);
  const userEmail = localStorage.getItem("userEmail");
  const [refreshTime, setRefreshTime] = useState(Date.now());

  useEffect(() => {
    const getNotification = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";
        const response = await axios.post(
          `${API_BASE_URL}/respondent/get-notification`,
          { email: userEmail }
        );

        let data = response.data.data;

        // Get deleted IDs from localStorage
        const deletedIds =
          JSON.parse(localStorage.getItem("deletedNotifications")) || [];

        // Filter out notifications deleted by claimant/respondent
        data = data.filter((n) => !deletedIds.includes(n._id));

        setNotificationData(data);
        console.log("Filtered notifications:", data);
      } catch (err) {
        console.log(err);
      }
    };
    getNotification();
  }, []);

  // for Save notification with timestamp (time ago)
  const getTimeAgo = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - new Date(date)) / 1000);

    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(Date.now()); // Force component re-render
    }, 30000); // ⏳ updates every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // delete for one by one Notification
  const deleteNotification = async (id) => {
    try {
      // For claimant/respondent -> delete only frontend
      // Save deleted ID in localStorage
      const deleted =
        JSON.parse(localStorage.getItem("deletedNotifications")) || [];
      deleted.push(id);
      localStorage.setItem("deletedNotifications", JSON.stringify(deleted));

      // Remove instantly from UI
      setNotificationData((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // delete for all notification
  const deleteAllNotifications = () => {
    try {
      // Save all current notification IDs to localStorage
      const deletedIds =
        JSON.parse(localStorage.getItem("deletedNotifications")) || [];

      const currentIds = notificationData.map((n) => n._id);

      const updatedDeletedIds = [...deletedIds, ...currentIds];

      localStorage.setItem(
        "deletedNotifications",
        JSON.stringify(updatedDeletedIds)
      );

      // instantly clear UI
      setNotificationData([]);

      console.log("All notifications removed from UI");
    } catch (error) {
      console.log("Delete All error:", error);
    }
  };

  const [isMobile] = useState(window.innerWidth <= 480);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "update",
      title: "Case Update",
      message: "Your case #2024-45 has been updated with new submissions.",
      timestamp: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      type: "alert",
      title: "Hearing Alert",
      message: "Your hearing is scheduled for 25 Sep 2025 at 10:30 AM",
      timestamp: "1 day ago",
      read: false,
    },
    {
      id: 3,
      type: "info",
      title: "Assignment",
      message: "You have been assigned to case #2024-52",
      timestamp: "3 days ago",
      read: true,
    },
    {
      id: 4,
      type: "update",
      title: "Document Received",
      message: "New document received for case #2024-48",
      timestamp: "1 week ago",
      read: true,
    },
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "alert":
        return <AlertCircle size={24} color="#ff6b6b" />;
      case "update":
        return <CheckCircle size={24} color="#22bb33" />;
      case "info":
        return <Info size={24} color="#2196f3" />;
      default:
        return <Bell size={24} color="#ff9900" />;
    }
  };

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
    },
    clearButton: {
      padding: "0.5rem 1rem",
      backgroundColor: "rgba(255,255,255,0.2)",
      border: "1px solid rgba(255,255,255,0.5)",
      color: "#fff",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.3s ease",
    },
    notificationCard: (isRead) => ({
      display: "flex",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: isRead ? "#fff" : "#fffbf5",
      borderRadius: "8px",
      marginBottom: "0.75rem",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      borderLeft: `4px solid ${isRead ? "#ddd" : "#ff9900"}`,
      transition: "all 0.3s ease",
    }),
    iconContainer: {
      width: "50px",
      height: "50px",
      borderRadius: "8px",
      backgroundColor: "rgba(255,153,0,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: (isRead) => ({
      fontSize: "15px",
      fontWeight: isRead ? "500" : "600",
      color: "#333",
      marginBottom: "0.25rem",
    }),
    notificationMessage: {
      fontSize: "14px",
      color: "#666",
      marginBottom: "0.5rem",
    },
    notificationTime: {
      fontSize: "12px",
      color: "#999",
    },
    deleteButton: {
      backgroundColor: "transparent",
      border: "none",
      color: "#999",
      cursor: "pointer",
      padding: "0.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
      flexShrink: 0,
    },
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
        <span>🔔 Notifications</span>
        <button
          style={styles.clearButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
          }}
          onClick={() => deleteAllNotifications(userEmail)}
        >
          Clear All
        </button>
      </div>

      {/* Notifications List */}
      {notificationData.length > 0 ? (
        <div>
          {notificationData.map((notification) => (
            <div
              key={notification.id}
              style={styles.notificationCard(notification.read)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.iconContainer}>
                {getNotificationIcon(notification.type)}
              </div>
              <div style={styles.notificationContent}>
                <div style={styles.notificationTitle(notification.read)}>
                  Case Assignment
                </div>
                <div style={styles.notificationMessage}>
                  {`You have been assigned to ${notification.CaseMessage.caseId}, ${notification.CaseMessage.title}`}
                </div>
                <div style={styles.notificationTime}>
                  {getTimeAgo(notification.createdAt)}
                </div>
              </div>
              <button
                style={styles.deleteButton}
                onClick={() => deleteNotification(notification._id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ff5555";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#999";
                }}
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <p>No notifications yet</p>
        </div>
      )}
    </div>
  );
}

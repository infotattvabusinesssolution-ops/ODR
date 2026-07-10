import {
  Bell,
  Moon,
  Zap,
  Mail,
  Phone,
  Globe,
  MessageCircle,
  Wrench,
  Palette,
} from "lucide-react";

export default function AdminControls() {
  const preferenceItems = [
    {
      id: "supp-1",
      icon: Wrench,
      title: "Maintenence Mode",
      description: "support@odrcourtapp.com",
      color: "#2196f3",
    },
    {
      id: "supp-2",
      icon: Palette,
      title: "Theme Setting",
      description: "+91 9876543210",
      color: "#2196f3",
    },
  ];

  const management = [
    {
      id: "supp-1",
      icon: Mail,
      title: "User Management",
      description: "support@odrcourtapp.com",
      color: "#2196f3",
    },
    {
      id: "supp-2",
      icon: Phone,
      title: "Cases Management",
      description: "+91 9876543210",
      color: "#2196f3",
    },
    {
      id: "supp-3",
      icon: Globe,
      title: "Document Management",
      description: "www.odrcourtapp.com/help",
      color: "#2196f3",
    },
  ];

  const communication = [
    {
      id: "supp-1",
      icon: Mail,
      title: "Send Notifications",
      description: "support@odrcourtapp.com",
      color: "#2196f3",
    },
    {
      id: "supp-2",
      icon: Phone,
      title: "Report & Analytics",
      description: "+91 9876543210",
      color: "#2196f3",
    },
  ];

  const styles = {
    container: {
      padding: "clamp(1rem, 5vw, 2rem)",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    headerTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "2rem",
      paddingLeft: "0.5rem",
    },
    manageSectionTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#999",
      margin: "0",
      paddingLeft: "0.5rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#999",
      marginBottom: "1rem",
      marginTop: "2rem",
      paddingLeft: "0.5rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    preferencesContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      marginBottom: "2rem",
    },
    preferenceItem: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "1.25rem 1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      border: "1px solid #f0f0f0",
      transition: "all 0.2s ease",
    },
    preferenceItemHover: {
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    },
    iconContainer: (color) => ({
      width: "50px",
      height: "50px",
      backgroundColor: `${color}15`,
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }),
    preferenceContent: {
      flex: 1,
    },
    preferenceName: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333",
    },
    toggleContainer: {
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
    },
    toggleButton: (isActive) => ({
      width: "50px",
      height: "28px",
      borderRadius: "14px",
      backgroundColor: isActive ? "#ff9800" : "#ddd",
      border: "none",
      cursor: "pointer",
      position: "relative",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      padding: "0 3px",
      boxShadow: isActive ? "0 2px 6px rgba(255,152,0,0.3)" : "none",
    }),
    toggleDot: (isActive) => ({
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      transition: "transform 0.3s ease",
      transform: isActive ? "translateX(22px)" : "translateX(0)",
    }),
    manageSupportContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      marginTop: '1rem',
    },
    supportContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    supportItem: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "1.25rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      border: "1px solid #f0f0f0",
      transition: "all 0.2s ease",
      cursor: "pointer",
    },
    supportItemHover: {
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    },
    supportContent: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      flex: 1,
    },
    supportText: {
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
    },
    supportTitle: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333",
    },
    supportDescription: {
      fontSize: "13px",
      color: "#999",
    },
    chevron: {
      color: "#ddd",
      flexShrink: 0,
    },
  };

  return (
    <div style={styles.container}>
      {/* System Settings */}
      <h2 style={styles.manageSectionTitle}>System Settings</h2>

      <div style={styles.manageSupportContainer}>
        {preferenceItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              style={styles.supportItem}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, styles.supportItemHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={styles.supportContent}>
                <div style={styles.iconContainer(item.color)}>
                  <IconComponent size={28} color={item.color} />
                </div>
                <div style={styles.supportText}>
                  <div style={styles.supportTitle}>{item.title}</div>
                  <div style={styles.supportDescription}>
                    {item.description}
                  </div>
                </div>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={styles.chevron}
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          );
        })}
      </div>

      {/* Management */}
      <h2 style={styles.sectionTitle}>Management</h2>

      <div style={styles.supportContainer}>
        {management.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              style={styles.supportItem}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, styles.supportItemHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={styles.supportContent}>
                <div style={styles.iconContainer(item.color)}>
                  <IconComponent size={28} color={item.color} />
                </div>
                <div style={styles.supportText}>
                  <div style={styles.supportTitle}>{item.title}</div>
                  <div style={styles.supportDescription}>
                    {item.description}
                  </div>
                </div>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={styles.chevron}
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          );
        })}
      </div>

      {/* Communication */}
      <h2 style={styles.sectionTitle}>Communication</h2>

      <div style={styles.supportContainer}>
        {communication.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              style={styles.supportItem}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, styles.supportItemHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={styles.supportContent}>
                <div style={styles.iconContainer(item.color)}>
                  <IconComponent size={28} color={item.color} />
                </div>
                <div style={styles.supportText}>
                  <div style={styles.supportTitle}>{item.title}</div>
                  <div style={styles.supportDescription}>
                    {item.description}
                  </div>
                </div>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={styles.chevron}
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import {
  Lock,
  Globe,
  Shield,
  CreditCard,
  Bell,
  Moon,
  Zap,
  ChevronRight,
  Edit2,
  Mail,
  Phone,
  MessagesSquare,
  User,
} from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [isMobile] = useState(window.innerWidth <= 480);

  const accountSettings = [
    { id: 1, icon: Lock, label: "Change Password", color: "#0066cc" },
    { id: 2, icon: Globe, label: "Language (English)", color: "#2196f3" },
    { id: 3, icon: Shield, label: "Privacy Settings", color: "#1976d2" },
    {
      id: 4,
      icon: CreditCard,
      label: "Manage Subscriptions",
      color: "#1565c0",
    },
  ];

  const preferences = [
    {
      id: 1,
      icon: Bell,
      label: "Enable Notifications",
      toggle: enableNotifications,
      setToggle: setEnableNotifications,
      color: "#ff9900",
    },
    {
      id: 2,
      icon: Moon,
      label: "Dark Mode",
      toggle: darkMode,
      setToggle: setDarkMode,
      color: "#9c27b0",
    },
    {
      id: 3,
      icon: Zap,
      label: "Data Saver",
      toggle: dataSaver,
      setToggle: setDataSaver,
      color: "#673ab7",
    },
  ];

  const helpOptions = [
    {
      id: 1,
      icon: Mail,
      label: "Email Us",
      desc: "support@odrcourtapp.com",
      color: "#0066cc",
    },
    {
      id: 2,
      icon: Phone,
      label: "Call Us",
      desc: "+91 9876543210",
      color: "#0066cc",
    },
    {
      id: 3,
      icon: Globe,
      label: "Visit Website",
      desc: "www.odrcourtapp.com/help",
      color: "#0066cc",
    },
    {
      id: 4,
      icon: MessagesSquare,
      label: "FAQs",
      desc: "Find answers to common questions",
      color: "#0066cc",
    },
  ];

  const styles = {
    container: {
      padding: isMobile ? "1rem" : "2rem",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      justifyContent: isMobile ? "center" : "flex-start",
      alignItems: "center",
      gap: isMobile ? "1rem" : "0.75rem",
      backgroundColor: "#ff9900",
      color: "#fff",
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      marginBottom: isMobile ? "1rem" : "2rem",
      fontSize: "18px",
      fontWeight: "600",
    },
    profileCard: {
      background: "linear-gradient(135deg, #0066cc 0%, #ff9900 100%)",
      color: "#fff",
      padding: isMobile ? "1rem" : "2rem",
      borderRadius: "12px",
      marginBottom: "2rem",
      textAlign: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
    profileAvatar: {
      width: isMobile ? "70px" : "100px",
      height: isMobile ? "70px" : "100px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 1rem",
      fontSize: "50px",
      color: "#0066cc",
    },
    profileName: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "0.5rem",
    },
    profileRole: {
      fontSize: "14px",
      opacity: 0.9,
      marginBottom: "0.25rem",
    },
    profileEmail: {
      fontSize: "14px",
      opacity: 0.8,
      marginBottom: "1rem",
    },
    editButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.625rem 1rem",
      backgroundColor: "#fff",
      color: "#0066cc",
      border: "none",
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
    },
    settingItem: (bgColor) => ({
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: "#fff",
      borderRadius: "8px",
      marginBottom: "0.75rem",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      borderLeft: `4px solid ${bgColor}22`,
    }),
    settingIcon: (bgColor) => ({
      width: "45px",
      height: "45px",
      borderRadius: "8px",
      backgroundColor: bgColor + "22",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: bgColor,
      flexShrink: 0,
    }),
    settingContent: {
      flex: 1,
    },
    settingLabel: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333",
    },
    settingDescription: {
      fontSize: "13px",
      color: "#999",
      marginTop: "0.25rem",
    },
    toggleSwitch: (isActive) => ({
      width: "50px",
      height: "28px",
      borderRadius: "14px",
      backgroundColor: isActive ? "#ff9900" : "#ddd",
      border: "none",
      cursor: "pointer",
      position: "relative",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      padding: "0 3px",
    }),
    toggleDot: (isActive) => ({
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      transition: "transform 0.3s ease",
      transform: isActive ? "translateX(22px)" : "translateX(0)",
    }),
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>☰ Profile & Settings</div>

      {/* Profile Card */}
      <div style={styles.profileCard}>
        <div style={styles.profileAvatar}>
          <User size={isMobile ? 40 : 60} strokeWidth={2.2} />
        </div>
        <div style={styles.profileName}>User</div>
        <div style={styles.profileRole}>respondent</div>
        <div style={styles.profileEmail}>respondent@email.com</div>
        <button
          style={styles.editButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0f0f0";
            e.currentTarget.style.color = "#0066cc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fff";
            e.currentTarget.style.color = "#0066cc";
          }}
        >
          <Edit2 size={16} />
          Edit Profile
        </button>
      </div>

      {/* Account Section */}
      <div>
        <div style={styles.sectionTitle}>Account</div>
        {accountSettings.map((setting) => {
          const IconComponent = setting.icon;
          return (
            <div
              key={setting.id}
              style={styles.settingItem(setting.color)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.settingIcon(setting.color)}>
                <IconComponent size={22} />
              </div>
              <div style={styles.settingContent}>
                <div style={styles.settingLabel}>{setting.label}</div>
              </div>
              <ChevronRight size={20} color="#999" />
            </div>
          );
        })}
      </div>

      {/* Preferences Section */}
      <div>
        <div style={styles.sectionTitle}>Preferences</div>
        {preferences.map((pref) => {
          const IconComponent = pref.icon;
          return (
            <div
              key={pref.id}
              style={styles.settingItem(pref.color)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.settingIcon(pref.color)}>
                <IconComponent size={22} />
              </div>
              <div style={styles.settingContent}>
                <div style={styles.settingLabel}>{pref.label}</div>
              </div>
              <button
                style={styles.toggleSwitch(pref.toggle)}
                onClick={() => pref.setToggle(!pref.toggle)}
              >
                <div style={styles.toggleDot(pref.toggle)} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Help and Support */}
      <div>
        <div style={styles.sectionTitle}>Help and Support</div>
        {helpOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <div
              key={option.id}
              style={styles.settingItem(option.color)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.settingIcon(option.color)}>
                <IconComponent size={22} />
              </div>
              <div style={styles.settingContent}>
                <div style={styles.settingLabel}>{option.label}</div>
                <div style={styles.settingLabel}>{option.desc}</div>
              </div>
              <ChevronRight size={20} color="#999" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

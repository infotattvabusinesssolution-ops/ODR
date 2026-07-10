import { Settings, Bell, Lock, Save } from "lucide-react";
import { useState } from "react";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    applicationName: "ODR Court App",
    appVersion: "1.0.0",
    maintenanceMode: false,
    emailNotifications: true,
    pushNotifications: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleToggle = (field) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log("Settings saved:", settings);
    setHasChanges(false);
    alert("Settings saved successfully!");
  };

  const styles = {
    container: {
      padding: "clamp(1rem, 5vw, 2rem)",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
      maxWidth: "1000px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      backgroundColor: "#ff9800",
      color: "#fff",
      padding: "clamp(1rem, 3vw, 1.5rem)",
      borderRadius: "8px",
      marginBottom: "2rem",
      flexWrap: "wrap",
    },
    headerTitle: {
      fontSize: "clamp(20px, 5vw, 24px)",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    settingsSection: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "clamp(1.5rem, 3vw, 2rem)",
      marginBottom: "1.5rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#7c3aed",
      marginBottom: "1.5rem",
      paddingBottom: "1rem",
      borderBottom: "2px solid #f0f0f0",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    settingItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1.25rem 0",
      borderBottom: "1px solid #f0f0f0",
      gap: "1rem",
      flexWrap: "wrap",
    },
    settingItemLast: {
      borderBottom: "none",
    },
    settingContent: {
      flex: 1,
      minWidth: "200px",
    },
    settingLabel: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "0.25rem",
    },
    settingDescription: {
      fontSize: "13px",
      color: "#999",
      lineHeight: "1.4",
    },
    inputField: {
      width: "100%",
      padding: "0.75rem 1rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    },
    inputFieldFocus: {
      borderColor: "#ff9800",
      boxShadow: "0 2px 8px rgba(255,152,0,0.15)",
      outline: "none",
    },
    toggleContainer: {
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
    },
    toggleButton: (isActive) => ({
      width: "56px",
      height: "32px",
      borderRadius: "16px",
      backgroundColor: isActive ? "#7c3aed" : "#ddd",
      border: "none",
      cursor: "pointer",
      position: "relative",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      padding: "0 3px",
      boxShadow: isActive ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
    }),
    toggleDot: (isActive) => ({
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      transition: "transform 0.3s ease",
      transform: isActive ? "translateX(24px)" : "translateX(0)",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    }),
    sliderContainer: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      minWidth: "250px",
    },
    sliderInput: {
      width: "100%",
      height: "6px",
      borderRadius: "3px",
      background: "linear-gradient(to right, #ddd 0%, #7c3aed 100%)",
      outline: "none",
      appearance: "none",
      WebkitAppearance: "none",
    },
    sliderValue: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#7c3aed",
      minWidth: "50px",
      textAlign: "center",
    },
    buttonContainer: {
      display: "flex",
      gap: "1rem",
      justifyContent: "flex-end",
      marginTop: "2rem",
      flexWrap: "wrap",
    },
    saveButton: (isEnabled) => ({
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      border: "none",
      backgroundColor: isEnabled ? "#7c3aed" : "#ccc",
      color: "#fff",
      cursor: isEnabled ? "pointer" : "not-allowed",
      fontSize: "14px",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: isEnabled ? "0 2px 8px rgba(124,58,237,0.2)" : "none",
      opacity: isEnabled ? 1 : 0.6,
    }),
    cancelButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      color: "#333",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    },
    infoBanner: {
      backgroundColor: "#f0f4ff",
      border: "1px solid #e0e7ff",
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "2rem",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
    },
    infoBannerText: {
      fontSize: "13px",
      color: "#4338ca",
      lineHeight: "1.5",
    },
    sectionIcon: {
      fontSize: "18px",
    },
  };

  // Custom range slider styles
  const rangeSliderStyle = `
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #7c3aed;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
    }
    input[type="range"]::-moz-range-thumb {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #7c3aed;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
    }
  `;

  return (
    <div style={styles.container}>
      <style>{rangeSliderStyle}</style>

      {/* Header */}
      <div style={styles.header}>
        <Settings size={24} />
        <span style={styles.headerTitle}>System Settings</span>
      </div>

      {/* Info Banner */}
      <div style={styles.infoBanner}>
        <span style={{ fontSize: "18px" }}>ℹ️</span>
        <div style={styles.infoBannerText}>
          Changes made to system settings will affect all users and the overall application behavior. Please ensure you have proper authorization before making changes.
        </div>
      </div>

      {/* General Settings Section */}
      <div style={styles.settingsSection}>
        <div style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>⚙️</span>
          General Settings
        </div>

        {/* Application Name */}
        <div style={styles.settingItem}>
          <div style={styles.settingContent}>
            <div style={styles.settingLabel}>Application Name</div>
            <div style={styles.settingDescription}>
              The name displayed in the application header
            </div>
          </div>
          <input
            type="text"
            value={settings.applicationName}
            onChange={(e) => handleInputChange("applicationName", e.target.value)}
            style={{ ...styles.inputField, width: "250px" }}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFieldFocus)}
            onBlur={(e) => {
              e.target.style.borderColor = "#ddd";
              e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            }}
          />
        </div>

        {/* App Version */}
        <div style={styles.settingItem}>
          <div style={styles.settingContent}>
            <div style={styles.settingLabel}>App Version</div>
            <div style={styles.settingDescription}>
              Current application version number
            </div>
          </div>
          <input
            type="text"
            value={settings.appVersion}
            onChange={(e) => handleInputChange("appVersion", e.target.value)}
            style={{ ...styles.inputField, width: "250px" }}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFieldFocus)}
            onBlur={(e) => {
              e.target.style.borderColor = "#ddd";
              e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            }}
          />
        </div>

        {/* Maintenance Mode */}
        <div style={{ ...styles.settingItem, ...styles.settingItemLast }}>
          <div style={styles.settingContent}>
            <div style={styles.settingLabel}>Maintenance Mode</div>
            <div style={styles.settingDescription}>
              Enable to temporarily disable the system
            </div>
          </div>
          <div style={styles.toggleContainer}>
            <button
              style={styles.toggleButton(settings.maintenanceMode)}
              onClick={() => handleToggle("maintenanceMode")}
              title={settings.maintenanceMode ? "Disable" : "Enable"}
            >
              <div style={styles.toggleDot(settings.maintenanceMode)} />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings Section */}
      <div style={styles.settingsSection}>
        <div style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🔔</span>
          Notification Settings
        </div>

        {/* Email Notifications */}
        <div style={styles.settingItem}>
          <div style={styles.settingContent}>
            <div style={styles.settingLabel}>Email Notifications</div>
            <div style={styles.settingDescription}>
              Receive system updates via email
            </div>
          </div>
          <div style={styles.toggleContainer}>
            <button
              style={styles.toggleButton(settings.emailNotifications)}
              onClick={() => handleToggle("emailNotifications")}
              title={settings.emailNotifications ? "Disable" : "Enable"}
            >
              <div style={styles.toggleDot(settings.emailNotifications)} />
            </button>
          </div>
        </div>

        {/* Push Notifications */}
        <div style={{ ...styles.settingItem, ...styles.settingItemLast }}>
          <div style={styles.settingContent}>
            <div style={styles.settingLabel}>Push Notifications</div>
            <div style={styles.settingDescription}>
              Receive real-time push notifications
            </div>
          </div>
          <div style={styles.toggleContainer}>
            <button
              style={styles.toggleButton(settings.pushNotifications)}
              onClick={() => handleToggle("pushNotifications")}
              title={settings.pushNotifications ? "Disable" : "Enable"}
            >
              <div style={styles.toggleDot(settings.pushNotifications)} />
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings Section */}
      <div style={styles.settingsSection}>
        <div style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🔒</span>
          Security Settings
        </div>

        {/* Two-Factor Authentication */}
        <div style={styles.settingItem}>
          <div style={styles.settingContent}>
            <div style={styles.settingLabel}>
              Enable Two-Factor Authentication (2FA)
            </div>
            <div style={styles.settingDescription}>
              Add an extra layer of security to user accounts
            </div>
          </div>
          <div style={styles.toggleContainer}>
            <button
              style={styles.toggleButton(settings.twoFactorAuth)}
              onClick={() => handleToggle("twoFactorAuth")}
              title={settings.twoFactorAuth ? "Disable" : "Enable"}
            >
              <div style={styles.toggleDot(settings.twoFactorAuth)} />
            </button>
          </div>
        </div>

        {/* Session Timeout */}
        <div style={{ ...styles.settingItem, ...styles.settingItemLast }}>
          <div style={styles.settingContent}>
            <div style={styles.settingLabel}>Session Timeout (minutes)</div>
            <div style={styles.settingDescription}>
              Automatically log out users after inactivity
            </div>
          </div>
          <div style={styles.sliderContainer}>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={settings.sessionTimeout}
              onChange={(e) =>
                handleInputChange("sessionTimeout", parseInt(e.target.value))
              }
              style={styles.sliderInput}
            />
            <div style={styles.sliderValue}>{settings.sessionTimeout}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.buttonContainer}>
        <button
          style={styles.cancelButton}
          onClick={() => {
            setSettings({
              applicationName: "ODR Court App",
              appVersion: "1.0.0",
              maintenanceMode: false,
              emailNotifications: true,
              pushNotifications: true,
              twoFactorAuth: false,
              sessionTimeout: 30,
            });
            setHasChanges(false);
          }}
        >
          Cancel
        </button>
        <button
          style={styles.saveButton(hasChanges)}
          onClick={handleSaveSettings}
          disabled={!hasChanges}
        >
          <Save size={18} />
          Save Settings
        </button>
      </div>
    </div>
  );
}

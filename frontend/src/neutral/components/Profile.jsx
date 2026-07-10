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
  Loader2,
  KeyRound
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ModalComponent from "./Modal/ModalComponent";
import axiosInstance from "../../api/axiosConfig";

export default function Profile() {
  const [neutralData, setNeutralData] = useState({
    name: "User",
    email: "neutral@email.com",
    phone: "",
    role: "neutral",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(null); // "editProfile" or "changePassword"

  // Form states
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [enableNotifications, setEnableNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [isMobile] = useState(window.innerWidth <= 480);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/neutral/data");
      if (res.data?.success && res.data.data) {
        setNeutralData(res.data.data);
        setProfileForm({
          name: res.data.data.name || "",
          phone: res.data.data.phone || "",
        });
      }
    } catch (error) {
      console.error("Fetch neutral data error:", error);
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axiosInstance.put("/neutral/update-profile", profileForm);
      if (res.data?.success) {
        toast.success("Profile details updated successfully!");
        setNeutralData((prev) => ({
          ...prev,
          name: profileForm.name,
          phone: profileForm.phone,
        }));
        setOpenModal(null);
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    setSaving(true);
    try {
      const res = await axiosInstance.put("/neutral/update-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data?.success) {
        toast.success("Password changed successfully!");
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setOpenModal(null);
      }
    } catch (error) {
      console.error("Update password error:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const accountSettings = [
    { id: 1, icon: Lock, label: "Change Password", color: "#0066cc", onClick: () => setOpenModal("changePassword") },
    { id: 2, icon: Globe, label: "Language (English)", color: "#2196f3", onClick: () => {} },
    { id: 3, icon: Shield, label: "Privacy Settings", color: "#1976d2", onClick: () => {} },
    { id: 4, icon: CreditCard, label: "Manage Subscriptions", color: "#1565c0", onClick: () => {} },
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
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      justifyContent: isMobile ? "center" : "flex-start",
      alignItems: "center",
      gap: isMobile ? "1rem" : "0.75rem",
      background: "linear-gradient(135deg, #ff9900 0%, #e68a00 100%)",
      color: "#fff",
      padding: "1rem 1.5rem",
      borderRadius: "12px",
      marginBottom: isMobile ? "1rem" : "2rem",
      fontSize: "18px",
      fontWeight: "600",
      boxShadow: "0 4px 12px rgba(255,153,0,0.15)",
    },
    profileCard: {
      background: "linear-gradient(135deg, #0066cc 0%, #ff9900 100%)",
      color: "#fff",
      padding: isMobile ? "1.5rem 1rem" : "2.5rem 2rem",
      borderRadius: "16px",
      marginBottom: "2rem",
      textAlign: "center",
      boxShadow: "0 4px 15px rgba(0,102,204,0.2)",
    },
    profileAvatar: {
      width: isMobile ? "80px" : "100px",
      height: isMobile ? "80px" : "100px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 1.25rem",
      fontSize: "50px",
      color: "#0066cc",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    },
    profileName: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "0.25rem",
    },
    profileRole: {
      fontSize: "13px",
      opacity: 0.95,
      textTransform: "uppercase",
      letterSpacing: "1px",
      fontWeight: "700",
      backgroundColor: "rgba(255,255,255,0.25)",
      padding: "4px 12px",
      borderRadius: "20px",
      display: "inline-block",
      marginBottom: "0.75rem",
    },
    profileEmail: {
      fontSize: "14px",
      opacity: 0.9,
      marginBottom: "1.25rem",
    },
    editButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.625rem 1.25rem",
      backgroundColor: "#fff",
      color: "#0066cc",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "700",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      transition: "transform 0.2s, background-color 0.2s",
    },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#1e293b",
      marginTop: "2rem",
      marginBottom: "1rem",
    },
    settingItem: (bgColor) => ({
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: "#fff",
      borderRadius: "12px",
      marginBottom: "0.75rem",
      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
      cursor: "pointer",
      transition: "all 0.2s ease",
      borderLeft: `4px solid ${bgColor}`,
    }),
    settingIcon: (bgColor) => ({
      width: "45px",
      height: "45px",
      borderRadius: "8px",
      backgroundColor: bgColor + "15",
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
      color: "#334155",
    },
    toggleSwitch: (isActive) => ({
      width: "50px",
      height: "28px",
      borderRadius: "14px",
      backgroundColor: isActive ? "#ff9900" : "#cbd5e1",
      border: "none",
      cursor: "pointer",
      position: "relative",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      padding: "0 3px",
    }),
    toggleDot: (isActive) => ({
      width: "22px",
      height: "22px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      transition: "transform 0.3s ease",
      transform: isActive ? "translateX(22px)" : "translateX(0)",
    }),
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
    },
    label: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#475569",
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
      backgroundColor: "#f8fafc",
      color: "#0f172a",
    },
    submitButton: {
      backgroundColor: "#ff9900",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      fontWeight: "700",
      fontSize: "14px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(255,153,0,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      width: "100%",
      marginTop: "0.5rem",
    },
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh", gap: "12px" }}>
        <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "#ff9900" }} />
        <p style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Loading profile details...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>Profile & Settings</div>

      {/* Profile Card */}
      <div style={styles.profileCard}>
        <div style={styles.profileAvatar}>
          <User size={isMobile ? 40 : 50} strokeWidth={2} />
        </div>
        <div style={styles.profileName}>{neutralData.name}</div>
        <div style={styles.profileRole}>{neutralData.role}</div>
        <div style={styles.profileEmail}>{neutralData.email}</div>
        <button
          style={styles.editButton}
          onClick={() => setOpenModal("editProfile")}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
              onClick={setting.onClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.settingIcon(setting.color)}>
                <IconComponent size={20} />
              </div>
              <div style={styles.settingContent}>
                <div style={styles.settingLabel}>{setting.label}</div>
              </div>
              <ChevronRight size={18} color="#94a3b8" />
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
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.settingIcon(pref.color)}>
                <IconComponent size={20} />
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
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.settingIcon(option.color)}>
                <IconComponent size={20} />
              </div>
              <div style={styles.settingContent}>
                <div style={styles.settingLabel}>{option.label}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{option.desc}</div>
              </div>
              <ChevronRight size={18} color="#94a3b8" />
            </div>
          );
        })}
      </div>

      {/* MODAL: EDIT PROFILE INFO */}
      {openModal === "editProfile" && (
        <ModalComponent
          title="Edit Profile Info"
          onClose={() => setOpenModal(null)}
        >
          <form onSubmit={handleUpdateProfile} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={saving} style={styles.submitButton}>
              {saving ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Edit2 size={16} />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </form>
        </ModalComponent>
      )}

      {/* MODAL: SECURITY CHANGE PASSWORD */}
      {openModal === "changePassword" && (
        <ModalComponent
          title="Security: Change Password"
          onClose={() => setOpenModal(null)}
        >
          <form onSubmit={handleUpdatePassword} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-type new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                style={styles.input}
                required
              />
            </div>

            <button type="submit" disabled={saving} style={styles.submitButton}>
              {saving ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Changing Password...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Change Password</span>
                </>
              )}
            </button>
          </form>
        </ModalComponent>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

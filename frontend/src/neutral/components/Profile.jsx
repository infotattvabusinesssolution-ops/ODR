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
  KeyRound,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ModalComponent from "./Modal/ModalComponent";
import axiosInstance from "../../api/axiosConfig";
import { clearTranslationCookies, applyLanguage } from "../../utils/translationUtils";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user: authUser, updateUser, checkAuth } = useAuth();

  const [neutralData, setNeutralData] = useState(() => {
    const rawName = localStorage.getItem("username") || localStorage.getItem("userName") || authUser?.name;
    const resolvedName = (rawName && rawName !== "Neutral User" && rawName !== "User" && rawName !== "Firebase User")
      ? rawName
      : (localStorage.getItem("userEmail") || authUser?.email || "Mediator");
    return {
      name: resolvedName,
      email: localStorage.getItem("userEmail") || authUser?.email || "",
      phone: localStorage.getItem("userPhone") || authUser?.phone || "",
      role: "Mediator",
    };
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(null); // "editProfile" or "changePassword"

  // Form states
  const [profileForm, setProfileForm] = useState(() => {
    const rawName = localStorage.getItem("username") || localStorage.getItem("userName") || authUser?.name;
    const resolvedName = (rawName && rawName !== "Neutral User" && rawName !== "User" && rawName !== "Firebase User" && rawName !== "Mediator")
      ? rawName
      : (localStorage.getItem("userEmail") || authUser?.email || "");
    return {
      name: resolvedName,
      email: localStorage.getItem("userEmail") || authUser?.email || "",
      phone: localStorage.getItem("userPhone") || authUser?.phone || "",
    };
  });

  // Sync state if auth context updates
  useEffect(() => {
    if (authUser) {
      const rawName = authUser.name || localStorage.getItem("username") || localStorage.getItem("userName");
      const resolvedName = (rawName && rawName !== "Neutral User" && rawName !== "User" && rawName !== "Firebase User")
        ? rawName
        : (authUser.email || localStorage.getItem("userEmail") || "Mediator");
      setNeutralData((prev) => ({
        ...prev,
        name: resolvedName,
        email: authUser.email !== undefined ? authUser.email : prev.email,
        phone: authUser.phone !== undefined ? authUser.phone : prev.phone,
        role: "Mediator",
      }));
      setProfileForm((prev) => ({
        name: (resolvedName !== "Mediator" ? resolvedName : (authUser.email || prev.name)),
        email: authUser.email !== undefined ? authUser.email : (prev.email || ""),
        phone: authUser.phone !== undefined ? authUser.phone : (prev.phone || ""),
      }));
    }
  }, [authUser]);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [enableNotifications, setEnableNotifications] = useState(
    () => localStorage.getItem("neutral_notifications") !== "false"
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("neutral_darkMode") === "true"
  );
  const [dataSaver, setDataSaver] = useState(
    () => localStorage.getItem("neutral_dataSaver") === "true"
  );
  const [isMobile] = useState(window.innerWidth <= 480);

  // Additional settings
  const [language, setLanguage] = useState(
    () => localStorage.getItem("appLanguage") || "English"
  );
  const [twoFactorAuth, setTwoFactorAuth] = useState(
    () => localStorage.getItem("neutral_2fa") === "true"
  );
  const [profileVisible, setProfileVisible] = useState(
    () => localStorage.getItem("neutral_profileVisible") !== "false"
  );
  const [sessionTimeout, setSessionTimeout] = useState(
    () => localStorage.getItem("neutral_sessionTimeout") !== "false"
  );
  const [caseAlerts, setCaseAlerts] = useState(
    () => localStorage.getItem("neutral_caseAlerts") !== "false"
  );
  const [expandedFaq, setExpandedFaq] = useState(null);

  const languagesList = [
    { code: "en", name: "English", native: "English" },
    { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "bn", name: "Bengali", native: "বাংলা" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
  ];

  const handleSelectLanguage = (lang) => {
    setLanguage(lang.name);
    localStorage.setItem("appLanguage", lang.name);
    
    if (lang.code === "en") {
      clearTranslationCookies();
    } else {
      applyLanguage(lang.code);
    }
    
    toast.success(`Language changed to ${lang.name} (${lang.native})`);
    setOpenModal(null);
  };

  const handleSavePrivacy = () => {
    localStorage.setItem("neutral_2fa", String(twoFactorAuth));
    localStorage.setItem("neutral_profileVisible", String(profileVisible));
    localStorage.setItem("neutral_sessionTimeout", String(sessionTimeout));
    localStorage.setItem("neutral_caseAlerts", String(caseAlerts));
    toast.success("Privacy settings updated successfully!");
    setOpenModal(null);
  };

  const neutralFaqs = [
    {
      id: 1,
      q: "How do I review case submissions and evidentiary documents?",
      a: "Go to Scrutinize Submissions. You will see assigned dispute dossiers, claimant statements, respondent rejoinders, and attached proofs.",
    },
    {
      id: 2,
      q: "How do I conduct an online video hearing?",
      a: "Navigate to Schedule Hearings. Join the designated Google Meet room at the hearing time. Both parties will be admitted through the verified portal.",
    },
    {
      id: 3,
      q: "How do I draft and publish an arbitral award?",
      a: "Under Upload Awards, upload your decision document (PDF/DOCX), review the draft summary, and click 'Publish' to issue the final legally enforceable award.",
    },
    {
      id: 4,
      q: "What should I do if a party fails to attend a hearing?",
      a: "Note the absence in the hearing record. You may either reschedule with notice or proceed in accordance with applicable institutional arbitration rules.",
    },
    {
      id: 5,
      q: "Who provides arbiter registry and support assistance?",
      a: "Contact our arbitration support registrar at support@odrcourtapp.com or call +91 9187102299.",
    },
  ];

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/neutral/data");
      if (res.data?.success && res.data.data) {
        const u = res.data.data;
        const rawName = u.name;
        const resolvedName = (rawName && rawName !== "Neutral User" && rawName !== "User" && rawName !== "Firebase User")
          ? rawName
          : (u.email || localStorage.getItem("userEmail") || authUser?.email || "Mediator");
        setNeutralData({
          ...u,
          name: resolvedName,
          email: u.email || localStorage.getItem("userEmail") || authUser?.email || "",
          phone: u.phone || localStorage.getItem("userPhone") || authUser?.phone || "",
          role: "Mediator",
        });
        setProfileForm({
          name: (resolvedName && resolvedName !== "Mediator") ? resolvedName : (u.email || ""),
          email: u.email || localStorage.getItem("userEmail") || authUser?.email || "",
          phone: u.phone || "",
        });
        if (resolvedName) localStorage.setItem("username", resolvedName);
        if (u.email) localStorage.setItem("userEmail", u.email);
        if (u.phone) localStorage.setItem("userPhone", u.phone);
        localStorage.setItem("userRole", "neutral");
      }
    } catch (error) {
      console.error("Fetch neutral data error:", error);
      // Fallback gracefully to localStorage or authUser so email/name still displays
      const savedEmail = localStorage.getItem("userEmail") || authUser?.email || "";
      const rawSavedName = localStorage.getItem("username") || localStorage.getItem("userName") || authUser?.name;
      const savedName = (rawSavedName && rawSavedName !== "Neutral User" && rawSavedName !== "User" && rawSavedName !== "Firebase User")
        ? rawSavedName
        : (savedEmail || "Mediator");
      const savedPhone = localStorage.getItem("userPhone") || authUser?.phone || "";
      setNeutralData({
        name: savedName,
        email: savedEmail,
        phone: savedPhone,
        role: "Mediator",
      });
      setProfileForm({
        name: (savedName && savedName !== "Mediator") ? savedName : (savedEmail || ""),
        email: savedEmail,
        phone: savedPhone,
      });
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
        const updated = res.data.data || {};
        const newName = updated.name || profileForm.name;
        const newEmail = updated.email || profileForm.email;
        const newPhone = updated.phone || profileForm.phone;
        setNeutralData((prev) => ({
          ...prev,
          name: newName,
          email: newEmail,
          phone: newPhone,
        }));
        if (newName) {
          localStorage.setItem("username", newName);
          localStorage.setItem("userName", newName);
        }
        if (newEmail) {
          localStorage.setItem("userEmail", newEmail);
        }
        if (newPhone) {
          localStorage.setItem("userPhone", newPhone);
        }
        if (updateUser) {
          updateUser({
            name: newName,
            email: newEmail,
            phone: newPhone,
          });
        }
        if (checkAuth) {
          checkAuth();
        }
        window.dispatchEvent(new Event("profileUpdated"));
        setOpenModal(null);
        fetchProfileData();
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
    { id: 2, icon: Shield, label: "Privacy Settings", color: "#1976d2", onClick: () => setOpenModal("privacy") },
    { id: 3, icon: CreditCard, label: "Manage Subscriptions", color: "#1565c0", onClick: () => setOpenModal("subscription") },
  ];

  const preferences = [
    {
      id: 1,
      icon: Bell,
      label: "Enable Notifications",
      toggle: enableNotifications,
      setToggle: (val) => {
        setEnableNotifications(val);
        localStorage.setItem("neutral_notifications", String(val));
        toast.info(val ? "Notifications enabled" : "Notifications muted");
      },
      color: "#ff9900",
    },
    {
      id: 2,
      icon: Moon,
      label: "Dark Mode",
      toggle: darkMode,
      setToggle: (val) => {
        setDarkMode(val);
        localStorage.setItem("neutral_darkMode", String(val));
        toast.info(val ? "Dark mode enabled" : "Dark mode disabled");
      },
      color: "#9c27b0",
    },
    {
      id: 3,
      icon: Zap,
      label: "Data Saver",
      toggle: dataSaver,
      setToggle: (val) => {
        setDataSaver(val);
        localStorage.setItem("neutral_dataSaver", String(val));
        toast.info(val ? "Data saver enabled" : "Data saver disabled");
      },
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
      onClick: () => {
        toast.info("Opening Gmail compose...");
        window.open(
          "https://mail.google.com/mail/?view=cm&fs=1&to=support@odrcourtapp.com&su=ODR%20Mediator%20Support%20Request",
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      id: 2,
      icon: Phone,
      label: "Contact Us",
      desc: "+91 9187102299",
      color: "#0066cc",
      onClick: () => {
        toast.info("Connecting to support: +91 9187102299");
        window.location.href = "tel:+919187102299";
      },
    },
    {
      id: 4,
      icon: MessagesSquare,
      label: "FAQs",
      desc: "Find answers to common questions",
      color: "#0066cc",
      onClick: () => setOpenModal("faqs"),
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
        <div style={styles.profileName}>{neutralData.name || neutralData.email || neutralData.phone || "Mediator"}</div>
        <div style={styles.profileRole}>{neutralData.role || "Mediator"}</div>
        <div style={styles.profileEmail}>{neutralData.email || "No email added"}</div>
        {neutralData.phone && (
          <div style={{ ...styles.profileEmail, opacity: 0.8, fontSize: "13px", marginTop: "-6px", marginBottom: "12px" }}>
            Phone: {neutralData.phone}
          </div>
        )}
        <button
          style={styles.editButton}
          onClick={() => {
            setProfileForm({
              name: neutralData.name && neutralData.name !== "Mediator" ? neutralData.name : (neutralData.email || ""),
              email: neutralData.email || "",
              phone: neutralData.phone || "",
            });
            setOpenModal("editProfile");
          }}
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
              onClick={option.onClick}
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
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={profileForm.email || ""}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
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
                placeholder="Enter phone number"
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

      {/* MODAL: PRIVACY SETTINGS */}
      {openModal === "privacy" && (
        <ModalComponent title="Privacy & Security Settings" onClose={() => setOpenModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Two-Factor Authentication (2FA)</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Require OTP code upon signing in</div>
              </div>
              <button
                type="button"
                style={styles.toggleSwitch(twoFactorAuth)}
                onClick={() => setTwoFactorAuth(!twoFactorAuth)}
              >
                <div style={styles.toggleDot(twoFactorAuth)} />
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Mediator Profile Visibility</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Allow parties to view accreditation & bio</div>
              </div>
              <button
                type="button"
                style={styles.toggleSwitch(profileVisible)}
                onClick={() => setProfileVisible(!profileVisible)}
              >
                <div style={styles.toggleDot(profileVisible)} />
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Auto Session Timeout</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Auto log out after 30 minutes of inactivity</div>
              </div>
              <button
                type="button"
                style={styles.toggleSwitch(sessionTimeout)}
                onClick={() => setSessionTimeout(!sessionTimeout)}
              >
                <div style={styles.toggleDot(sessionTimeout)} />
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Hearing & Case Alerts</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Receive real-time notifications for hearing changes</div>
              </div>
              <button
                type="button"
                style={styles.toggleSwitch(caseAlerts)}
                onClick={() => setCaseAlerts(!caseAlerts)}
              >
                <div style={styles.toggleDot(caseAlerts)} />
              </button>
            </div>

            <button type="button" onClick={handleSavePrivacy} style={styles.submitButton}>
              Save Privacy Settings
            </button>
          </div>
        </ModalComponent>
      )}

      {/* MODAL: MANAGE SUBSCRIPTION */}
      {openModal === "subscription" && (
        <ModalComponent title="Mediator Roster & License Status" onClose={() => setOpenModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#15803d" }}>
                  Certified Mediator
                </span>
                <span style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "12px" }}>
                  Active
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#374151", margin: "6px 0 0 0" }}>
                Verified by the institutional ODR Registry with full dispute mediation authorization.
              </p>
            </div>

            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>Included Capabilities:</div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                <li>Adjudicate and manage assigned dispute proceedings</li>
                <li>Conduct Google Meet online hearings with video recording</li>
                <li>Draft, review, and legally publish arbitral awards & orders</li>
                <li>Access AI-assisted legal research and case precedent summaries</li>
              </ul>
            </div>

            <button type="button" onClick={() => setOpenModal(null)} style={styles.submitButton}>
              Close
            </button>
          </div>
        </ModalComponent>
      )}

      {/* MODAL: FAQS */}
      {openModal === "faqs" && (
        <ModalComponent title="Frequently Asked Questions" onClose={() => setOpenModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {neutralFaqs.map((faq) => {
              const isOpen = expandedFaq === faq.id;
              return (
                <div key={faq.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                  <div
                    onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                    style={{
                      padding: "0.75rem 1rem",
                      backgroundColor: isOpen ? "#fff7ed" : "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      color: isOpen ? "#ea580c" : "#1e293b",
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fff", fontSize: "13px", color: "#475569", lineHeight: "1.5", borderTop: "1px solid #e2e8f0" }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ModalComponent>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

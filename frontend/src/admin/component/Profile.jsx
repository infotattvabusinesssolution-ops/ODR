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
  X,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../api/axiosConfig";
import EditProfileForm from "./Modal/EditProfile";
import ModalComponent from "./Modal/ModalComponent";
import { clearTranslationCookies, applyLanguage } from "../../utils/translationUtils";

export default function Profile() {
  const navigate = useNavigate();
  const [isMobile] = useState(window.innerWidth <= 480);
  const [data, setData] = useState(null);

  // Profile data
  const [name, setName] = useState(localStorage.getItem("userName") || "System Admin");
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "admin@gmail.com");
  const [role, setRole] = useState("admin");

  // Preferences
  const [enableNotifications, setEnableNotifications] = useState(
    () => localStorage.getItem("admin_notifications") !== "false"
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("admin_darkMode") === "true"
  );
  const [dataSaver, setDataSaver] = useState(
    () => localStorage.getItem("admin_dataSaver") === "true"
  );

  // Language
  const [language, setLanguage] = useState(
    () => localStorage.getItem("appLanguage") || "English"
  );

  // Privacy Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(
    () => localStorage.getItem("admin_2fa") === "true"
  );
  const [auditLogging, setAuditLogging] = useState(
    () => localStorage.getItem("admin_auditLogging") !== "false"
  );
  const [sessionTimeout, setSessionTimeout] = useState(
    () => localStorage.getItem("admin_sessionTimeout") !== "false"
  );
  const [systemAlerts, setSystemAlerts] = useState(
    () => localStorage.getItem("admin_systemAlerts") !== "false"
  );

  // Modal controls
  const [openModal, setOpenModal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const fetchAdminData = async () => {
    try {
      const response = await axiosInstance.get("/admin/data");
      if (response.data?.success && response.data.data) {
        setData(response.data.data);
        if (response.data.data.name) setName(response.data.data.name);
        if (response.data.data.email) setEmail(response.data.data.email);
        if (response.data.data.role) setRole(response.data.data.role);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const handleProfileUpdate = () => fetchAdminData();
    window.addEventListener("adminProfileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("adminProfileUpdated", handleProfileUpdate);
    };
  }, []);

  // Submit Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      toast.error("Please enter your current password");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await axiosInstance.put("/admin/update-password", {
        oldPassword,
        newPassword,
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Password changed successfully!");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.data?.message || "Failed to update password");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Incorrect current password or server error";
      toast.error(errMsg);
    } finally {
      setIsChangingPass(false);
    }
  };

  // Language List
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
    setShowLanguageModal(false);
  };

  // Save Privacy Settings
  const handleSavePrivacy = () => {
    localStorage.setItem("admin_2fa", String(twoFactorAuth));
    localStorage.setItem("admin_auditLogging", String(auditLogging));
    localStorage.setItem("admin_sessionTimeout", String(sessionTimeout));
    localStorage.setItem("admin_systemAlerts", String(systemAlerts));
    toast.success("Privacy settings updated successfully!");
    setShowPrivacyModal(false);
  };

  // FAQs
  const faqList = [
    {
      id: 1,
      q: "How do I assign mediators to new disputes?",
      a: "Navigate to the Assigned Cases tab under Admin Controls. Select any incoming case with status 'Pending Assignment' and pick a certified mediator from the institutional roster.",
    },
    {
      id: 2,
      q: "How are session schedules coordinated?",
      a: "Admins can oversee online video dispute resolution sessions via Schedule Sessions. Automatic invites and Google Meet links are generated and dispatched to all parties.",
    },
    {
      id: 3,
      q: "How do I review and publish mediation awards / orders?",
      a: "Under the Awards and Orders repository, review draft decisions submitted by appointed mediators. Once verified, click 'Publish' to make the order legally binding and available to claimants and respondents.",
    },
    {
      id: 4,
      q: "How can I export platform audit logs and case analytics?",
      a: "Go to Reports & Analytics. You can filter by date range, dispute category, settlement velocity, and export comprehensive Excel/PDF compliance summaries.",
    },
    {
      id: 5,
      q: "Who provides emergency administrative infrastructure support?",
      a: "You can reach out to our platform operations team directly at support@odrcourtapp.com or call +91 9187102299.",
    },
  ];

  const accountSettings = [
    {
      id: 1,
      icon: Lock,
      label: "Change Password",
      color: "#0066cc",
      onClick: () => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordModal(true);
      },
    },
    {
      id: 2,
      icon: Globe,
      label: `Language (${language})`,
      color: "#2196f3",
      onClick: () => setShowLanguageModal(true),
    },
    {
      id: 3,
      icon: Shield,
      label: "Privacy Settings",
      color: "#1976d2",
      onClick: () => setShowPrivacyModal(true),
    },
    {
      id: 4,
      icon: CreditCard,
      label: "Manage Subscriptions",
      color: "#1565c0",
      onClick: () => setShowSubscriptionModal(true),
    },
  ];

  const preferences = [
    {
      id: 1,
      icon: Bell,
      label: "Enable Notifications",
      toggle: enableNotifications,
      setToggle: (val) => {
        setEnableNotifications(val);
        localStorage.setItem("admin_notifications", String(val));
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
        localStorage.setItem("admin_darkMode", String(val));
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
        localStorage.setItem("admin_dataSaver", String(val));
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
          "https://mail.google.com/mail/?view=cm&fs=1&to=support@odrcourtapp.com&su=ODR%20Admin%20Support%20Request",
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
      onClick: () => setShowFaqModal(true),
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
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem",
    },
    modalCard: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      maxWidth: "460px",
      width: "100%",
      maxHeight: "88vh",
      overflowY: "auto",
      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
      padding: "1.75rem",
      position: "relative",
    },
  };

  const displayName = (data && data.name) || name;
  const displayRole = (data && data.user) || (data && data.role) || role;
  const displayEmail = (data && data.email) || email;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>☰ Profile & Settings</div>

      {/* Profile Card */}
      <div style={styles.profileCard}>
        <div style={{ ...styles.profileAvatar, overflow: "hidden" }}>
          {data?.profilePic ? (
            <img
              src={data.profilePic}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <User size={isMobile ? 40 : 60} strokeWidth={2.2} />
          )}
        </div>
        <div style={styles.profileName}>{displayName}</div>
        <div style={styles.profileRole}>{displayRole}</div>
        <div style={styles.profileEmail}>{displayEmail}</div>
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
          onClick={() => setOpenModal("editProfile")}
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
              onClick={setting.onClick}
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
              onClick={() => pref.setToggle(!pref.toggle)}
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
                type="button"
                style={styles.toggleSwitch(pref.toggle)}
                onClick={(e) => {
                  e.stopPropagation();
                  pref.setToggle(!pref.toggle);
                }}
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
              onClick={option.onClick}
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
                <div style={styles.settingDescription}>{option.desc}</div>
              </div>
              <ChevronRight size={20} color="#999" />
            </div>
          );
        })}
      </div>

      {/* EDIT PROFILE MODAL */}
      {openModal === "editProfile" && (
        <ModalComponent title="" onClose={() => setOpenModal(null)}>
          <EditProfileForm
            onClose={() => setOpenModal(null)}
            currentName={displayName}
            currentEmail={displayEmail}
            currentPhone={data?.phone || localStorage.getItem("userPhone") || ""}
            currentBio={data?.bio || localStorage.getItem("admin_bio") || ""}
            currentPic={data?.profilePic || null}
            onSuccess={(updated) => {
              setData((prev) => ({
                ...(prev || {}),
                ...updated,
              }));
              if (updated.name) setName(updated.name);
              if (updated.email) setEmail(updated.email);
            }}
          />
        </ModalComponent>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "#e3f2fd", color: "#0066cc" }}>
                  <Lock size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#333" }}>
                  Change Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#666",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#444", marginBottom: "4px" }}>
                  Current Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showOldPass ? "text" : "password"}
                    required
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 38px 9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#777",
                      padding: "2px",
                    }}
                  >
                    {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#444", marginBottom: "4px" }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 38px 9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#777",
                      padding: "2px",
                    }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#444", marginBottom: "4px" }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    padding: "0.55rem 1rem",
                    backgroundColor: "#f5f5f5",
                    color: "#555",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  style={{
                    padding: "0.55rem 1.25rem",
                    backgroundColor: "#0066cc",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isChangingPass ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {isChangingPass ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LANGUAGE SELECT MODAL */}
      {showLanguageModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLanguageModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "#e3f2fd", color: "#2196f3" }}>
                  <Globe size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#333" }}>
                  Select Language
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLanguageModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#666",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {languagesList.map((lang) => {
                const isSelected = language === lang.name;
                return (
                  <div
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #0066cc" : "1px solid #e0e0e0",
                      backgroundColor: isSelected ? "#f0f7ff" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isSelected ? "700" : "500", color: "#333", fontSize: "14px" }}>
                        {lang.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{lang.native}</div>
                    </div>
                    {isSelected && <Check size={18} color="#0066cc" strokeWidth={2.5} />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button
                type="button"
                onClick={() => setShowLanguageModal(false)}
                style={{
                  padding: "0.55rem 1.25rem",
                  backgroundColor: "#f5f5f5",
                  color: "#555",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY SETTINGS MODAL */}
      {showPrivacyModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPrivacyModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "#e3f2fd", color: "#1976d2" }}>
                  <Shield size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#333" }}>
                  Privacy & Security Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#666",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                    Two-Factor Authentication (2FA)
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    Require a one-time SMS/Email OTP upon administrative logins
                  </div>
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
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                    Admin Audit Logging
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    Log case assignments, mediator nominations, and status modifications
                  </div>
                </div>
                <button
                  type="button"
                  style={styles.toggleSwitch(auditLogging)}
                  onClick={() => setAuditLogging(!auditLogging)}
                >
                  <div style={styles.toggleDot(auditLogging)} />
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                    Auto Session Timeout
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    Automatically sign out after 30 minutes of inactivity for compliance
                  </div>
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
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                    Critical System Alerts
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    Receive real-time alerts for server status, new cases, and hearing conflicts
                  </div>
                </div>
                <button
                  type="button"
                  style={styles.toggleSwitch(systemAlerts)}
                  onClick={() => setSystemAlerts(!systemAlerts)}
                >
                  <div style={styles.toggleDot(systemAlerts)} />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  padding: "0.55rem 1rem",
                  backgroundColor: "#f5f5f5",
                  color: "#555",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrivacy}
                style={{
                  padding: "0.55rem 1.25rem",
                  backgroundColor: "#0066cc",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE SUBSCRIPTIONS MODAL */}
      {showSubscriptionModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSubscriptionModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "#e3f2fd", color: "#1565c0" }}>
                  <CreditCard size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#333" }}>
                  Manage Subscriptions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSubscriptionModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#666",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafd",
                border: "1px solid #d0e2ff",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#0066cc" }}>
                  Enterprise Institutional License
                </span>
                <span
                  style={{
                    backgroundColor: "#e8f5e9",
                    color: "#2e7d32",
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "12px",
                  }}
                >
                  Active
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#555", marginTop: "6px" }}>
                Full institutional administrative control over court registries, mediators, and hearings.
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#444", marginBottom: "6px" }}>
                Administrative Privileges:
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "13px", color: "#555", lineHeight: "1.6" }}>
                <li>Unlimited case filing and dispute management</li>
                <li>Mediator roster assignment</li>
                <li>Secure online video hearing rooms (Google Meet)</li>
                <li>Arbitral award verification and publishing control</li>
                <li>Institutional reporting and escrow ledger analytics</li>
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowSubscriptionModal(false)}
                style={{
                  padding: "0.55rem 1rem",
                  backgroundColor: "#f5f5f5",
                  color: "#555",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubscriptionModal(false);
                  navigate("/admin/reports-analytics");
                }}
                style={{
                  padding: "0.55rem 1.25rem",
                  backgroundColor: "#0066cc",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                View Analytics & Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQS MODAL */}
      {showFaqModal && (
        <div style={styles.modalOverlay} onClick={() => setShowFaqModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "#e3f2fd", color: "#0066cc" }}>
                  <MessagesSquare size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#333" }}>
                  Frequently Asked Questions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#666",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {faqList.map((faq) => {
                const isOpen = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                      style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: isOpen ? "#f0f7ff" : "#fafafa",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "13px",
                        color: isOpen ? "#0066cc" : "#333",
                      }}
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {isOpen && (
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          backgroundColor: "#fff",
                          fontSize: "13px",
                          color: "#555",
                          lineHeight: "1.5",
                          borderTop: "1px solid #e0e0e0",
                        }}
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                style={{
                  padding: "0.55rem 1.25rem",
                  backgroundColor: "#f5f5f5",
                  color: "#555",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

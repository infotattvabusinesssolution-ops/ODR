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
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "./Modal/Modal";
import axiosInstance from "../../api/axiosConfig";
import "../../claimant/components/NewCase.css";

export default function Profile() {
  const [enableNotifications, setEnableNotifications] = useState(
    () => localStorage.getItem("claimant_notifications") !== "false"
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("claimant_darkMode") === "true"
  );
  const [dataSaver, setDataSaver] = useState(
    () => localStorage.getItem("claimant_dataSaver") === "true"
  );
  const [isMobile] = useState(window.innerWidth <= 480);

  const [language, setLanguage] = useState(
    () => localStorage.getItem("appLanguage") || "English"
  );
  const [twoFactorAuth, setTwoFactorAuth] = useState(
    () => localStorage.getItem("claimant_2fa") === "true"
  );
  const [profileVisible, setProfileVisible] = useState(
    () => localStorage.getItem("claimant_profileVisible") !== "false"
  );
  const [sessionTimeout, setSessionTimeout] = useState(
    () => localStorage.getItem("claimant_sessionTimeout") !== "false"
  );
  const [caseAlerts, setCaseAlerts] = useState(
    () => localStorage.getItem("claimant_caseAlerts") !== "false"
  );

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
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
    } else {
      document.cookie = `googtrans=/en/${lang.code}; path=/`;
      document.cookie = `googtrans=/en/${lang.code}; domain=${window.location.hostname}; path=/`;
    }
    
    const translateSelect = document.querySelector(".goog-te-combo");
    if (translateSelect) {
      translateSelect.value = lang.code;
      translateSelect.dispatchEvent(new Event("change"));
    }
    
    toast.success(`Language changed to ${lang.name} (${lang.native})`);
    setOpenModal(null);
  };

  const handleSavePrivacy = () => {
    localStorage.setItem("claimant_2fa", String(twoFactorAuth));
    localStorage.setItem("claimant_profileVisible", String(profileVisible));
    localStorage.setItem("claimant_sessionTimeout", String(sessionTimeout));
    localStorage.setItem("claimant_caseAlerts", String(caseAlerts));
    toast.success("Privacy settings updated successfully!");
    setOpenModal(null);
  };

  // Profile data state
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Service Request states
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [openModal, setOpenModal] = useState(null); // 'SubmitTicket', 'ViewTicket', 'EditProfile', 'ChangePassword'

  const [selectedTicket, setSelectedTicket] = useState(null);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "Medium"
  });

  // Edit Profile / Password states
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Fetch Profile data
  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await axiosInstance.get("/claimant/data");
      if (response.data?.success && response.data.data) {
        const u = response.data.data;
        setProfileData(u);
        const resolvedName = (u.name && u.name !== "User" && u.name !== "Firebase User")
          ? u.name
          : (u.email || localStorage.getItem("userEmail") || localStorage.getItem("username") || localStorage.getItem("userName") || "");
        setEditForm({
          name: resolvedName,
          phone: u.phone || localStorage.getItem("userPhone") || "",
          email: u.email || localStorage.getItem("userEmail") || "",
        });
        localStorage.setItem("username", resolvedName);
        localStorage.setItem("userName", resolvedName);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Fetch My Service Requests
  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await axiosInstance.get("/api/service-requests/my");
      if (response.data?.success) {
        setMyRequests(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMyRequests();
  }, []);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return;

    setSubmittingRequest(true);
    try {
      const response = await axiosInstance.post("/api/service-requests", newTicket);
      if (response.data?.success) {
        toast.success("Support ticket submitted successfully!");
        setOpenModal(null);
        setNewTicket({ subject: "", description: "", priority: "Medium" });
        fetchMyRequests();
      } else {
        toast.error(response.data?.message || "Failed to submit support ticket.");
      }
    } catch (err) {
      console.error("Error submitting ticket:", err);
      toast.error(err.response?.data?.message || "Failed to submit support ticket.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const response = await axiosInstance.put("/claimant/update-profile", editForm);
      if (response.data?.success) {
        const updated = response.data?.data;
        if (updated) {
          setProfileData((prev) => ({ ...prev, ...updated }));
          if (updated.name) {
            localStorage.setItem("username", updated.name);
            localStorage.setItem("userName", updated.name);
          }
          if (updated.phone) {
            localStorage.setItem("userPhone", updated.phone);
          }
          if (updated.email) {
            localStorage.setItem("userEmail", updated.email);
          }
        }
        toast.success("Profile updated successfully!");
        setOpenModal(null);
        window.dispatchEvent(new Event("profileUpdated"));
        fetchProfile();
      } else {
        toast.error(response.data?.message || "Failed to update profile settings.");
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to update profile settings.";
      toast.error(errMsg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setUpdatingPassword(true);
    try {
      const response = await axiosInstance.put("/claimant/update-password", passwordForm);
      if (response.data?.success) {
        toast.success("Password changed successfully!");
        setOpenModal(null);
        setPasswordForm({ oldPassword: "", newPassword: "" });
      } else {
        toast.error(response.data?.message || "Failed to update password.");
      }
    } catch (err) {
      console.error("Password change failed:", err);
      toast.error(err.response?.data?.message || "Failed to change password. Check your old password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved": return "#4caf50";
      case "In Progress": return "#ff9800";
      case "Pending": return "#2196f3";
      default: return "#999";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved": return <CheckCircle size={14} />;
      case "In Progress": return <Clock size={14} />;
      case "Pending": return <AlertCircle size={14} />;
      default: return null;
    }
  };

  const accountSettings = [
    { id: 1, icon: Lock, label: "Change Password", color: "#0066cc", action: () => setOpenModal("ChangePassword") },
    { id: 2, icon: Globe, label: `Language (${language})`, color: "#2196f3", action: () => setOpenModal("Language") },
    { id: 3, icon: Shield, label: "Privacy Settings", color: "#1976d2", action: () => setOpenModal("Privacy") },
    {
      id: 4,
      icon: CreditCard,
      label: "Manage Subscriptions",
      color: "#1565c0",
      action: () => setOpenModal("Subscription"),
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
        localStorage.setItem("claimant_notifications", String(val));
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
        localStorage.setItem("claimant_darkMode", String(val));
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
        localStorage.setItem("claimant_dataSaver", String(val));
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
      action: () => {
        toast.info("Opening Gmail compose...");
        window.open(
          "https://mail.google.com/mail/?view=cm&fs=1&to=support@odrcourtapp.com&su=ODR%20Claimant%20Support%20Request",
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
      action: () => {
        toast.info("Connecting to support: +91 9187102299");
        window.location.href = "tel:+919187102299";
      },
    },
  ];

  const getInitials = (name) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

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
      fontSize: "36px",
      fontWeight: "bold",
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
      textTransform: "capitalize"
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
    ticketCard: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "0.75rem",
      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderLeft: "4px solid #cbd5e1"
    },
    badge: (color) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      padding: "0.35rem 0.6rem",
      borderRadius: "6px",
      backgroundColor: `${color}15`,
      color: color,
      fontSize: "11px",
      fontWeight: "600"
    }),
    submitBtn: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.25rem",
      backgroundColor: "#ff9900",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(255,153,0,0.2)",
      marginBottom: "1rem"
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>☰ Profile & Settings</div>

      {/* Profile Card */}
      <div style={styles.profileCard}>
        {loadingProfile ? (
          <div style={{ padding: "2rem" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
          </div>
        ) : (
          <>
            <div style={styles.profileAvatar}>
              {profileData?.name ? getInitials(profileData.name) : <User size={isMobile ? 40 : 60} />}
            </div>
            <div style={styles.profileName}>
              {(profileData?.name && profileData?.name !== "User" && profileData?.name !== "Firebase User")
                ? profileData.name
                : (profileData?.email || localStorage.getItem("username") || localStorage.getItem("userName") || localStorage.getItem("userEmail") || "User")}
            </div>
            <div style={styles.profileRole}>{profileData?.user || "Claimant"}</div>
            <div style={styles.profileEmail}>{profileData?.email || "user@email.com"}</div>
            <div style={{ ...styles.profileEmail, opacity: 0.7, fontSize: "13px", marginTop: "-6px", marginBottom: "15px" }}>
              Phone: {profileData?.phone || "Not set"}
            </div>
            <button
              style={styles.editButton}
              onClick={() => {
                const currentName = (profileData?.name && profileData?.name !== "User" && profileData?.name !== "Firebase User")
                  ? profileData.name
                  : (profileData?.email || localStorage.getItem("userEmail") || localStorage.getItem("username") || localStorage.getItem("userName") || "");
                setEditForm({
                  name: currentName,
                  phone: profileData?.phone || localStorage.getItem("userPhone") || "",
                  email: profileData?.email || localStorage.getItem("userEmail") || "",
                });
                setOpenModal("EditProfile");
              }}
            >
              <Edit2 size={16} />
              Edit Profile Info
            </button>
          </>
        )}
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
              onClick={setting.action ? setting.action : undefined}
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

      {/* Support & Service Tickets Section */}
      <div>
        <div style={styles.sectionTitle}>Support & Service Tickets</div>
        <button style={styles.submitBtn} onClick={() => setOpenModal("SubmitTicket")}>
          <Plus size={18} />
          Create Support Request
        </button>

        {loadingRequests ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : myRequests.length > 0 ? (
          <div>
            {myRequests.map((req) => (
              <div 
                key={req._id} 
                style={{ ...styles.ticketCard, borderLeftColor: getStatusColor(req.status) }}
                onClick={() => { setSelectedTicket(req); setOpenModal("ViewTicket"); }}
                onMouseEnter={(e) => { e.currentTarget.style.cursor = "pointer"; e.currentTarget.style.backgroundColor = "#fafafa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px", color: "#333" }}>{req.subject}</div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "0.25rem" }}>
                    Request ID: <strong>{req.requestId}</strong> | Priority: <strong>{req.priority}</strong>
                  </div>
                </div>
                <div style={styles.badge(getStatusColor(req.status))}>
                  {getStatusIcon(req.status)}
                  <span>{req.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#888", fontStyle: "italic", marginBottom: "1rem" }}>
            You haven't submitted any support requests yet.
          </p>
        )}
      </div>

      {/* Help and Support Options */}
      <div>
        <div style={styles.sectionTitle}>General Help Details</div>
        {helpOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <div
              key={option.id}
              style={styles.settingItem(option.color)}
              onClick={option.action ? option.action : undefined}
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
                <div style={{ ...styles.settingLabel, fontSize: "13px", color: "#666", fontWeight: "normal" }}>{option.desc}</div>
              </div>
              <ChevronRight size={20} color="#999" />
            </div>
          );
        })}
      </div>

      {/* MODAL: EDIT PROFILE INFO */}
      <Modal
        isOpen={openModal === "EditProfile"}
        onClose={() => setOpenModal(null)}
        title="Edit Profile Info"
      >
        <div style={{ padding: "4px 0" }}>
          <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "#f8fafc",
                  outline: "none",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +91 99999 99999"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "#f8fafc",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={editForm.email || ""}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "#f8fafc",
                  outline: "none",
                  boxSizing: "border-box"
                }}

              />
            </div>

            <button 
              type="submit" 
              disabled={updatingProfile} 
              style={{
                backgroundColor: "#ff9900",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255,153,0,0.2)",
                marginTop: "0.5rem",
                width: "100%"
              }}
            >
              {updatingProfile ? "Updating..." : "Save Changes"}
            </button>
          </form>
        </div>
      </Modal>

      {/* MODAL: CHANGE PASSWORD */}
      <Modal
        isOpen={openModal === "ChangePassword"}
        onClose={() => setOpenModal(null)}
        title="Security: Change Password"
      >
        <div style={{ padding: "4px 0" }}>
          <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Old Password</label>
              <input
                type="password"
                placeholder="Enter old password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "#f8fafc",
                  outline: "none",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "#f8fafc",
                  outline: "none",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={updatingPassword} 
              style={{
                backgroundColor: "#ff9900",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255,153,0,0.2)",
                marginTop: "0.5rem",
                width: "100%"
              }}
            >
              {updatingPassword ? "Updating Password..." : "Change Password"}
            </button>
          </form>
        </div>
      </Modal>

      {/* MODAL: SUBMIT TICKET */}
      <Modal
        isOpen={openModal === "SubmitTicket"}
        onClose={() => setOpenModal(null)}
        title="New Support Request"
      >
        <div style={{ padding: "4px 0" }}>
          <form onSubmit={handleTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Subject</label>
              <input
                type="text"
                placeholder="Brief summary of the issue..."
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "#f8fafc",
                  outline: "none",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Priority</label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "#f8fafc",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Detailed Description</label>
              <textarea
                placeholder="Explain the technical issue or questions in detail..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "#f8fafc",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
                rows="4"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={submittingRequest} 
              style={{
                backgroundColor: "#ff9900",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255,153,0,0.2)",
                marginTop: "0.5rem",
                width: "100%"
              }}
            >
              {submittingRequest ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>
      </Modal>

      {/* MODAL: VIEW TICKET DETAILS */}
      <Modal
        isOpen={openModal === "ViewTicket"}
        onClose={() => setOpenModal(null)}
        title="Support Request Details"
      >
        {selectedTicket && (
          <div style={{ padding: "4px 0", maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "1rem" }}>
              Request ID: <strong style={{ color: "#334155" }}>{selectedTicket.requestId}</strong>
            </div>

            <div style={{ marginBottom: "1.25rem", display: "flex", gap: "0.5rem" }}>
              <span style={styles.badge(getStatusColor(selectedTicket.status))}>
                {getStatusIcon(selectedTicket.status)}
                {selectedTicket.status}
              </span>
              <span style={styles.badge(selectedTicket.priority === "High" ? "#f44336" : "#475569")}>
                {selectedTicket.priority} Priority
              </span>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Subject</label>
              <p style={{ fontSize: "14px", color: "#1e293b", fontWeight: "600", margin: 0 }}>{selectedTicket.subject}</p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Description</label>
              <p style={{ fontSize: "13px", color: "#334155", whiteSpace: "pre-wrap", backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", margin: 0 }}>
                {selectedTicket.description}
              </p>
            </div>

            {selectedTicket.adminResponse && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <label style={{ fontSize: "11px", color: "#2e7d32", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Admin Official Response</label>
                <p style={{ fontSize: "13px", color: "#1b5e20", whiteSpace: "pre-wrap", backgroundColor: "#e8f5e9", padding: "10px 14px", borderRadius: "8px", border: "1px solid #c8e6c9", margin: 0, fontWeight: "500" }}>
                  {selectedTicket.adminResponse}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: LANGUAGE */}
      <Modal isOpen={openModal === "Language"} onClose={() => setOpenModal(null)} title="Select Language">
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
                  border: isSelected ? "2px solid #0066cc" : "1px solid #e2e8f0",
                  backgroundColor: isSelected ? "#f0f7ff" : "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <div style={{ fontWeight: isSelected ? "700" : "500", color: "#1e293b", fontSize: "14px" }}>
                    {lang.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{lang.native}</div>
                </div>
                {isSelected && <Check size={18} color="#0066cc" strokeWidth={2.5} />}
              </div>
            );
          })}
        </div>
      </Modal>

      {/* MODAL: PRIVACY */}
      <Modal isOpen={openModal === "Privacy"} onClose={() => setOpenModal(null)} title="Privacy & Security Settings">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Two-Factor Authentication (2FA)</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Require OTP code on sign-in</div>
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
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Profile Visibility to Mediators</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Allow assigned mediators to verify claimant identity</div>
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
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Sign out after 30 minutes of inactivity</div>
            </div>
            <button
              type="button"
              style={styles.toggleSwitch(sessionTimeout)}
              onClick={() => setSessionTimeout(!sessionTimeout)}
            >
              <div style={styles.toggleDot(sessionTimeout)} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSavePrivacy}
            style={{
              padding: "10px",
              backgroundColor: "#0066cc",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Save Privacy Settings
          </button>
        </div>
      </Modal>

      {/* MODAL: SUBSCRIPTION */}
      <Modal isOpen={openModal === "Subscription"} onClose={() => setOpenModal(null)} title="Claimant Account Privileges">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#0369a1" }}>Standard Claimant Access</span>
              <span style={{ backgroundColor: "#e0f2fe", color: "#0284c7", fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "12px" }}>
                Active
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "#334155", margin: "6px 0 0 0" }}>
              Authorized to file claims, submit evidence, and participate in digital arbitration sessions.
            </p>
          </div>

          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>Included Features:</div>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
              <li>Direct dispute filing against counterparties</li>
              <li>Attendance in Google Meet virtual hearings</li>
              <li>Digital awards & settlement enforcement documents</li>
              <li>Support tickets and case tracking dashboard</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setOpenModal(null)}
            style={{
              padding: "10px",
              backgroundColor: "#0066cc",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </Modal>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

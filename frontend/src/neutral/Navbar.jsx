import {
  Home,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  HelpCircle,
  MessageSquare,
  Calendar,
  FileUp,
  ChevronLeft,
  ChevronRight,
  Scale,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import "../components/Navbar.css";

export default function Navbar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile] = useState(window.innerWidth <= 480);
  const [isClick, setIsClick] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isClick && isMobile) {
      setIsOpen(false);
      setIsClick(false);
    }
  }, [isClick, isMobile, setIsOpen]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";
        const response = await fetch(`${API_BASE_URL}/claimant/data`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setData(data.data);
        } else {
          console.error("Failed to fetch admin data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };
    fetchAdminData();
  }, []);

  const menuItems = [
    {
      icon: Home,
      label: "Dashboard / Home",
      path: "/dashboard",
      color: "#3b82f6",
    },
    {
      icon: Bell,
      label: "Notifications",
      path: "/notifications",
      color: "#ef4444",
    },
    {
      icon: User,
      label: "Profile & Settings",
      path: "/profile",
      color: "#10b981",
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      path: "/help",
      color: "#eab308",
    },
    {
      icon: MessageSquare,
      label: "Real-Time Chat",
      path: "/communication",
      color: "#8b5cf6",
    },
    {
      icon: MessageSquare,
      label: "Assigned Cases",
      path: "/assigned-cases",
      color: "#06b6d4",
    },
    {
      icon: Calendar,
      label: "Schedule Hearings",
      path: "/schedule-hearings",
      color: "#8b5cf6",
    },
    {
      icon: FileUp,
      label: "Upload Awards & Notes",
      path: "/upload-awards",
      color: "#f97316",
    },
    {
      icon: Sparkles,
      label: "Legal AI Portal",
      path: "/legal-ai",
      color: "#ec4899",
    },
  ];

  const getIsActive = (itemPath) => {
    return location.pathname.includes(itemPath);
  };

  const handleLogOut = () => {
    toast.success("Logged out successfully!");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobile && isOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* Floating Toggle Button for Mobile */}
      {isMobile && (
        <button className="mobile-sidebar-trigger" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      {/* Sidebar Container */}
      <div
        className={`sidebar-container ${!isOpen && !isMobile ? "collapsed" : ""} ${
          isMobile && isOpen ? "mobile-open" : ""
        }`}
        style={{
          width: isMobile ? (isOpen ? "260px" : "0px") : (isOpen ? "260px" : "72px"),
        }}
      >
        {/* Logo Header */}
        <div className="sidebar-logo-header">
          <div className="logo-info">
            <div className="logo-icon-wrapper">
              <Scale size={20} />
            </div>
            <span className="logo-text">UTKAL ODR</span>
          </div>
          {!isMobile && (
            <button className="sidebar-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
        </div>

        {/* Menu Items */}
        <div className="sidebar-menu">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = getIsActive(item.path);
            return (
              <div
                key={index}
                className={`menu-item-link ${isActive ? "active" : ""}`}
                onClick={() => {
                  navigate(`/neutral${item.path}`);
                  setIsClick(true);
                }}
              >
                <IconComponent
                  size={20}
                  className="menu-item-icon"
                  style={{ color: item.color }}
                />
                <span className="menu-item-label">{item.label}</span>
                {!isOpen && !isMobile && (
                  <span className="sidebar-tooltip">{item.label}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile Info */}
        <div className="sidebar-profile">
          <div className="profile-avatar">
            {data && data.name ? getInitials(data.name) : <User size={14} />}
          </div>
          <div className="profile-info">
            <div className="profile-name" title={data && data.name}>
              {data && data.name}
            </div>
            <div className="profile-role">
              {data && data.user}
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="sidebar-logout">
          <button className="logout-btn" onClick={handleLogOut}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

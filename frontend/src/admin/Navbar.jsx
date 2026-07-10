import {
  Home,
  User,
  Users,
  FileText,
  CheckSquare,
  Settings,
  TrendingUp,
  Calendar,
  BarChart3,
  CreditCard,
  Headphones,
  Lock,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Scale,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import axiosInstance from "../api/axiosConfig";
import "../components/Navbar.css";

export default function Navbar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isClick, setIsClick] = useState(false);
  const [isMobile] = useState(window.innerWidth <= 480);
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
        const res = await axiosInstance.get("/admin/data");
        if (res.data.success) {
          setData(res.data.data);
        } else {
          console.error("Failed to fetch admin data:", res.data.message);
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
      icon: User,
      label: "Profile & Settings",
      path: "/profile",
      color: "#10b981",
    },
    {
      icon: Users,
      label: "Users Management",
      path: "/users",
      color: "#f97316",
    },
    {
      icon: FileText,
      label: "Case Management",
      path: "/cases",
      color: "#06b6d4",
    },
    {
      icon: CheckSquare,
      label: "Submitted Documents",
      path: "/documents",
      color: "#22c55e",
    },
    {
      icon: Settings,
      label: "Admin Controls",
      path: "/controls",
      color: "#8b5cf6",
    },
    {
      icon: TrendingUp,
      label: "Timeline / Events",
      path: "/timeline",
      color: "#f97316",
    },
    {
      icon: Calendar,
      label: "Schedule Hearings",
      path: "/hearings",
      color: "#3b82f6",
    },
    {
      icon: BarChart3,
      label: "Reports & Analytics",
      path: "/reports",
      color: "#eab308",
    },
    {
      icon: CreditCard,
      label: "Payment Management",
      path: "/payment",
      color: "#ec4899",
    },
    {
      icon: Headphones,
      label: "Service Requests",
      path: "/service",
      color: "#14b8a6",
    },
    {
      icon: MessageSquare,
      label: "Real-Time Chat",
      path: "/communication",
      color: "#6366f1",
    },
    {
      icon: Lock,
      label: "System Settings",
      path: "/system",
      color: "#854d0e",
    },
    {
      icon: Scale,
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
                  navigate(`/admin${item.path}`);
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

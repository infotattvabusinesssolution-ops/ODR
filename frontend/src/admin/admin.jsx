import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Dashboard from "./component/Dashboard";
import Notifications from "./component/Notifications";
import Profile from "./component/Profile";
import Users from "./component/Users";
import CaseManagement from "./component/CaseManagement";
import SubmittedDocuments from "./component/SubmittedDocuments";
import AdminControls from "./component/AdminControls";
import Timeline from "./component/Timeline";
import ScheduleHearings from "./component/ScheduleHearings";
import Reports from "./component/Reports";
import PaymentManagement from "./component/PaymentManagement";
import ServiceRequest from "./component/ServiceRequest";
import SystemSettings from "./component/SystemSettings";
import Communication from "./component/Communication";
import SayaCaseAssistant from "../components/SayaCaseAssistant";
import LegalAiHub from "../components/LegalAiHub";
import GoogleMeet from "../components/GoogleMeet/GoogleMeet";

export default function Admin() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  const location = useLocation();
  const isMeetRoute = location.pathname.includes("/meet") || location.pathname.includes("/online-meeting");

  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "admin") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.add("admin-layout-active");
    document.documentElement.classList.add("admin-layout-active");
    return () => {
      document.body.classList.remove("admin-layout-active");
      document.documentElement.classList.remove("admin-layout-active");
    };
  }, []);

  const Styles = {
    container: {
      display: "flex",
      height: "100vh",
      width: "100%",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflow: "hidden",
    },
    main: {
      flex: 1,
      marginLeft: isMobile ? "0" : sidebarOpen ? "260px" : "72px",
      overflowY: "auto",
      overflowX: "hidden",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      paddingBottom: "80px",
      transition: "margin-left 0.3s ease",
      backgroundColor: "#f5f5f5",
      width: isMobile ? "100%" : "auto",
      minWidth: 0,
    },
  };

  return (
    <>
      <div style={Styles.container} className="admin-container" data-admin-root>
        <Navbar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main style={Styles.main} className="admin-main">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="users" element={<Users />} />
            <Route path="cases" element={<CaseManagement />} />
            <Route path="documents" element={<SubmittedDocuments />} />
            <Route path="controls" element={<AdminControls />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="hearings" element={<ScheduleHearings />} />
            <Route path="sessions" element={<ScheduleHearings />} />
            <Route path="meet" element={<GoogleMeet />} />
            <Route path="google-meet" element={<GoogleMeet />} />
            <Route path="online-meeting" element={<GoogleMeet />} />
            <Route path="reports" element={<Reports />} />
            <Route path="payment" element={<PaymentManagement />} />
            <Route path="service" element={<ServiceRequest />} />
            <Route path="system" element={<SystemSettings />} />
            <Route path="communication" element={<Communication />} />
            <Route path="legal-ai" element={<LegalAiHub />} />
          </Routes>
          <SayaCaseAssistant />
        </main>
      </div>
      
    </>
  );
}

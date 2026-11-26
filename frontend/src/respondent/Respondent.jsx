import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Dashboard from "./components/Dashboard";
import Notifications from "./components/Notifications";
import Profile from "./components/Profile";
import Help from "./components/Help";
import CaseDetails from "./components/CaseDetails";
import OnlineMeeting from "./components/OnlineMeeting";
import GoogleMeet from "../components/GoogleMeet/GoogleMeet";
import Documents from "./components/Documents";
import Events from "./components/Events";
import Payments from "./components/Payments";
import Communication from "./components/Communication";
import SayaCaseAssistant from "../components/SayaCaseAssistant";

export default function Respondent() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "respondent") {
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

  const Styles = {
    container: {
      display: "flex",
      height: "100vh",
      width: "100%",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    main: {
      flex: 1,
      marginLeft: isMobile ? "0" : sidebarOpen ? "260px" : "72px",
      overflow: "auto",
      paddingBottom: "80px",
      transition: "margin-left 0.3s ease",
      backgroundColor: "#f5f5f5",
      width: isMobile ? "100%" : "auto",
      minWidth: 0,
    },
  };

  return (
    <div style={Styles.container}>
      <Navbar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main style={Styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="help" element={<Help />} />
          <Route path="case-details" element={<CaseDetails />} />
          <Route path="online-meeting" element={<GoogleMeet />} />
          <Route path="documents" element={<Documents />} />
          <Route path="events" element={<Events />} />
          <Route path="payments" element={<Payments />} />
          <Route path="communication" element={<Communication />} />

          <Route
            path="*"
            element={
              <div>
                <h1>404</h1>
                <br />
                <p>Page Not Found</p>
              </div>
            }
          />
        </Routes>
        <SayaCaseAssistant />
      </main>
    </div>
  );
}

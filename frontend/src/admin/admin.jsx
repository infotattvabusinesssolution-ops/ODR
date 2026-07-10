import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

export default function Admin() {
  const [sidebarOpen, setSidebarOpen] = useState();
  const [isMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

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
    },
  };

  return (
    <>
      <div style={Styles.container}>
        <Navbar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main style={Styles.main}>
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

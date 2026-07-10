import {
  FileCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCircle,
  Briefcase,
  ClipboardCheck,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  Video,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import axiosInstance from "../../api/axiosConfig";

export default function Dashboard() {
  const [isMobile] = useState(window.innerWidth <= 480);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [neutralInfo, setNeutralInfo] = useState({ name: "Neutral", email: "" });
  const [stats, setStats] = useState({
    totalAssigned: 0,
    activeCases: 0,
    pendingCases: 0,
    completedCases: 0,
    totalHearings: 0,
    scheduledHearings: 0,
    completedHearings: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    verifiedDocuments: 0,
  });
  const [caseDistribution, setCaseDistribution] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [upcomingHearings, setUpcomingHearings] = useState([]);

  const neutralId = localStorage.getItem("userId");

  const fetchDashboardData = useCallback(async () => {
    if (!neutralId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/neutral/dashboard-stats/${neutralId}`);
      if (res.data?.success) {
        setNeutralInfo(res.data.neutral || { name: "Neutral", email: "" });
        setStats(res.data.stats || {});
        setCaseDistribution(res.data.caseDistribution || []);
        setRecentCases(res.data.recentCases || []);
        setUpcomingHearings(res.data.upcomingHearings || []);
      }
    } catch (err) {
      console.error("Neutral dashboard fetch error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [neutralId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const COLORS = ["#2196f3", "#ff9800", "#4caf50", "#f44336"];

  const getStatusBadge = (status) => {
    const map = {
      Active: { bg: "#e3f2fd", color: "#1565c0" },
      Verified: { bg: "#e8f5e9", color: "#2e7d32" },
      Pending: { bg: "#fff3e0", color: "#e65100" },
      Completed: { bg: "#e8f5e9", color: "#1b5e20" },
      Closed: { bg: "#f3e5f5", color: "#6a1b9a" },
      Scheduled: { bg: "#e3f2fd", color: "#0d47a1" },
      Rejected: { bg: "#ffebee", color: "#c62828" },
    };
    const s = map[status] || { bg: "#f5f5f5", color: "#666" };
    return {
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: "700",
      backgroundColor: s.bg,
      color: s.color,
      textTransform: "capitalize",
    };
  };

  const styles = {
    container: {
      padding: isMobile ? "1rem" : "2rem",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    },
    welcomeCard: {
      background: "linear-gradient(135deg, #ff9900 0%, #e68a00 100%)",
      color: "#fff",
      padding: isMobile ? "1.3rem" : "1.5rem 2rem",
      borderRadius: "14px",
      marginBottom: isMobile ? "1rem" : "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      boxShadow: "0 4px 15px rgba(255,153,0,0.25)",
    },
    welcomeIcon: {
      backgroundColor: "rgba(255,255,255,0.2)",
      width: isMobile ? "50px" : "56px",
      height: isMobile ? "50px" : "56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "12px",
      flexShrink: 0,
    },
    welcomeContent: { flex: 1 },
    welcomeTitle: { fontSize: isMobile ? "18px" : "22px", fontWeight: "700", marginBottom: "2px" },
    welcomeSubtitle: { fontSize: "13px", opacity: 0.9 },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: isMobile ? "0.75rem" : "1rem",
      marginBottom: isMobile ? "1rem" : "1.5rem",
    },
    statCard: (borderColor) => ({
      backgroundColor: "#fff",
      padding: isMobile ? "1rem" : "1.25rem",
      borderRadius: "12px",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      borderLeft: `4px solid ${borderColor}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
    }),
    statNumber: { fontSize: isMobile ? "22px" : "28px", fontWeight: "800", color: "#1e293b" },
    statLabel: { fontSize: "12px", color: "#64748b", fontWeight: "500" },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: isMobile ? "1rem" : "1.25rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      marginBottom: "1.5rem",
    },
    twoCol: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "1.5rem",
      marginBottom: "1.5rem",
    },
    caseRow: {
      display: "flex",
      gap: "12px",
      padding: "12px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      marginBottom: "10px",
      transition: "background-color 0.2s",
      alignItems: "flex-start",
    },
    hearingRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 12px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      marginBottom: "8px",
      gap: "12px",
      flexWrap: "wrap",
    },
    refreshBtn: {
      background: "none",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "6px 10px",
      cursor: "pointer",
      color: "#64748b",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
      fontWeight: "600",
    },
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh", gap: "12px" }}>
        <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "#ff9900" }} />
        <p style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Loading neutral dashboard...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: "12px" }}>
        <AlertCircle size={40} color="#ef4444" />
        <p style={{ fontSize: "14px", color: "#ef4444", fontWeight: "600" }}>{error}</p>
        <button onClick={fetchDashboardData} style={{ ...styles.refreshBtn, color: "#ff9900", borderColor: "#ff9900" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Welcome Card */}
      <div style={styles.welcomeCard}>
        <div style={styles.welcomeIcon}>
          <UserCircle size={30} />
        </div>
        <div style={styles.welcomeContent}>
          <div style={styles.welcomeTitle}>Welcome, {neutralInfo.name || "Neutral"}</div>
          <div style={styles.welcomeSubtitle}>{neutralInfo.email} · Neutral Arbiter Dashboard</div>
        </div>
        <button onClick={fetchDashboardData} style={{ ...styles.refreshBtn, color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#2196f3")}>
          <Briefcase size={isMobile ? 22 : 28} color="#2196f3" />
          <div style={styles.statNumber}>{stats.totalAssigned}</div>
          <div style={styles.statLabel}>Assigned Cases</div>
        </div>
        <div style={styles.statCard("#ff9800")}>
          <Clock size={isMobile ? 22 : 28} color="#ff9800" />
          <div style={styles.statNumber}>{stats.activeCases}</div>
          <div style={styles.statLabel}>Active / In Progress</div>
        </div>
        <div style={styles.statCard("#4caf50")}>
          <CheckCircle size={isMobile ? 22 : 28} color="#4caf50" />
          <div style={styles.statNumber}>{stats.completedCases}</div>
          <div style={styles.statLabel}>Resolved</div>
        </div>
        <div style={styles.statCard("#9c27b0")}>
          <Calendar size={isMobile ? 22 : 28} color="#9c27b0" />
          <div style={styles.statNumber}>{stats.scheduledHearings}</div>
          <div style={styles.statLabel}>Scheduled Hearings</div>
        </div>
        <div style={styles.statCard("#00bcd4")}>
          <FileText size={isMobile ? 22 : 28} color="#00bcd4" />
          <div style={styles.statNumber}>{stats.totalDocuments}</div>
          <div style={styles.statLabel}>Documents</div>
        </div>
        <div style={styles.statCard("#e91e63")}>
          <ClipboardCheck size={isMobile ? 22 : 28} color="#e91e63" />
          <div style={styles.statNumber}>{stats.pendingCases}</div>
          <div style={styles.statLabel}>Pending Review</div>
        </div>
      </div>

      {/* Two Column: Case Distribution Chart + Upcoming Hearings */}
      <div style={styles.twoCol}>
        {/* Case Distribution Pie Chart */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            <Briefcase size={18} color="#1e293b" /> Case Distribution
          </div>
          {caseDistribution.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={caseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {caseDistribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8", fontSize: "13px" }}>
              No case data available yet
            </div>
          )}
        </div>

        {/* Upcoming Hearings */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            <Calendar size={18} color="#1e293b" /> Upcoming Hearings
          </div>
          {upcomingHearings.length > 0 ? (
            upcomingHearings.map((h, idx) => (
              <div key={idx} style={styles.hearingRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "2px" }}>
                    {h.caseId || h.caseName || "Hearing"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {h.date} · {h.time} · {h.Judge || "TBD"}
                  </div>
                </div>
                <span style={getStatusBadge(h.status)}>{h.status}</span>
                {h.status === "Scheduled" && h.meetLink && (
                  <a
                    href={h.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#fff",
                      backgroundColor: "#2196f3",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      textDecoration: "none",
                    }}
                  >
                    <Video size={12} /> Join
                  </a>
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8", fontSize: "13px" }}>
              No upcoming hearings scheduled
            </div>
          )}
        </div>
      </div>

      {/* Recent Assigned Cases */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <AlertCircle size={18} color="#ff5555" /> Recent Assigned Cases
        </div>
        {recentCases.length > 0 ? (
          recentCases.map((c, idx) => (
            <div
              key={idx}
              style={styles.caseRow}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
            >
              <div style={{ fontSize: "28px", flexShrink: 0 }}>⚖️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
                  {c.caseId || `Case #${idx + 1}`}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.6" }}>
                  <div>{c.DisputeName || c.DisputeType || "Dispute"}</div>
                  <div>
                    {c.claimant?.name || c.CustomersName || "Claimant"} vs{" "}
                    {c.respondent?.name || c.oppositePartyName || "Respondent"}
                  </div>
                  <div>Filed: {c.createdAt}</div>
                </div>
              </div>
              <span style={getStatusBadge(c.status)}>{c.status}</span>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8", fontSize: "13px" }}>
            No cases assigned yet
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

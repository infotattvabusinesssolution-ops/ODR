import {
  Users,
  Briefcase,
  Calendar,
  AlertCircle,
  UserCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import axiosInstance from "../../api/axiosConfig";

export default function Dashboard() {
  const [isMobile] = useState(window.innerWidth <= 480);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time state metrics
  const [allData, setAllData] = useState({ totalUsers: 0, totalActive: 0, totalInactive: 0 });
  const [data, setData] = useState({ name: "Admin", email: "", user: "Admin" });
  const [upcomingHearings, setUpcomingHearings] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [caseDistribution, setCaseDistribution] = useState([]);
  const [monthlyCases, setMonthlyCases] = useState([]);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/admin/dashboard-stats");
      if (response.data?.success) {
        setAllData(response.data.totals);
        setData(response.data.adminProfile);
        setUpcomingHearings(response.data.upcomingHearings);
        setUserGrowth(response.data.userGrowth);
        setCaseDistribution(response.data.caseDistribution);
        setMonthlyCases(response.data.monthlyCases);
      }
    } catch (err) {
      console.error("Error fetching dashboard statistics:", err);
      setError("Failed to compile dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const pieColors = ["#7B5CFF", "#5AC8FA", "#FF2D55", "#34C759"];

  const styles = {
    container: {
      padding: isMobile ? "1rem" : "2rem",
      backgroundColor: "#f5f5f5",
    },
    welcomeCard: {
      backgroundColor: "#ff9900",
      color: "#fff",
      padding: isMobile ? "1.3rem 1.8rem" : "2rem",
      borderRadius: "12px",
      marginBottom: isMobile ? "1rem" : "2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
    },
    welcomeIcon: {
      fontSize: "40px",
      backgroundColor: "rgba(255,255,255,0.2)",
      width: isMobile ? "50px" : "60px",
      height: isMobile ? "50px" : "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
    },
    iconWrapper: {
      display: "flex",
      alignItems: "center",
    },
    welcomeContent: {
      flex: 1,
      textAlign: "center",
    },
    welcomeTitle: {
      fontSize: isMobile ? "22px" : "24px",
      fontWeight: "bold",
      marginBottom: "0.25rem",
    },
    welcomeSubtitle: {
      fontSize: isMobile ? "17px" : "16px",
      opacity: 0.9,
      textTransform: "capitalize",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr 1fr 1fr"
        : "repeat(auto-fit, minmax(200px, 1fr))",
      gap: isMobile ? "0.5rem" : "1.5rem",
      marginBottom: isMobile ? "1rem" : "2rem",
    },
    statCard: {
      backgroundColor: "#fff",
      padding: isMobile ? "1rem" : "2rem",
      borderRadius: "12px",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.2rem",
    },
    statNumber: {
      fontSize: "clamp(20px, 4vw, 28px)",
      fontWeight: "bold",
      color: "#333",
    },
    statLabel: {
      fontSize: "12px",
      color: "#999",
    },
    hearingsSection: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      marginTop: "2rem",
    },
    hearingsHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "1.5rem",
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333",
    },
    hearingIcon: {
      color: "#ff5555",
    },
    hearingCard: {
      display: "flex",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: "#f9f0ff",
      borderRadius: "8px",
      marginBottom: "1rem",
      transition: "background-color 0.2s ease",
    },
    hearingIcon2: {
      fontSize: "32px",
      color: "#ff9900",
      flexShrink: 0,
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "300px",
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      color: "#666",
      gap: "12px",
      padding: "2rem"
    }
  };

  return (
    <div style={styles.container}>
      {/* Welcome Card */}
      <div style={styles.welcomeCard}>
        <div style={styles.welcomeIcon}>
          <span style={styles.iconWrapper}>
            <UserCircle size={35} />
          </span>
        </div>
        <div style={styles.welcomeContent}>
          <div style={styles.welcomeTitle}>Welcome, {data?.name || "Admin"}</div>
          <div style={styles.welcomeSubtitle}>
            {data?.role || "Admin"} Dashboard
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Users size={isMobile ? 25 : 40} color="#0066cc" />
          <div>
            <div style={styles.statNumber}>{loading ? "..." : allData.totalUsers}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <Users size={isMobile ? 25 : 40} color="#22bb33" />
          <div>
            <div style={styles.statNumber}>{loading ? "..." : allData.totalActive}</div>
            <div style={styles.statLabel}>Active Users</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <Users size={isMobile ? 25 : 40} color="#ff5555" />
          <div>
            <div style={styles.statNumber}>{loading ? "..." : allData.totalInactive}</div>
            <div style={styles.statLabel}>Inactive Users</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "#ff9900" }} />
          <p>Compiling dashboard reports metrics...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={{ ...styles.loadingContainer, color: "#f44336" }}>
          <span>⚠️ {error}</span>
          <button style={{ ...styles.statCard, border: "1px solid #ddd", padding: "8px 16px", cursor: "pointer", borderRadius: "6px" }} onClick={fetchDashboardStats}>Retry</button>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
            {/* User Growth Line Chart */}
            <div className="bg-white shadow-xl rounded-2xl" style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "15px" }}>User Growth</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={userGrowth}>
                  <defs>
                    <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8A5CFF" />
                      <stop offset="100%" stopColor="#4DA6FF" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="url(#userGrowthGradient)"
                    strokeWidth={4}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Case Distribution Pie */}
            <div className="bg-white shadow-xl p-6 rounded-2xl" style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "15px" }}>Case Distribution</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={caseDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label
                  >
                    {caseDistribution.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Cases Bar */}
            <div className="bg-white shadow-xl p-6 rounded-2xl lg:col-span-2" style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", gridColumn: isMobile ? "auto" : "span 2" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "15px" }}>Monthly Cases Overview</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyCases}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <defs>
                    <linearGradient id="casesGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FF6FD8" />
                      <stop offset="100%" stopColor="#6F00FF" />
                    </linearGradient>
                  </defs>
                  <Bar
                    dataKey="cases"
                    fill="url(#casesGradient)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Hearings Section */}
          <div style={styles.hearingsSection}>
            <div style={styles.hearingsHeader}>
              <AlertCircle size={24} style={styles.hearingIcon} />
              Upcoming Hearings
            </div>

            {upcomingHearings.length > 0 ? (
              upcomingHearings.map((hearing, index) => (
                <div
                  key={index}
                  style={styles.hearingCard}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0e8ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f9f0ff")}
                >
                  <div style={styles.hearingIcon2}>⚖️</div>
                  <div>
                    <div style={{ fontWeight: "700", color: "#2d3748" }}>Case: {hearing.id}</div>
                    <div style={{ color: "#4a5568", fontSize: "13px", marginTop: "2px" }}>
                      {hearing.date} · {hearing.time}
                    </div>
                    <div style={{ color: "#718096", fontSize: "12px" }}>{hearing.location}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: "13px", color: "#888", fontStyle: "italic" }}>No upcoming hearings scheduled.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

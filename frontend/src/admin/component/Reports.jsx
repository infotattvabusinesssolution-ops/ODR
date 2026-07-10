import { BarChart3, TrendingUp, Users, FileText, Clock, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import axiosInstance from "../../api/axiosConfig";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live state statistics
  const [stats, setStats] = useState({ totalCases: 0, totalDocs: 0, activeUsers: 0, completionRate: "0%" });
  const [usersByRole, setUsersByRole] = useState([]);
  const [casesByStatus, setCasesByStatus] = useState([]);
  const [documentsStatus, setDocumentsStatus] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState([]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/admin/reports-analytics");
      if (response.data?.success) {
        setStats(response.data.stats);
        setUsersByRole(response.data.usersByRole);
        setCasesByStatus(response.data.casesByStatus);
        setDocumentsStatus(response.data.documentsStatus);
        setMonthlyActivity(response.data.monthlyActivity);
      }
    } catch (err) {
      console.error("Fetch analytics failed:", err);
      setError("Failed to load real-time system metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const styles = {
    container: {
      padding: "clamp(1rem, 5vw, 2rem)",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
      maxWidth: "1400px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#ff9800",
      color: "#fff",
      padding: "clamp(1rem, 3vw, 1.5rem)",
      borderRadius: "8px",
      marginBottom: "2rem",
      flexWrap: "wrap",
    },
    headerTitle: {
      fontSize: "clamp(18px, 5vw, 24px)",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    refreshBtn: {
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      color: "#fff",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "13px",
      fontWeight: "600",
    },
    tabsContainer: {
      display: "flex",
      gap: "0.5rem",
      marginBottom: "2rem",
      flexWrap: "wrap",
    },
    tab: (isActive) => ({
      padding: "0.75rem 1.5rem",
      border: "none",
      borderRadius: "6px",
      backgroundColor: isActive ? "#ff9800" : "#fff",
      color: isActive ? "#fff" : "#666",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: isActive ? "0 2px 8px rgba(255,152,0,0.2)" : "0 1px 3px rgba(0,0,0,0.08)",
    }),
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem",
    },
    statCard: (color) => ({
      backgroundColor: "#fff",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      borderTop: `3px solid ${color}`,
      textAlign: "center",
    }),
    statValue: {
      fontSize: "clamp(24px, 5vw, 32px)",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.5rem",
    },
    statLabel: {
      fontSize: "13px",
      color: "#999",
      fontWeight: "600",
    },
    chartsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "2rem",
      marginBottom: "2rem",
    },
    chartCard: {
      backgroundColor: "#fff",
      padding: "clamp(1.5rem, 3vw, 2rem)",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    },
    chartTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "1.5rem",
    },
    legendContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "1rem",
      marginTop: "1.5rem",
    },
    legendItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "13px",
    },
    legendColor: (color) => ({
      width: "12px",
      height: "12px",
      borderRadius: "3px",
      backgroundColor: color,
      flexShrink: 0,
    }),
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "400px",
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      color: "#666",
      gap: "12px"
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>
          <BarChart3 size={24} />
          Reports & Analytics
        </span>
        <button style={styles.refreshBtn} onClick={fetchAnalyticsData} disabled={loading}>
          <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          style={styles.tab(activeTab === "overview")}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          style={styles.tab(activeTab === "detailed")}
          onClick={() => setActiveTab("detailed")}
        >
          Detailed
        </button>
        <button
          style={styles.tab(activeTab === "trends")}
          onClick={() => setActiveTab("trends")}
        >
          Trends
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#ff9800")}>
          <div style={styles.statValue}>{loading ? "..." : stats.totalCases}</div>
          <div style={styles.statLabel}>Total Cases</div>
        </div>
        <div style={styles.statCard("#2196f3")}>
          <div style={styles.statValue}>{loading ? "..." : stats.totalDocs}</div>
          <div style={styles.statLabel}>Documents</div>
        </div>
        <div style={styles.statCard("#4caf50")}>
          <div style={styles.statValue}>{loading ? "..." : stats.activeUsers}</div>
          <div style={styles.statLabel}>Active Users</div>
        </div>
        <div style={styles.statCard("#f44336")}>
          <div style={styles.statValue}>{loading ? "..." : stats.completionRate}</div>
          <div style={styles.statLabel}>Completion Rate</div>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "#ff9800" }} />
          <p>Compiling real-time dashboard analytics...</p>
        </div>
      ) : error ? (
        <div style={{ ...styles.loadingContainer, color: "#f44336" }}>
          <span>⚠️ {error}</span>
          <button style={styles.refreshBtn} onClick={fetchAnalyticsData}>Retry</button>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          {activeTab === "overview" && (
            <div style={styles.chartsGrid}>
              {/* Users by Role - Pie Chart */}
              <div style={styles.chartCard}>
                <div style={styles.chartTitle}>Users by Role</div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usersByRole}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {usersByRole.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "6px" }}
                      formatter={(value) => [value, "Count"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={styles.legendContainer}>
                  {usersByRole.map((item) => (
                    <div key={item.name} style={styles.legendItem}>
                      <div style={styles.legendColor(item.color)} />
                      <span>{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cases by Status - Bar Chart */}
              <div style={styles.chartCard}>
                <div style={styles.chartTitle}>Cases by Status</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={casesByStatus} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "6px" }}
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    />
                    <Bar dataKey="value" fill="#2196f3" radius={[8, 8, 0, 0]}>
                      {casesByStatus.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Documents Status - Pie Chart */}
              <div style={styles.chartCard}>
                <div style={styles.chartTitle}>Documents Status</div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={documentsStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {documentsStatus.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "6px" }}
                      formatter={(value) => [value, "Count"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={styles.legendContainer}>
                  {documentsStatus.map((item) => (
                    <div key={item.name} style={styles.legendItem}>
                      <div style={styles.legendColor(item.color)} />
                      <span>{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Tab */}
          {activeTab === "detailed" && (
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>System Database Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2.5rem" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#ff9800", borderBottom: "2px solid #ff980022", paddingBottom: "6px", marginBottom: "1rem" }}>Cases Status Registry</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {casesByStatus.map((item) => (
                      <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#555", fontWeight: "500" }}>{item.label} Cases</span>
                        <span style={{ fontWeight: "700", color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#2196f3", borderBottom: "2px solid #2196f322", paddingBottom: "6px", marginBottom: "1rem" }}>Submitted Documents Registry</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {documentsStatus.map((item) => (
                      <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#555", fontWeight: "500" }}>{item.name} Files</span>
                        <span style={{ fontWeight: "700", color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>Monthly Database Growth & Uploads Trend</div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyActivity} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "6px" }}
                    cursor={{ stroke: "#ccc" }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cases" 
                    name="Cases Created"
                    stroke="#ff9800" 
                    strokeWidth={3}
                    dot={{ fill: "#ff9800", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="documents" 
                    name="Documents Uploaded"
                    stroke="#2196f3" 
                    strokeWidth={3}
                    dot={{ fill: "#2196f3", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    name="New Users Joined"
                    stroke="#4caf50" 
                    strokeWidth={3}
                    dot={{ fill: "#4caf50", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

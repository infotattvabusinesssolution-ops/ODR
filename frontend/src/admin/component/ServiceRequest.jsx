import { Search, Eye, MessageSquare, Trash2, AlertCircle, CheckCircle, Clock, X, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosConfig";

export default function ServiceRequest() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [viewModal, setViewModal] = useState(null);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("In Progress");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== "All") params.status = filterStatus;

      const response = await axiosInstance.get("/api/service-requests", { params });
      if (response.data?.success) {
        setRequests(response.data.data);
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Fetch service requests error:", err);
      setError("Failed to load service requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus, fetchRequests]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await axiosInstance.put(`/api/service-requests/${replyModal._id}/respond`, {
        adminResponse: replyText,
        status: replyStatus,
      });
      setReplyModal(null);
      setReplyText("");
      setReplyStatus("In Progress");
      fetchRequests();
    } catch (err) {
      console.error("Reply error:", err);
      alert("Failed to send response.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/service-requests/${id}`);
      setDeleteConfirm(null);
      fetchRequests();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete request.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosInstance.put(`/api/service-requests/${id}/status`, { status: newStatus });
      fetchRequests();
    } catch (err) {
      console.error("Status update error:", err);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "#f44336";
      case "Medium": return "#ff9800";
      case "Low": return "#4caf50";
      default: return "#999";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved": return <CheckCircle size={16} />;
      case "In Progress": return <Clock size={16} />;
      case "Pending": return <AlertCircle size={16} />;
      default: return null;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const styles = {
    container: {
      padding: "clamp(1rem, 5vw, 2rem)",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
      maxWidth: "1400px",
      margin: "0 auto",
    },
    heading: {
      fontSize: "clamp(24px, 5vw, 32px)",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
    },
    refreshBtn: {
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "13px",
      fontWeight: "600",
      color: "#555",
    },
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
    controlsContainer: {
      display: "flex",
      gap: "1rem",
      marginBottom: "2rem",
      flexWrap: "wrap",
      alignItems: "center",
    },
    searchContainer: {
      flex: 1,
      minWidth: "250px",
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    searchInput: {
      width: "100%",
      padding: "0.75rem 1rem 0.75rem 2.5rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    },
    searchIcon: {
      position: "absolute",
      left: "0.75rem",
      color: "#999",
      pointerEvents: "none",
    },
    filterContainer: {
      display: "flex",
      gap: "0.75rem",
      flexWrap: "wrap",
    },
    filterButton: (isActive) => ({
      padding: "0.75rem 1.25rem",
      border: "1px solid #ddd",
      borderRadius: "6px",
      backgroundColor: isActive ? "#2196f3" : "#fff",
      color: isActive ? "#fff" : "#333",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: isActive ? "0 2px 8px rgba(33,150,243,0.2)" : "0 1px 3px rgba(0,0,0,0.08)",
    }),
    tableContainer: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      overflow: "hidden",
    },
    tableWrapper: { overflowX: "auto", minWidth: 0 },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "1100px" },
    thead: { backgroundColor: "#f5f5f5", borderBottom: "2px solid #e0e0e0" },
    th: {
      padding: "1rem",
      textAlign: "left",
      fontSize: "13px",
      fontWeight: "600",
      color: "#666",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    tr: { borderBottom: "1px solid #f0f0f0", transition: "background-color 0.2s ease" },
    td: { padding: "1rem", fontSize: "14px", color: "#333" },
    statusBadge: (color) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 0.75rem",
      borderRadius: "6px",
      backgroundColor: `${color}15`,
      color: color,
      fontSize: "12px",
      fontWeight: "600",
      width: "fit-content",
    }),
    priorityBadge: (color) => ({
      display: "inline-flex",
      alignItems: "center",
      padding: "0.4rem 0.6rem",
      borderRadius: "4px",
      backgroundColor: `${color}15`,
      color: color,
      fontSize: "11px",
      fontWeight: "700",
      textTransform: "uppercase",
      width: "fit-content",
    }),
    actionsCell: { display: "flex", gap: "0.5rem", alignItems: "center" },
    actionButton: (bgColor) => ({
      padding: "0.5rem",
      borderRadius: "6px",
      border: "none",
      backgroundColor: `${bgColor}15`,
      color: bgColor,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
    }),
    emptyState: { textAlign: "center", padding: "3rem 2rem", color: "#999" },
    loadingContainer: { textAlign: "center", padding: "4rem 2rem", color: "#999" },
    // Modal styling
    modalOverlay: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "2rem",
      maxWidth: "600px",
      width: "90%",
      maxHeight: "80vh",
      overflowY: "auto",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem",
    },
    modalTitle: { fontSize: "18px", fontWeight: "700", color: "#333" },
    modalCloseBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#999",
      padding: "4px",
    },
    modalLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#999",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "0.35rem",
    },
    modalValue: { fontSize: "14px", color: "#333", marginBottom: "1.25rem", lineHeight: "1.5" },
    modalTextarea: {
      width: "100%",
      padding: "0.75rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      minHeight: "100px",
      resize: "vertical",
      fontFamily: "inherit",
      marginBottom: "1rem",
    },
    modalSelect: {
      width: "100%",
      padding: "0.75rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      marginBottom: "1rem",
      cursor: "pointer",
    },
    modalSubmitBtn: {
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#2196f3",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    modalDeleteBtn: {
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#f44336",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      marginRight: "0.5rem",
    },
    modalCancelBtn: {
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      color: "#333",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.heading}>
        <span>Service Requests</span>
        <button style={styles.refreshBtn} onClick={fetchRequests}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#2196f3")}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Requests</div>
        </div>
        <div style={styles.statCard("#ff9800")}>
          <div style={styles.statValue}>{stats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard("#03a9f4")}>
          <div style={styles.statValue}>{stats.inProgress}</div>
          <div style={styles.statLabel}>In Progress</div>
        </div>
        <div style={styles.statCard("#4caf50")}>
          <div style={styles.statValue}>{stats.resolved}</div>
          <div style={styles.statLabel}>Resolved</div>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controlsContainer}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by Request ID, User, Subject, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterContainer}>
          {["All", "Resolved", "In Progress", "Pending"].map((status) => (
            <button
              key={status}
              style={styles.filterButton(filterStatus === status)}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: "1rem", fontSize: "14px" }}>Loading service requests...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>⚠️</div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#666", marginBottom: "0.5rem" }}>{error}</div>
            <button style={{ ...styles.refreshBtn, margin: "0 auto" }} onClick={fetchRequests}>Retry</button>
          </div>
        ) : requests.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr style={styles.tr}>
                  <th style={styles.th}>Request ID</th>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Priority</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request._id}
                    style={styles.tr}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fafafa"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <td style={{ ...styles.td, fontWeight: "600", color: "#2196f3" }}>
                      {request.requestId}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontWeight: "600", color: "#333" }}>{request.userName}</span>
                        <span style={{ fontSize: "12px", color: "#999" }}>{request.userEmail}</span>
                        <span style={{ fontSize: "11px", color: "#8b5cf6", textTransform: "capitalize" }}>{request.userRole}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, fontWeight: "500", color: "#555", maxWidth: "250px" }}>
                      {request.subject}
                    </td>
                    <td style={styles.td}>{formatDate(request.createdAt)}</td>
                    <td style={styles.td}>
                      <div style={styles.statusBadge(getStatusColor(request.status))}>
                        {getStatusIcon(request.status)}
                        <span>{request.status}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.priorityBadge(getPriorityColor(request.priority))}>
                        {request.priority}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionsCell}>
                        <button
                          style={styles.actionButton("#2196f3")}
                          title="View Details"
                          onClick={() => setViewModal(request)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          style={styles.actionButton("#4caf50")}
                          title="Reply to Request"
                          onClick={() => {
                            setReplyModal(request);
                            setReplyText(request.adminResponse || "");
                            setReplyStatus(request.status === "Pending" ? "In Progress" : request.status);
                          }}
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button
                          style={styles.actionButton("#f44336")}
                          title="Delete Request"
                          onClick={() => setDeleteConfirm(request)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🔍</div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#666", marginBottom: "0.5rem" }}>No Service Requests Found</div>
            <div style={{ fontSize: "14px", color: "#999" }}>
              Try adjusting your search or filter criteria
            </div>
          </div>
        )}
      </div>

      {/* VIEW DETAIL MODAL */}
      {viewModal && (
        <div style={styles.modalOverlay} onClick={() => setViewModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>📋 Request Details — {viewModal.requestId}</div>
              <button style={styles.modalCloseBtn} onClick={() => setViewModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalLabel}>Submitted By</div>
            <div style={styles.modalValue}>
              {viewModal.userName} ({viewModal.userEmail}) — <span style={{ textTransform: "capitalize", color: "#8b5cf6" }}>{viewModal.userRole}</span>
            </div>

            <div style={styles.modalLabel}>Subject</div>
            <div style={styles.modalValue}>{viewModal.subject}</div>

            <div style={styles.modalLabel}>Description</div>
            <div style={{ ...styles.modalValue, whiteSpace: "pre-wrap", backgroundColor: "#f8f9fa", padding: "1rem", borderRadius: "8px" }}>
              {viewModal.description}
            </div>

            <div style={{ display: "flex", gap: "2rem" }}>
              <div>
                <div style={styles.modalLabel}>Status</div>
                <div style={styles.statusBadge(getStatusColor(viewModal.status))}>
                  {getStatusIcon(viewModal.status)}
                  <span>{viewModal.status}</span>
                </div>
              </div>
              <div>
                <div style={styles.modalLabel}>Priority</div>
                <div style={styles.priorityBadge(getPriorityColor(viewModal.priority))}>
                  {viewModal.priority}
                </div>
              </div>
              <div>
                <div style={styles.modalLabel}>Submitted On</div>
                <div style={{ fontSize: "14px", color: "#333" }}>{formatDate(viewModal.createdAt)}</div>
              </div>
            </div>

            {viewModal.adminResponse && (
              <div style={{ marginTop: "1.5rem" }}>
                <div style={styles.modalLabel}>Admin Response</div>
                <div style={{ ...styles.modalValue, whiteSpace: "pre-wrap", backgroundColor: "#e8f5e9", padding: "1rem", borderRadius: "8px", borderLeft: "4px solid #4caf50" }}>
                  {viewModal.adminResponse}
                </div>
                {viewModal.respondedAt && (
                  <div style={{ fontSize: "12px", color: "#999" }}>Responded on: {formatDate(viewModal.respondedAt)}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPLY MODAL */}
      {replyModal && (
        <div style={styles.modalOverlay} onClick={() => setReplyModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>💬 Reply to {replyModal.requestId}</div>
              <button style={styles.modalCloseBtn} onClick={() => setReplyModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalLabel}>Subject</div>
            <div style={styles.modalValue}>{replyModal.subject}</div>

            <div style={styles.modalLabel}>User Description</div>
            <div style={{ ...styles.modalValue, whiteSpace: "pre-wrap", backgroundColor: "#f8f9fa", padding: "0.75rem", borderRadius: "8px", fontSize: "13px" }}>
              {replyModal.description}
            </div>

            <div style={styles.modalLabel}>Update Status</div>
            <select
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value)}
              style={styles.modalSelect}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <div style={styles.modalLabel}>Your Response</div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response to the user..."
              style={styles.modalTextarea}
            />

            <button
              style={{ ...styles.modalSubmitBtn, opacity: submitting ? 0.7 : 1 }}
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
            >
              {submitting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <MessageSquare size={16} />}
              {submitting ? "Sending..." : "Send Response"}
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...styles.modalContent, maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>🗑️ Confirm Delete</div>
              <button style={styles.modalCloseBtn} onClick={() => setDeleteConfirm(null)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: "14px", color: "#555", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              Are you sure you want to delete service request <strong>{deleteConfirm.requestId}</strong> from <strong>{deleteConfirm.userName}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button style={styles.modalCancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={{ ...styles.modalDeleteBtn, marginLeft: "0.5rem" }} onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

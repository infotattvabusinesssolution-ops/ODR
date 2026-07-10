import { Search, Eye, Download, Trash2, CheckCircle, Clock, XCircle, Loader2, RefreshCw, X, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosConfig";

export default function PaymentManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: "0.00", totalCount: 0, completedCount: 0, pendingCount: 0, failedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openModal, setOpenModal] = useState(null); // 'view' or 'status'
  const [statusToUpdate, setStatusToUpdate] = useState("Pending");
  const [updating, setUpdating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== "All") params.status = filterStatus;

      const response = await axiosInstance.get("/api/payments", { params });
      if (response.data?.success) {
        setPayments(response.data.data);
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      setError("Failed to load payment transactions.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 450);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus, fetchPayments]);

  const handleUpdateStatus = async () => {
    if (!selectedPayment) return;
    setUpdating(true);
    try {
      const response = await axiosInstance.put(`/api/payments/${selectedPayment._id}/status`, {
        status: statusToUpdate,
      });
      if (response.data?.success) {
        setOpenModal(null);
        fetchPayments();
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePayment = async (id) => {
    try {
      const response = await axiosInstance.delete(`/api/payments/${id}`);
      if (response.data?.success) {
        setDeleteConfirm(null);
        fetchPayments();
      }
    } catch (err) {
      console.error("Delete payment error:", err);
      alert("Failed to delete record.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "#4caf50";
      case "Pending": return "#ff9800";
      case "Failed": return "#f44336";
      default: return "#999";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed": return <CheckCircle size={16} />;
      case "Pending": return <Clock size={16} />;
      case "Failed": return <XCircle size={16} />;
      default: return null;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const handleDownloadReceipt = (payment) => {
    // Generate a simple print version or text receipt download
    const receiptText = `
========================================
       UTKAL ODR SYSTEM RECEIPT
========================================
Receipt Date  : ${new Date(payment.createdAt).toLocaleDateString()}
Transaction ID: ${payment.transactionId}
Claimant/User : ${payment.userName}
Email Address : ${payment.userEmail}
----------------------------------------
Payment Method: ${payment.method}
Total Amount  : ₹${payment.amount.toFixed(2)}
Payment Status: ${payment.status}
========================================
Thank you for your ODR Portal Transaction.
    `;
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt_${payment.transactionId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
      fontSize: "clamp(22px, 4vw, 28px)",
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
    table: { width: "100%", borderCollapse: "collapse", minWidth: "1000px" },
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
      cursor: "pointer"
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
      maxWidth: "500px",
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
      display: "block"
    },
    modalValue: { fontSize: "14px", color: "#333", marginBottom: "1.25rem", lineHeight: "1.5" },
    modalSelect: {
      width: "100%",
      padding: "0.75rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      marginBottom: "1.5rem",
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
      justifyContent: "center",
      width: "100%"
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
    modalDeleteBtn: {
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#f44336",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.heading}>
        <span>Payment Management</span>
        <button style={styles.refreshBtn} onClick={fetchPayments}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#2196f3")}>
          <div style={styles.statValue}>₹{parseFloat(stats.totalRevenue).toLocaleString("en-IN")}</div>
          <div style={styles.statLabel}>Total Collected (INR)</div>
        </div>
        <div style={styles.statCard("#4caf50")}>
          <div style={styles.statValue}>{stats.completedCount}</div>
          <div style={styles.statLabel}>Completed Volume</div>
        </div>
        <div style={styles.statCard("#ff9800")}>
          <div style={styles.statValue}>{stats.pendingCount}</div>
          <div style={styles.statLabel}>Pending Verification</div>
        </div>
        <div style={styles.statCard("#f44336")}>
          <div style={styles.statValue}>{stats.failedCount}</div>
          <div style={styles.statLabel}>Declined / Failed</div>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controlsContainer}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by Transaction ID, User, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterContainer}>
          {["All", "Completed", "Pending", "Failed"].map((status) => (
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
            <p style={{ marginTop: "1rem", fontSize: "14px" }}>Loading transactions...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>⚠️</div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#666", marginBottom: "0.5rem" }}>{error}</div>
            <button style={{ ...styles.refreshBtn, margin: "0 auto" }} onClick={fetchPayments}>Retry</button>
          </div>
        ) : payments.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr style={styles.tr}>
                  <th style={styles.th}>Txn ID</th>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment._id}
                    style={styles.tr}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fafafa"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <td style={{ ...styles.td, fontWeight: "600", color: "#2196f3" }}>
                      {payment.transactionId}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontWeight: "600", color: "#333" }}>{payment.userName}</span>
                        <span style={{ fontSize: "12px", color: "#999" }}>{payment.userEmail}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, fontWeight: "700", color: "#2196f3" }}>
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={styles.td}>{payment.method}</td>
                    <td style={styles.td}>{formatDate(payment.createdAt)}</td>
                    <td style={styles.td}>
                      <div 
                        style={styles.statusBadge(getStatusColor(payment.status))}
                        title="Click to Change Status"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setStatusToUpdate(payment.status);
                          setOpenModal("status");
                        }}
                      >
                        {getStatusIcon(payment.status)}
                        <span>{payment.status}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionsCell}>
                        <button
                          style={styles.actionButton("#2196f3")}
                          title="View Details"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setOpenModal("view");
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          style={styles.actionButton("#4caf50")}
                          title="Download Receipt"
                          onClick={() => handleDownloadReceipt(payment)}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          style={styles.actionButton("#f44336")}
                          title="Delete Record"
                          onClick={() => setDeleteConfirm(payment)}
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
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#666", marginBottom: "0.5rem" }}>No Transactions Found</div>
            <div style={{ fontSize: "14px", color: "#999" }}>
              Try adjusting your search filters.
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {openModal === "view" && selectedPayment && (
        <div style={styles.modalOverlay} onClick={() => setOpenModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>📄 Payment Transaction Audit</div>
              <button style={styles.modalCloseBtn} onClick={() => setOpenModal(null)}>
                <X size={20} />
              </button>
            </div>

            <label style={styles.modalLabel}>Transaction ID</label>
            <div style={styles.modalValue}><strong style={{ color: "#2196f3" }}>{selectedPayment.transactionId}</strong></div>

            <label style={styles.modalLabel}>Client / Payer</label>
            <div style={styles.modalValue}>{selectedPayment.userName} ({selectedPayment.userEmail})</div>

            <label style={styles.modalLabel}>Transaction Amount</label>
            <div style={{ ...styles.modalValue, fontSize: "16px", fontWeight: "700", color: "#2196f3" }}>
              ₹{selectedPayment.amount.toLocaleString("en-IN")}
            </div>

            <label style={styles.modalLabel}>Payment Gateway Method</label>
            <div style={styles.modalValue}>{selectedPayment.method}</div>

            <label style={styles.modalLabel}>Processed On</label>
            <div style={styles.modalValue}>{formatDate(selectedPayment.createdAt)}</div>

            <label style={styles.modalLabel}>Gateway Status</label>
            <div style={styles.statusBadge(getStatusColor(selectedPayment.status))}>
              {getStatusIcon(selectedPayment.status)}
              <span>{selectedPayment.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {openModal === "status" && selectedPayment && (
        <div style={styles.modalOverlay} onClick={() => setOpenModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>⚙️ Update Status — {selectedPayment.transactionId}</div>
              <button style={styles.modalCloseBtn} onClick={() => setOpenModal(null)}>
                <X size={20} />
              </button>
            </div>

            <label style={styles.modalLabel}>Update Gateway Status</label>
            <select
              value={statusToUpdate}
              onChange={(e) => setStatusToUpdate(e.target.value)}
              style={styles.modalSelect}
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>

            <button
              style={{ ...styles.modalSubmitBtn, opacity: updating ? 0.7 : 1 }}
              onClick={handleUpdateStatus}
              disabled={updating}
            >
              {updating ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />}
              Save Status Changes
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
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
              Are you sure you want to void and remove payment record <strong>{deleteConfirm.transactionId}</strong> from <strong>{deleteConfirm.userName}</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button style={styles.modalCancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={styles.modalDeleteBtn} onClick={() => handleDeletePayment(deleteConfirm._id)}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

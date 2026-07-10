import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Plus,
} from "lucide-react";
import { useState } from "react";

export default function Payments() {
  const [isMobile] = useState(window.innerWidth <= 480);
  const [payments] = useState([
    {
      id: 1,
      caseId: "2024-45",
      caseTitle: "Smith vs. Johnson",
      amount: "₹5,000",
      dueDate: "25 Sep 2025",
      status: "Paid",
      statusColor: "#22bb33",
      paymentDate: "20 Sep 2025",
      paymentMethod: "Credit Card",
      transactionId: "TXN-2024-001",
    },
    {
      id: 2,
      caseId: "2024-52",
      caseTitle: "ABC Corp vs. XYZ Ltd",
      amount: "₹7,500",
      dueDate: "30 Sep 2025",
      status: "Pending",
      statusColor: "#ff9900",
      paymentDate: null,
      paymentMethod: null,
      transactionId: null,
    },
    {
      id: 3,
      caseId: "2024-48",
      caseTitle: "Estate of Brown",
      amount: "₹3,500",
      dueDate: "28 Sep 2025",
      status: "Overdue",
      statusColor: "#ff5555",
      paymentDate: null,
      paymentMethod: null,
      transactionId: null,
    },
    {
      id: 4,
      caseId: "2024-42",
      caseTitle: "Contract Dispute",
      amount: "₹4,200",
      dueDate: "15 Sep 2025",
      status: "Paid",
      statusColor: "#22bb33",
      paymentDate: "14 Sep 2025",
      paymentMethod: "Net Banking",
      transactionId: "TXN-2024-002",
    },
  ]);

  const paidPayments = payments.filter((p) => p.status === "Paid");
  const pendingPayments = payments.filter((p) => p.status === "Pending");
  const overduePayments = payments.filter((p) => p.status === "Overdue");

  const totalPaid = paidPayments.length;
  const totalPending = pendingPayments.length;
  const totalOverdue = overduePayments.length;

  const styles = {
    container: {
      padding: isMobile ? "1rem" : "2rem",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      backgroundColor: "#ff9900",
      color: "#fff",
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      marginBottom: isMobile ? "1rem" : "2rem",
      fontSize: "18px",
      fontWeight: "600",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
      gap: "1rem",
      marginBottom: "2rem",
    },
    statCard: (color) => ({
      backgroundColor: "#fff",
      padding: "1rem",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      borderLeft: `4px solid ${color}`,
      textAlign: "center",
    }),
    statIcon: {
      fontSize: "28px",
      marginBottom: "0.5rem",
      display: "flex",
      justifyContent: "center",
    },
    statNumber: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.25rem",
    },
    statLabel: {
      fontSize: "13px",
      color: "#666",
      fontWeight: "500",
    },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#333",
      marginTop: "2rem",
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    paymentsList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      marginBottom: "2rem",
    },
    paymentCard: (statusColor) => ({
      display: "flex",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      borderLeft: `4px solid ${statusColor}`,
      transition: "all 0.3s ease",
      flexWrap: isMobile ? "wrap" : "nowrap",
    }),
    paymentInfo: {
      flex: 1,
    },
    paymentTitle: {
      fontSize: "15px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.25rem",
    },
    paymentCaseId: {
      fontSize: "12px",
      color: "#999",
      marginBottom: "0.5rem",
    },
    paymentDetails: {
      display: "flex",
      gap: "1rem",
      flexWrap: "wrap",
      fontSize: "12px",
      color: "#666",
    },
    paymentAmount: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333",
      textAlign: "right",
      flexShrink: 0,
    },
    statusBadge: (color) => ({
      display: "inline-block",
      padding: "0.35rem 0.75rem",
      backgroundColor: color + "22",
      color: color,
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
    }),
    paymentActions: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
      flexShrink: 0,
    },
    actionButton: (bgColor) => ({
      padding: "0.5rem",
      backgroundColor: bgColor + "22",
      color: bgColor,
      border: "1px solid " + bgColor + "33",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
    }),
    emptyState: {
      textAlign: "center",
      padding: "2rem 1rem",
      color: "#999",
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <CreditCard size={24} />
        Payments (Pending/Paid Cases)
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#22bb33")}>
          <div style={styles.statIcon}>✓</div>
          <div style={styles.statNumber}>{totalPaid}</div>
          <div style={styles.statLabel}>Payments Paid</div>
        </div>

        <div style={styles.statCard("#ff9900")}>
          <div style={styles.statIcon}>⏳</div>
          <div style={styles.statNumber}>{totalPending}</div>
          <div style={styles.statLabel}>Pending Payments</div>
        </div>

        <div style={styles.statCard("#ff5555")}>
          <div style={styles.statIcon}>⚠️</div>
          <div style={styles.statNumber}>{totalOverdue}</div>
          <div style={styles.statLabel}>Overdue Payments</div>
        </div>
      </div>

      {/* Paid Payments */}
      <div>
        <div style={styles.sectionTitle}>
          <CheckCircle size={20} color="#22bb33" />
          Paid Payments ({totalPaid})
        </div>
        {paidPayments.length > 0 ? (
          <div style={styles.paymentsList}>
            {paidPayments.map((payment) => (
              <div
                key={payment.id}
                style={styles.paymentCard(payment.statusColor)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.paymentInfo}>
                  <div style={styles.paymentTitle}>{payment.caseTitle}</div>
                  <div style={styles.paymentCaseId}>Case #{payment.caseId}</div>
                  <div style={styles.paymentDetails}>
                    <span style={styles.statusBadge(payment.statusColor)}>
                      {payment.status}
                    </span>
                    <span>Paid on {payment.paymentDate}</span>
                    <span>•</span>
                    <span>{payment.paymentMethod}</span>
                  </div>
                </div>
                <div style={styles.paymentAmount}>{payment.amount}</div>
                <div style={styles.paymentActions}>
                  <button
                    style={styles.actionButton("#0066cc")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#0066cc33";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#0066cc22";
                    }}
                    title="View Receipt"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    style={styles.actionButton("#22bb33")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#22bb3333";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#22bb3322";
                    }}
                    title="Download Receipt"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>No paid payments</div>
        )}
      </div>

      {/* Pending Payments */}
      <div>
        <div style={styles.sectionTitle}>
          <Clock size={20} color="#ff9900" />
          Pending Payments ({totalPending})
        </div>
        {pendingPayments.length > 0 ? (
          <div style={styles.paymentsList}>
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                style={styles.paymentCard(payment.statusColor)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.paymentInfo}>
                  <div style={styles.paymentTitle}>{payment.caseTitle}</div>
                  <div style={styles.paymentCaseId}>Case #{payment.caseId}</div>
                  <div style={styles.paymentDetails}>
                    <span style={styles.statusBadge(payment.statusColor)}>
                      {payment.status}
                    </span>
                    <span>Due on {payment.dueDate}</span>
                  </div>
                </div>
                <div style={styles.paymentAmount}>{payment.amount}</div>
                <div style={styles.paymentActions}>
                  <button
                    style={{
                      ...styles.actionButton("#22bb33"),
                      flex: 1,
                      minWidth: "100px",
                      gap: "0.5rem",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#22bb3333";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#22bb3322";
                    }}
                  >
                    <Plus size={16} />
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>No pending payments</div>
        )}
      </div>

      {/* Overdue Payments */}
      <div>
        <div style={styles.sectionTitle}>
          <AlertCircle size={20} color="#ff5555" />
          Overdue Payments ({totalOverdue})
        </div>
        {overduePayments.length > 0 ? (
          <div style={styles.paymentsList}>
            {overduePayments.map((payment) => (
              <div
                key={payment.id}
                style={styles.paymentCard(payment.statusColor)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.paymentInfo}>
                  <div style={styles.paymentTitle}>{payment.caseTitle}</div>
                  <div style={styles.paymentCaseId}>Case #{payment.caseId}</div>
                  <div style={styles.paymentDetails}>
                    <span style={styles.statusBadge(payment.statusColor)}>
                      {payment.status}
                    </span>
                    <span>Was due on {payment.dueDate}</span>
                  </div>
                </div>
                <div style={styles.paymentAmount}>{payment.amount}</div>
                <div style={styles.paymentActions}>
                  <button
                    style={{
                      ...styles.actionButton("#ff5555"),
                      flex: 1,
                      minWidth: "100px",
                      gap: "0.5rem",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#ff555533";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ff555522";
                    }}
                  >
                    <Plus size={16} />
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>No overdue payments</div>
        )}
      </div>
    </div>
  );
}

import { 
  HelpCircle, Mail, Phone, MessageCircle, ChevronRight,
  Plus, RefreshCw, Clock, CheckCircle, AlertCircle, Loader2, X
} from "lucide-react";
import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosConfig";

export default function Help() {
  const [isMobile] = useState(window.innerWidth <= 480);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Service Request states
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [openModal, setOpenModal] = useState(null); // 'SubmitTicket' or 'ViewTicket'
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "Medium"
  });

  // Fetch My Service Requests
  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await axiosInstance.get("/api/service-requests/my");
      if (response.data?.success) {
        setMyRequests(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching neutral requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return;

    setSubmittingRequest(true);
    try {
      const response = await axiosInstance.post("/api/service-requests", newTicket);
      if (response.data?.success) {
        setOpenModal(null);
        setNewTicket({ subject: "", description: "", priority: "Medium" });
        fetchMyRequests();
      }
    } catch (err) {
      console.error("Error submitting ticket:", err);
      alert("Failed to submit support ticket.");
    } finally {
      setSubmittingRequest(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved": return <CheckCircle size={14} />;
      case "In Progress": return <Clock size={14} />;
      case "Pending": return <AlertCircle size={14} />;
      default: return null;
    }
  };

  const faqs = [
    {
      id: 1,
      question: "What are my responsibilities as a neutral?",
      answer:
        "As a neutral arbiter, you are responsible for reviewing case submissions from both claimant and respondent, scheduling and conducting fair hearings, and providing impartial judgments based on the evidence presented.",
    },
    {
      id: 2,
      question: "How do I access assigned cases?",
      answer:
        "All assigned cases appear in the 'Assigned Cases Overview' section. You can view case details, submissions, and manage hearings from your dashboard.",
    },
    {
      id: 3,
      question: "How do I scrutinize submissions?",
      answer:
        "Navigate to 'Scrutinize Submissions' to review documents and statements from both parties. You can make notes, request additional documents, or reject submissions if they don't meet requirements.",
    },
    {
      id: 4,
      question: "Can I reschedule hearings?",
      answer:
        "Yes, you can reschedule hearings from the 'Schedule & Manage Hearings' section. You can propose new dates and times, and communicate with involved parties.",
    },
    {
      id: 5,
      question: "How do I upload awards and judgments?",
      answer:
        "Use the 'Upload Orders / Awards / Notes' section to submit your final judgments, orders, and any additional notes. These will be automatically shared with both parties.",
    },
  ];

  const contactMethods = [
    {
      id: 1,
      icon: Mail,
      title: "Email Support",
      description: "support@odrcourtapp.com",
      color: "#0066cc",
    },
    {
      id: 2,
      icon: Phone,
      title: "Phone Support",
      description: "+91 9876543210",
      color: "#22bb33",
    },
    {
      id: 3,
      icon: MessageCircle,
      title: "Live Chat",
      description: "Available Mon-Fri, 9 AM - 6 PM",
      color: "#ff9900",
      whatsapp: true,
      link: "https://wa.me/919876543210",
    },
  ];

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
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333",
      marginTop: "2rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    contactGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "1.5rem",
      marginBottom: "2rem",
    },
    contactCard: (color) => ({
      backgroundColor: "#fff",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      border: `2px solid ${color}22`,
      textAlign: "center",
      transition: "all 0.3s ease",
      cursor: "pointer",
    }),
    contactIcon: {
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      backgroundColor: "rgba(255,153,0,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 1rem",
      fontSize: "28px",
    },
    contactTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "0.5rem",
    },
    contactDescription: {
      fontSize: "14px",
      color: "#666",
    },
    faqContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    faqItem: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      overflow: "hidden",
    },
    faqHeader: (isExpanded) => ({
      padding: "1rem",
      cursor: "pointer",
      backgroundColor: isExpanded ? "#ff990011" : "#fff",
      border: `1px solid ${isExpanded ? "#ff9900" : "#eee"}`,
      borderRadius: isExpanded ? "8px 8px 0 0" : "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      transition: "all 0.3s ease",
    }),
    faqQuestion: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333",
      flex: 1,
      textAlign: "left",
    },
    faqChevron: (isExpanded) => ({
      color: "#ff9900",
      transition: "transform 0.3s ease",
      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
    }),
    faqAnswer: {
      padding: "1rem",
      backgroundColor: "#f9f9f9",
      fontSize: "14px",
      color: "#666",
      lineHeight: "1.6",
      borderTop: "1px solid #eee",
    },
    // Service Requests List Styling
    ticketCard: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "0.75rem",
      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderLeft: "4px solid #cbd5e1"
    },
    badge: (color) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      padding: "0.35rem 0.6rem",
      borderRadius: "6px",
      backgroundColor: `${color}15`,
      color: color,
      fontSize: "11px",
      fontWeight: "600"
    }),
    submitBtn: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.25rem",
      backgroundColor: "#ff9900",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(255,153,0,0.2)",
      marginBottom: "1rem"
    },
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
    modalTitle: { fontSize: "16px", fontWeight: "700", color: "#333" },
    modalCloseBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#999",
      padding: "4px",
    },
    modalLabel: {
      fontSize: "11px",
      fontWeight: "600",
      color: "#999",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "0.35rem",
      display: "block"
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
    modalInput: {
      width: "100%",
      padding: "0.75rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
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
      backgroundColor: "#ff9900",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%"
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <HelpCircle size={24} />
        Help & Support
      </div>

      {/* Contact Methods */}
      <div>
        <div style={styles.sectionTitle}>Get in Touch</div>
        <div style={styles.contactGrid}>
          {contactMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <div
                key={method.id}
                style={styles.contactCard(method.color)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.contactIcon}>
                  <IconComponent size={28} color={method.color} />
                </div>

                <div style={styles.contactTitle}>{method.title}</div>

                <div style={styles.contactDescription}>
                  {method.description}
                </div>

                {method.whatsapp && (
                  <button
                    style={{
                      marginTop: "1rem",
                      backgroundColor: "#25D366",
                      color: "#fff",
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                    onClick={() => window.open(method.link, "_blank")}
                  >
                    Chat on WhatsApp
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support & Service Tickets Section */}
      <div>
        <div style={styles.sectionTitle}>Support & Service Tickets</div>
        <button style={styles.submitBtn} onClick={() => setOpenModal("SubmitTicket")}>
          <Plus size={18} />
          Create Support Request
        </button>

        {loadingRequests ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : myRequests.length > 0 ? (
          <div style={{ marginBottom: "2rem" }}>
            {myRequests.map((req) => (
              <div 
                key={req._id} 
                style={{ ...styles.ticketCard, borderLeftColor: getStatusColor(req.status) }}
                onClick={() => { setSelectedTicket(req); setOpenModal("ViewTicket"); }}
                onMouseEnter={(e) => { e.currentTarget.style.cursor = "pointer"; e.currentTarget.style.backgroundColor = "#fafafa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px", color: "#333" }}>{req.subject}</div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "0.25rem" }}>
                    Request ID: <strong>{req.requestId}</strong> | Priority: <strong>{req.priority}</strong>
                  </div>
                </div>
                <div style={styles.badge(getStatusColor(req.status))}>
                  {getStatusIcon(req.status)}
                  <span>{req.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#888", fontStyle: "italic", marginBottom: "2rem" }}>
            You haven't submitted any support requests yet.
          </p>
        )}
      </div>

      {/* FAQs Section */}
      <div>
        <div style={styles.sectionTitle}>Frequently Asked Questions</div>
        <div style={styles.faqContainer}>
          {faqs.map((faq) => (
            <div key={faq.id} style={styles.faqItem}>
              <div
                style={styles.faqHeader(expandedFaq === faq.id)}
                onClick={() =>
                  setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                }
                onMouseEnter={(e) => {
                  if (expandedFaq !== faq.id) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (expandedFaq !== faq.id) {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }
                }}
              >
                <span style={styles.faqQuestion}>{faq.question}</span>
                <ChevronRight
                  size={20}
                  style={styles.faqChevron(expandedFaq === faq.id)}
                />
              </div>

              {expandedFaq === faq.id && (
                <div style={styles.faqAnswer}>{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: SUBMIT SUPPORT REQUEST */}
      {openModal === "SubmitTicket" && (
        <div style={styles.modalOverlay} onClick={() => setOpenModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>New Support Request</div>
              <button style={styles.modalCloseBtn} onClick={() => setOpenModal(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTicketSubmit}>
              <label style={styles.modalLabel}>Subject</label>
              <input
                type="text"
                placeholder="Brief summary of the issue..."
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                style={styles.modalInput}
                required
              />

              <label style={styles.modalLabel}>Priority</label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                style={styles.modalSelect}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <label style={styles.modalLabel}>Detailed Description</label>
              <textarea
                placeholder="Explain the technical issue or questions in detail..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                style={styles.modalTextarea}
                required
              />

              <button type="submit" style={styles.modalSubmitBtn} disabled={submittingRequest}>
                {submittingRequest ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW TICKET DETAILS */}
      {openModal === "ViewTicket" && selectedTicket && (
        <div style={styles.modalOverlay} onClick={() => setOpenModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>Request Details — {selectedTicket.requestId}</div>
              <button style={styles.modalCloseBtn} onClick={() => setOpenModal(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: "1.25rem" }}>
              <span style={styles.badge(getStatusColor(selectedTicket.status))}>
                {getStatusIcon(selectedTicket.status)}
                {selectedTicket.status}
              </span>
              <span style={{ ...styles.badge(selectedTicket.priority === "High" ? "#f44336" : "#777"), marginLeft: "0.5rem" }}>
                {selectedTicket.priority} Priority
              </span>
            </div>

            <label style={styles.modalLabel}>Subject</label>
            <div style={styles.modalValue}>{selectedTicket.subject}</div>

            <label style={styles.modalLabel}>Description</label>
            <div style={{ ...styles.modalValue, whiteSpace: "pre-wrap", backgroundColor: "#f8f9fa", padding: "0.75rem", borderRadius: "6px" }}>
              {selectedTicket.description}
            </div>

            {selectedTicket.adminResponse ? (
              <div style={{ marginTop: "1rem", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
                <label style={{ fontSize: "11px", color: "#2e7d32", fontWeight: "600", textTransform: "uppercase" }}>Admin Response</label>
                <p style={{ fontSize: "13px", color: "#2e7d32", whiteSpace: "pre-wrap", backgroundColor: "#e8f5e9", padding: "0.75rem", borderRadius: "6px", marginTop: "0.25rem", borderLeft: "4px solid #4caf50" }}>
                  {selectedTicket.adminResponse}
                </p>
              </div>
            ) : (
              <div style={{ marginTop: "1rem", fontSize: "12px", color: "#777", fontStyle: "italic" }}>
                Pending response from our administration team.
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

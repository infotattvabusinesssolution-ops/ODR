import { HelpCircle, Mail, Phone, MessageCircle, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Help() {
  const [isMobile] = useState(window.innerWidth <= 480);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I file a response to a case?",
      answer:
        "To file a response, navigate to Case Details/Submissions section. Click on the case you need to respond to and follow the submission wizard. Ensure all required documents are attached before submitting.",
    },
    {
      id: 2,
      question: "What documents are required for a hearing?",
      answer:
        "Required documents include proof of identity, case details, supporting evidence, and any previously submitted documents. Check your case page for the specific document checklist.",
    },
    {
      id: 3,
      question: "How can I reschedule a hearing?",
      answer:
        "To reschedule, go to Events & Schedule, find your hearing, and click the reschedule option. Submit your request with a valid reason. The court will send confirmation within 2 business days.",
    },
    {
      id: 4,
      question: "What payment methods are accepted?",
      answer:
        "We accept all major credit/debit cards, net banking, UPI, and digital wallets. Visit the Payments section to view all available payment options.",
    },
    {
      id: 5,
      question: "How do I access online hearings?",
      answer:
        "Online hearings can be accessed from the Online Meeting/Hearing section. You'll receive a link and meeting ID in your notifications 24 hours before the scheduled hearing.",
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
                onClick={() => {
                  // ✅ ONLY CTA ADDED — WHATSAPP FOR LIVE CHAT
                  if (method.title === "Live Chat") {
                    const phoneNumber = "919876543210"; // change your number
                    const message = "Hello, I need support regarding my case.";
                    window.open(
                      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
                        message
                      )}`,
                      "_blank"
                    );
                  }
                }}
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
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
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
    </div>
  );
}

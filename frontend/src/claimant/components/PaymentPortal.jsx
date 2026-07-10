import { Menu, CreditCard, Loader2, RefreshCw, CheckCircle, Clock, XCircle, FileText, Check, ShieldCheck, Lock, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosConfig";
import "./PaymentPortal.css";

export default function PaymentPortal() {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [loading, setLoading] = useState(false);
  
  // Payment history states
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Sandbox Modal states
  const [showSandbox, setShowSandbox] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: ""
  });
  const [sandboxSubmitting, setSandboxSubmitting] = useState(false);

  const fetchPaymentHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await axiosInstance.get("/api/payments/my");
      if (response.data?.success) {
        setHistory(response.data.data);
      }
    } catch (err) {
      console.error("Error loading payment logs:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Handle URL redirect query verification on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const sessionId = params.get("session_id");
    const amountVal = params.get("amount");
    const methodVal = params.get("method");

    if (status === "success" && sessionId) {
      const verifySession = async () => {
        try {
          const response = await axiosInstance.post("/api/payments/verify-checkout-session", {
            sessionId,
            amount: amountVal,
            method: methodVal
          });
          if (response.data?.success) {
            alert("Stripe Payment verified and recorded successfully!");
          }
        } catch (err) {
          console.error("Session verification failed:", err);
        } finally {
          // Clear query params to keep URL clean
          window.history.replaceState({}, document.title, window.location.pathname);
          fetchPaymentHistory();
        }
      };
      verifySession();
    } else if (status === "cancel") {
      alert("Stripe checkout cancelled.");
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchPaymentHistory();
    } else {
      fetchPaymentHistory();
    }
  }, [fetchPaymentHistory]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/payments/create-checkout-session", {
        amount,
        method: paymentMethod
      });

      if (response.data?.success) {
        if (response.data.sandbox) {
          // No Stripe key configured -> Show Sandbox Form Modal
          setShowSandbox(true);
        } else if (response.data.url) {
          // Redirect to Stripe Hosted Checkout
          window.location.href = response.data.url;
        }
      }
    } catch (err) {
      console.error("Stripe Checkout error:", err);
      // Fallback directly to sandbox if Stripe fails
      setShowSandbox(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxSubmit = async (e) => {
    e.preventDefault();
    setSandboxSubmitting(true);

    // Simulate gateway delay
    setTimeout(async () => {
      try {
        const mockSessionId = "cs_sandbox_" + Math.random().toString(36).substring(2, 10).toUpperCase();
        const response = await axiosInstance.post("/api/payments/verify-checkout-session", {
          sessionId: mockSessionId,
          amount,
          method: paymentMethod
        });

        if (response.data?.success) {
          alert(`Sandbox Card Payment of ₹${amount} succeeded! Receipt registered.`);
          setShowSandbox(false);
          setAmount("");
          setCardDetails({ number: "", expiry: "", cvc: "", name: "" });
          fetchPaymentHistory();
        }
      } catch (err) {
        console.error("Sandbox save error:", err);
        alert("Failed to record sandbox transaction.");
      } finally {
        setSandboxSubmitting(false);
      }
    }, 1500);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Completed": return "#4caf50";
      case "Pending": return "#ff9800";
      case "Failed": return "#f44336";
      default: return "#cbd5e1";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed": return <CheckCircle size={14} />;
      case "Pending": return <Clock size={14} />;
      case "Failed": return <XCircle size={14} />;
      default: return null;
    }
  };

  const styles = {
    modalOverlay: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "#fff",
      borderRadius: "16px",
      padding: "24px",
      maxWidth: "460px",
      width: "90%",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      border: "1px solid #e2e8f0"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px"
    },
    stripeLogo: {
      fontSize: "20px",
      fontWeight: "800",
      color: "#635bff",
      fontStyle: "italic",
      letterSpacing: "-0.5px"
    },
    closeBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#94a3b8"
    },
    creditCardMock: {
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      color: "#fff",
      padding: "20px",
      borderRadius: "12px",
      marginBottom: "20px",
      position: "relative",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    },
    cardDetailsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginTop: "12px"
    },
    sandboxInput: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "6px",
      fontSize: "14px",
      outline: "none",
      marginTop: "4px"
    },
    sandboxLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: "#475569"
    },
    sandboxBtn: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#635bff",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      marginTop: "20px"
    }
  };

  return (
    <div className="payment-container">
      {/* Header */}
      <div className="payment-header">
        <span className="menu-icon">
          <Menu size={24} />
        </span>
        <h2>Payment Portal</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth <= 768 ? "1fr" : "1fr 1.5fr", gap: "20px", alignItems: "start" }}>
        
        {/* Payment Form Wrapper */}
        <div className="payment-form-wrapper" style={{ margin: "0" }}>
          <form onSubmit={handlePaymentSubmit} className="payment-form">
            {/* Amount Input */}
            <div className="form-group">
              <label>Enter Amount (INR)</label>
              <input
                type="number"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
                min="1"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            {/* Payment Method Selection */}
            <div className="form-group">
              <label>Select Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-select"
                disabled={loading}
              >
                <option value="Credit Card">Credit Card (Stripe)</option>
                <option value="Debit Card">Debit Card (Stripe)</option>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Wallet">Wallet</option>
              </select>
            </div>

            {/* Payment Summary */}
            <div className="payment-summary">
              <div className="summary-header">
                <CreditCard size={20} />
                <span>Payment Summary</span>
              </div>
              <div className="summary-content">
                <div className="summary-item">
                  <span>Method:</span>
                  <span>{paymentMethod}</span>
                </div>
                <div className="summary-item">
                  <span>Amount:</span>
                  <span>₹{amount || "0.00"}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="pay-btn" disabled={!amount || loading}>
              {loading ? (
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <CreditCard size={20} />
              )}
              {loading ? "Initializing..." : "Pay via Stripe"}
            </button>
          </form>
        </div>

        {/* Payment Transaction Ledger */}
        <div className="payment-form-wrapper" style={{ margin: "0", maxWidth: "100%" }}>
          <div style={{ display: "flex", justifySpaceBetween: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#2d3748", margin: 0 }}>
              Transaction History
            </h3>
            <button 
              onClick={fetchPaymentHistory} 
              style={{ background: "none", border: "none", cursor: "pointer", color: "#4a5568", display: "flex", alignItems: "center", gap: "4px" }}
              title="Refresh ledger"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {loadingHistory ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <Loader2 size={30} style={{ animation: "spin 1s linear infinite", color: "#ff8c00" }} />
            </div>
          ) : history.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #edf2f7", textAlign: "left", color: "#718096" }}>
                    <th style={{ padding: "8px" }}>Transaction ID</th>
                    <th style={{ padding: "8px" }}>Amount</th>
                    <th style={{ padding: "8px" }}>Method</th>
                    <th style={{ padding: "8px" }}>Status</th>
                    <th style={{ padding: "8px" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item._id} style={{ borderBottom: "1px solid #edf2f7" }}>
                      <td style={{ padding: "10px 8px", fontWeight: "600", color: "#2b6cb0" }}>{item.transactionId}</td>
                      <td style={{ padding: "10px 8px", fontWeight: "700" }}>₹{item.amount.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px 8px", color: "#4a5568" }}>{item.method}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "4px", 
                          fontSize: "11px", 
                          fontWeight: "700",
                          padding: "3px 6px",
                          borderRadius: "4px",
                          backgroundColor: getStatusBadgeColor(item.status) + "15",
                          color: getStatusBadgeColor(item.status)
                        }}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px", color: "#718096", fontSize: "12px" }}>
                        {new Date(item.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem", color: "#a0aec0" }}>
              <FileText size={40} style={{ margin: "0 auto 8px" }} />
              <p>No transactions recorded yet.</p>
            </div>
          )}
        </div>

      </div>

      {/* STRIPE SANDBOX MODAL OVERLAY */}
      {showSandbox && (
        <div style={styles.modalOverlay} onClick={() => setShowSandbox(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.stripeLogo}>stripe</span>
              <button style={styles.closeBtn} onClick={() => setShowSandbox(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.creditCardMock}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <span style={{ fontSize: "12px", opacity: 0.7, fontWeight: "600" }}>ODR Case Fee Gateway</span>
                <Lock size={14} style={{ opacity: 0.7 }} />
              </div>
              <div style={{ fontSize: "18px", letterSpacing: "2px", fontWeight: "600", marginBottom: "15px" }}>
                {cardDetails.number || "•••• •••• •••• ••••"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: "8px", opacity: 0.6, textTransform: "uppercase" }}>Cardholder</div>
                  <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "2px" }}>
                    {cardDetails.name.toUpperCase() || "NAME SURNAME"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "8px", opacity: 0.6, textTransform: "uppercase" }}>Expires</div>
                  <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "2px" }}>
                    {cardDetails.expiry || "MM/YY"}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSandboxSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={styles.sandboxLabel}>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Monika Singh"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  style={styles.sandboxInput}
                  required
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={styles.sandboxLabel}>Card Number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  maxLength="19"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                  style={styles.sandboxInput}
                  required
                />
              </div>

              <div style={styles.cardDetailsGrid}>
                <div>
                  <label style={styles.sandboxLabel}>Expiration Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength="5"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                    style={styles.sandboxInput}
                    required
                  />
                </div>
                <div>
                  <label style={styles.sandboxLabel}>CVC (Security Code)</label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength="3"
                    value={cardDetails.cvc}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/\D/g, "") })}
                    style={styles.sandboxInput}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", marginTop: "16px" }}>
                <ShieldCheck size={20} color="#635bff" />
                <span style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.3" }}>
                  Stripe Test Mode. You can enter any 4242 card details to trigger checkout session logging.
                </span>
              </div>

              <button type="submit" style={styles.sandboxBtn} disabled={sandboxSubmitting}>
                {sandboxSubmitting ? (
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Lock size={16} />
                )}
                {sandboxSubmitting ? "Verifying..." : `Authorize Payment — ₹${amount}`}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

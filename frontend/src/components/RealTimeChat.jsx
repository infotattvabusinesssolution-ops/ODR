import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, ShieldAlert, ArrowLeft, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import axiosInstance from "../api/axiosConfig";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";

export default function RealTimeChat({ role }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [activeRecipient, setActiveRecipient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(true);

  // Resize listener to update isMobile dynamically
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Automatically show sidebar on desktop transition
      if (!mobile) {
        setShowSidebar(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Read current user ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(userId);
    }
  }, []);

  // Fetch all user cases on mount
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/api/chat/cases");
        if (res.data.success && res.data.data.length > 0) {
          setCases(res.data.data);
          setSelectedCaseId(res.data.data[0].caseId);
        }
      } catch (err) {
        console.error("Failed to load user cases:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Fetch participants when selectedCaseId changes
  useEffect(() => {
    if (!selectedCaseId) return;

    const fetchParticipants = async () => {
      try {
        const res = await axiosInstance.get(`/api/chat/participants/${selectedCaseId}`);
        if (res.data.success) {
          // Filter out the current user from list of potential chat contacts
          const filtered = res.data.data.filter(
            (p) => p._id?.toString() !== currentUserId?.toString()
          );
          setParticipants(filtered);
          setActiveRecipient(null);
          setChatMessages([]);
        }
      } catch (err) {
        console.error("Failed to fetch case participants:", err);
      }
    };
    fetchParticipants();
  }, [selectedCaseId, currentUserId]);

  // Dynamically load Socket.io client from CDN and maintain single connection
  useEffect(() => {
    let scriptLoaded = false;
    let sInstance = null;

    const initSocket = () => {
      const socketUrl = API_BASE_URL;
      console.log("Attempting Socket.io connection to:", socketUrl);
      if (window.io) {
        sInstance = window.io(socketUrl);
        sInstance.on("connect", () => {
          console.log("Socket.io connected successfully! ID:", sInstance.id);
        });
        sInstance.on("connect_error", (err) => {
          console.error("Socket.io connection error details:", err);
        });
        setSocket(sInstance);
      }
    };

    if (window.io) {
      initSocket();
    } else {
      const script = document.createElement("script");
      script.src = `${API_BASE_URL}/socket.io/socket.io.js`;
      script.async = true;
      script.onload = () => {
        scriptLoaded = true;
        console.log("Loaded Socket.io script client locally from ODR backend.");
        initSocket();
      };
      document.body.appendChild(script);
    }

    return () => {
      if (sInstance) {
        console.log("Disconnecting Socket.io client instance...");
        sInstance.disconnect();
      }
      if (scriptLoaded) {
        const existingScript = document.querySelector(`script[src="${API_BASE_URL}/socket.io/socket.io.js"]`);
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      }
    };
  }, []);

  // Join Socket.io Room and fetch chat history when active recipient or case updates
  useEffect(() => {
    if (!socket || !selectedCaseId || !activeRecipient || !currentUserId) return;

    const joinPayload = {
      caseId: selectedCaseId,
      userAId: currentUserId,
      userBId: activeRecipient._id,
    };
    console.log("Emitting join_room on client side:", joinPayload);
    socket.emit("join_room", joinPayload);

    // Listen for incoming room events
    socket.on("receive_message", (messageData) => {
      console.log("Received receive_message broadcast on client side:", messageData);
      setChatMessages((prev) => {
        if (prev.some((m) => m._id === messageData._id)) return prev;
        return [...prev, messageData];
      });
    });

    // Fetch conversation logs from DB
    const fetchHistory = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/chat/history/${selectedCaseId}/${currentUserId}/${activeRecipient._id}`
        );
        if (res.data.success) {
          console.log(`Loaded ${res.data.data.length} messages from database history.`);
          setChatMessages(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    fetchHistory();

    return () => {
      console.log("Cleaning up receive_message socket listener...");
      socket.off("receive_message");
    };
  }, [socket, selectedCaseId, activeRecipient, currentUserId]);

  const [aiLoading, setAiLoading] = useState(false);

  const handleAiRewrite = async () => {
    if (!inputMessage.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `Rewrite the following text to sound highly professional, formal, polite, and concise for an online dispute resolution (ODR) legal proceeding chat. Do not include any intro, outro, explanations, or quotes. Only return the final rewritten message text itself: "${inputMessage.trim()}"`;
      const res = await axiosInstance.post("/api/legal-ai/chat", { message: prompt });
      if (res.data && res.data.success) {
        setInputMessage(res.data.answer.trim());
      }
    } catch (err) {
      console.error("AI rewrite error:", err);
      alert("Failed to professionalize message with AI.");
    } finally {
      setAiLoading(false);
    }
  };

  // Send a message
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !socket || !activeRecipient) return;

    const payload = {
      caseId: selectedCaseId,
      senderId: currentUserId,
      senderRole: role,
      receiverId: activeRecipient._id,
      receiverRole: activeRecipient.role,
      message: inputMessage.trim(),
    };

    console.log("Emitting send_message event on client side:", payload);
    socket.emit("send_message", payload);
    setInputMessage("");
  };

  const getRoleLabel = (userRole) => {
    switch (userRole) {
      case "admin": return "Court Admin";
      case "neutral": return "Neutral Arbiter";
      case "claimant": return "Claimant";
      case "respondent": return "Respondent";
      default: return userRole;
    }
  };

  const styles = {
    container: {
      display: "flex",
      height: "calc(100vh - 160px)",
      minHeight: "550px",
      margin: "20px",
      borderRadius: "16px",
      overflow: "hidden",
      backgroundColor: "white",
      boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      border: "1px solid #e2e8f0",
      fontFamily: "'Inter', sans-serif"
    },
    sidebar: {
      width: isMobile ? (showSidebar ? "100%" : "0px") : "320px",
      borderRight: "1px solid #e2e8f0",
      display: isMobile ? (showSidebar ? "flex" : "none") : "flex",
      flexDirection: "column",
      backgroundColor: "#f8fafc"
    },
    chatArea: {
      flex: 1,
      display: isMobile ? (!showSidebar ? "flex" : "none") : "flex",
      flexDirection: "column",
      backgroundColor: "#ffffff",
      overflow: "hidden"
    },
    header: {
      padding: "16px 24px",
      borderBottom: "1px solid #e2e8f0",
      backgroundColor: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    contactItem: (isActive) => ({
      padding: "16px 20px",
      borderBottom: "1px solid #e2e8f0",
      cursor: "pointer",
      backgroundColor: isActive ? "#e0e7ff" : "transparent",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      transition: "background 0.2s"
    }),
    avatar: (userRole) => ({
      width: "42px",
      height: "42px",
      borderRadius: "50%",
      backgroundColor: userRole === "admin" ? "#ef4444" : userRole === "neutral" ? "#8b5cf6" : "#3b82f6",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "14px"
    }),
    badge: (userRole) => ({
      fontSize: "10px",
      padding: "3px 8px",
      borderRadius: "12px",
      fontWeight: "600",
      backgroundColor: userRole === "admin" ? "#fee2e2" : userRole === "neutral" ? "#f3e8ff" : "#dbeafe",
      color: userRole === "admin" ? "#dc2626" : userRole === "neutral" ? "#7c3aed" : "#2563eb",
      alignSelf: "flex-start",
      marginTop: "4px"
    })
  };

  return (
    <div style={styles.container}>
      {/* 1. Chat Contacts Sidebar */}
      <div style={styles.sidebar}>
        <div style={{ padding: "20px", borderBottom: "1px solid #e2e8f0", backgroundColor: "white" }}>
          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Select Active Case</label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "6px", fontSize: "14px", outline: "none" }}
          >
            {cases.map((c) => (
              <option key={c.caseId} value={c.caseId}>
                {c.caseId} - {c.DisputeName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "12px 20px", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Case Participants</div>
          {participants.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>No other participants found.</div>
          ) : (
            participants.map((p) => {
              const isActive = activeRecipient && activeRecipient._id === p._id;
              return (
                <div
                  key={p._id}
                  style={styles.contactItem(isActive)}
                  onClick={() => {
                    setActiveRecipient(p);
                    if (isMobile) setShowSidebar(false);
                  }}
                >
                  <div style={styles.avatar(p.role)}>
                    {p.name ? p.name.substring(0, 2).toUpperCase() : "?"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b" }}>{p.name}</span>
                    <span style={styles.badge(p.role)}>{getRoleLabel(p.role)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Message Thread Pane */}
      <div style={styles.chatArea}>
        {activeRecipient ? (
          <>
            {/* Header */}
            <div style={styles.header}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {isMobile && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div style={styles.avatar(activeRecipient.role)}>
                  {activeRecipient.name ? activeRecipient.name.substring(0, 2).toUpperCase() : "?"}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: "700", fontSize: "16px", color: "#1e293b" }}>{activeRecipient.name}</span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Direct messaging conversation</span>
                </div>
              </div>
              <span style={styles.badge(activeRecipient.role)}>{getRoleLabel(activeRecipient.role)}</span>
            </div>

            {/* Messages container */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", gap: "16px" }}>
              {chatMessages.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                  <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                  <p style={{ fontSize: "14px" }}>Start of messaging history with {activeRecipient.name}.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId?.toString() === currentUserId?.toString();
                  return (
                    <div
                      key={msg._id || msg.timestamp}
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "70%",
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: isMe ? "#4f46e5" : "#ffffff",
                          color: isMe ? "white" : "#1e293b",
                          padding: "12px 18px",
                          borderRadius: "16px",
                          borderTopRightRadius: isMe ? "4px" : "16px",
                          borderTopLeftRadius: isMe ? "16px" : "4px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                          border: isMe ? "none" : "1px solid #cbd5e1",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          whiteSpace: "pre-line",
                          wordBreak: "break-word"
                        }}
                      >
                        {msg.message}
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#64748b",
                          marginTop: "4px",
                          alignSelf: isMe ? "flex-end" : "flex-start"
                        }}
                      >
                        {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions for case participants */}
            <div style={{
              display: "flex",
              gap: "8px",
              padding: "8px 24px",
              overflowX: "auto",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0"
            }}>
              {[
                "Please upload the signed settlement agreement.",
                "When is the next mediation session?",
                "I have uploaded the requested documents. Please verify.",
                "The proposed draft looks fine to me.",
                "I need more time to review the details.",
                "Can we schedule a virtual meeting?",
                "Please submit your response to the claim."
              ].map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!socket || !activeRecipient) return;
                    const payload = {
                      caseId: selectedCaseId,
                      senderId: currentUserId,
                      senderRole: role,
                      receiverId: activeRecipient._id,
                      receiverRole: activeRecipient.role,
                      message: sug,
                    };
                    socket.emit("send_message", payload);
                  }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "999px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    color: "#4f46e5",
                    fontWeight: "500",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s"
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSendMessage}
              style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px", alignItems: "center" }}
            >
              <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Message ${activeRecipient.name}...`}
                  style={{ width: "100%", padding: "12px 48px 12px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" }}
                />
                <button
                  type="button"
                  onClick={handleAiRewrite}
                  disabled={aiLoading || !inputMessage.trim()}
                  title="Make professional with AI"
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "none",
                    border: "none",
                    color: aiLoading ? "#3b82f6" : "#4f46e5",
                    cursor: (!inputMessage.trim() || aiLoading) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: !inputMessage.trim() ? 0.4 : 1
                  }}
                >
                  {aiLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Sparkles size={18} />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                style={{
                  backgroundColor: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "background 0.2s"
                }}
              >
                <Send size={16} /> Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", padding: "20px" }}>
            <MessageSquare size={64} style={{ opacity: 0.2, marginBottom: "16px", color: "#4f46e5" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>Real-Time Case Chat Room</h3>
            <p style={{ textAlign: "center", fontSize: "14px", marginTop: "8px", maxWidth: "340px" }}>
              Select a case in the side menu and pick an active case participant to start a real-time secure conversation.
            </p>
            {isMobile && (
              <button
                onClick={() => setShowSidebar(true)}
                style={{ marginTop: "16px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Show Cases List
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

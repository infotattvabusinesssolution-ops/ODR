import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, ShieldAlert, ArrowLeft, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import axiosInstance, { getApiBaseUrl } from "../api/axiosConfig";

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

  // Read or fetch current user ID
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(userId);
    } else {
      const activeRole = role || localStorage.getItem("userRole") || "respondent";
      axiosInstance
        .get(`/${activeRole}/data`)
        .then((res) => {
          if (res.data?.data?._id) {
            setCurrentUserId(res.data.data._id);
            localStorage.setItem("userId", res.data.data._id);
          }
        })
        .catch(() => {
          const userEmail = localStorage.getItem("userEmail");
          if (userEmail) {
            axiosInstance
              .post("/respondent/my-case", { email: userEmail })
              .then((cRes) => {
                const list = Array.isArray(cRes.data) ? cRes.data : cRes.data?.cases || [];
                if (list.length > 0 && list[0].respondent) {
                  const rId = typeof list[0].respondent === "object" ? list[0].respondent._id : list[0].respondent;
                  if (rId) {
                    setCurrentUserId(String(rId));
                    localStorage.setItem("userId", String(rId));
                  }
                }
              })
              .catch(() => {});
          }
        });
    }
  }, [role]);

  // Fetch all user cases on mount with multi-strategy fallback
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        let loadedCases = [];

        try {
          const res = await axiosInstance.get("/api/chat/cases");
          if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
            loadedCases = res.data.data;
          }
        } catch (chatApiErr) {
          console.warn("Direct /api/chat/cases failed or unauthenticated, attempting role fallback:", chatApiErr);
        }

        if (loadedCases.length === 0) {
          const userEmail = localStorage.getItem("userEmail") || "";
          try {
            const respCaseRes = await axiosInstance.post("/respondent/my-case", { email: userEmail });
            const respCases = Array.isArray(respCaseRes.data) ? respCaseRes.data : respCaseRes.data?.cases || [];
            if (respCases.length > 0) {
              loadedCases = respCases;
            }
          } catch (rErr) {
            console.warn("Respondent fallback cases fetch failed:", rErr);
          }
        }

        if (loadedCases.length === 0) {
          const demoCase = { caseId: "DEMO-CASE", DisputeName: "Interactive Demo Dispute" };
          loadedCases = [demoCase];
        }

        setCases(loadedCases);
        const firstId = loadedCases[0].caseId || loadedCases[0]._id || loadedCases[0].id;
        setSelectedCaseId(firstId);
      } catch (err) {
        console.error("Failed to load user cases:", err);
        const demoCase = { caseId: "DEMO-CASE", DisputeName: "Interactive Demo Dispute" };
        setCases([demoCase]);
        setSelectedCaseId("DEMO-CASE");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Fetch participants when selectedCaseId changes
  useEffect(() => {
    if (!selectedCaseId) return;

    if (selectedCaseId === "DEMO-CASE") {
      setParticipants([
        { _id: "admin-demo", name: "System Administrator", role: "admin" },
        { _id: "neutral-demo", name: "Sarah (Mediator)", role: "neutral" },
        { _id: "respondent-demo", name: "John (Respondent)", role: "respondent" }
      ]);
      setActiveRecipient(null);
      setChatMessages([]);
      return;
    }

    const fetchParticipants = async () => {
      try {
        const res = await axiosInstance.get(`/api/chat/participants/${selectedCaseId}`);
        if (res.data?.success) {
          const list = res.data.participants || res.data.data || [];
          const filtered = list.filter(
            (p) => p && (!currentUserId || p._id?.toString() !== currentUserId?.toString())
          );
          setParticipants(filtered);
          if (filtered.length > 0) {
            setActiveRecipient((prev) => {
              // Keep current if still in list, else select first
              if (prev && filtered.some((p) => p._id === prev._id)) return prev;
              return filtered[0];
            });
          } else {
            setActiveRecipient(null);
          }
          setChatMessages([]);
        }
      } catch (err) {
        console.error("Failed to fetch case participants:", err);
      }
    };
    fetchParticipants();
  }, [selectedCaseId, currentUserId]);

  // Dynamically load Socket.io client and maintain single connection
  useEffect(() => {
    let scriptLoaded = false;
    let sInstance = null;

    const initSocket = () => {
      const socketUrl = getApiBaseUrl();
      console.log("Attempting Socket.io connection to:", socketUrl);
      if (window.io) {
        sInstance = window.io(socketUrl, {
          withCredentials: true,
          transports: ["polling", "websocket"],
        });
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
      script.src = `${getApiBaseUrl()}/socket.io/socket.io.js`;
      script.async = true;
      script.onerror = () => {
        // Fallback to CDN if backend static file doesn't load
        const cdnScript = document.createElement("script");
        cdnScript.src = "https://cdn.socket.io/4.8.1/socket.io.min.js";
        cdnScript.onload = () => {
          initSocket();
        };
        document.body.appendChild(cdnScript);
      };
      script.onload = () => {
        scriptLoaded = true;
        initSocket();
      };
      document.body.appendChild(script);
    }

    return () => {
      if (sInstance) {
        sInstance.disconnect();
      }
    };
  }, []);

  // Join Socket.io Room and fetch chat history when active recipient or case updates
  useEffect(() => {
    const sender = currentUserId || localStorage.getItem("userId");
    if (!socket || !selectedCaseId || !activeRecipient || !sender) return;

    const joinPayload = {
      caseId: selectedCaseId,
      userAId: sender,
      userBId: activeRecipient._id,
    };
    console.log("Emitting join_room on client side:", joinPayload);
    socket.emit("join_room", joinPayload);

    // Listen for incoming room events
    const handleReceive = (messageData) => {
      console.log("Received receive_message broadcast on client side:", messageData);
      setChatMessages((prev) => {
        const filteredPrev = prev.filter(
          (m) => !(m._id?.startsWith("temp_") && m.message === messageData.message)
        );
        if (filteredPrev.some((m) => m._id === messageData._id)) return filteredPrev;
        return [...filteredPrev, messageData];
      });
    };

    socket.on("receive_message", handleReceive);

    // Fetch conversation logs from DB
    const fetchHistory = async () => {
      if (selectedCaseId === "DEMO-CASE") {
        setChatMessages([
          { _id: "1", senderId: activeRecipient._id, message: "Hello! I am " + activeRecipient.name + ". This is a demonstration of the Real-Time Communication module.", timestamp: new Date(Date.now() - 60000) },
          { _id: "2", senderId: currentUserId, message: "Hi! It's great to see this working. How does the AI rewrite feature work?", timestamp: new Date(Date.now() - 30000) },
          { _id: "3", senderId: activeRecipient._id, message: "Just type a casual message below and click the sparkle icon before sending! The AI will automatically rewrite it into a professional, legal-standard message.", timestamp: new Date() }
        ]);
        return;
      }
      try {
        const res = await axiosInstance.get(
          `/api/chat/history/${selectedCaseId}/${sender}/${activeRecipient._id}`
        );
        if (res.data?.success) {
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
      socket.off("receive_message", handleReceive);
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
    if (!inputMessage.trim()) return;

    if (!activeRecipient) {
      toast.error("No recipient selected to send the message to.");
      return;
    }

    const sender = currentUserId || localStorage.getItem("userId") || "me";

    if (selectedCaseId === "DEMO-CASE" && activeRecipient) {
      const newMsg = {
        _id: Date.now().toString(),
        senderId: sender,
        message: inputMessage.trim(),
        timestamp: new Date().toISOString()
      };
      setChatMessages((prev) => [...prev, newMsg]);
      setInputMessage("");
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            _id: (Date.now() + 1).toString(),
            senderId: activeRecipient._id,
            message: "I received your message. I am a demo bot so I won't do much, but this shows the chat UI working perfectly!",
            timestamp: new Date().toISOString()
          }
        ]);
      }, 1000);
      return;
    }

    if (!sender) {
      toast.error("Please ensure you are logged in to send messages.");
      return;
    }

    if (!socket) {
      toast.error("Real-time chat is currently disconnected. Please refresh or try again later.");
      return;
    }

    const trimmedMsg = inputMessage.trim();
    const payload = {
      caseId: selectedCaseId,
      senderId: sender,
      senderRole: role || "respondent",
      receiverId: activeRecipient._id,
      receiverRole: activeRecipient.role || "claimant",
      message: trimmedMsg,
    };

    console.log("Emitting send_message event on client side:", payload);
    if (socket) {
      socket.emit("send_message", payload);
    }

    // Optimistically append message to conversation immediately
    const optimisticMsg = {
      _id: "temp_" + Date.now(),
      caseId: selectedCaseId,
      senderId: sender,
      senderRole: role || "respondent",
      receiverId: activeRecipient._id,
      receiverRole: activeRecipient.role || "claimant",
      message: trimmedMsg,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);
    setInputMessage("");
  };

  const getRoleLabel = (userRole) => {
    switch (userRole) {
      case "admin": return "Court Admin";
      case "neutral": return "Mediator";
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
            {cases.map((c) => {
              const val = c.caseId || c._id || c.id;
              const title = c.caseId 
                ? `${c.caseId} - ${c.DisputeName || c.caseTitle || "Dispute Case"}` 
                : (c.DisputeName || c.caseTitle || `Case #${val}`);
              return (
                <option key={val} value={val}>
                  {title}
                </option>
              );
            })}
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
                    if (!activeRecipient) {
                      toast.error("No recipient selected to send the message to.");
                      return;
                    }
                    const sender = currentUserId || localStorage.getItem("userId") || "me";

                    if (selectedCaseId === "DEMO-CASE") {
                      const newMsg = {
                        _id: Date.now().toString(),
                        senderId: sender,
                        message: sug,
                        timestamp: new Date().toISOString()
                      };
                      setChatMessages((prev) => [...prev, newMsg]);
                      setTimeout(() => {
                         setChatMessages((prev) => [...prev, {
                            _id: (Date.now()+1).toString(),
                            senderId: activeRecipient._id,
                            message: "Thank you for the quick suggestion. I will review it.",
                            timestamp: new Date().toISOString()
                         }]);
                      }, 1000);
                      return;
                    }
                    if (!socket) {
                      toast.error("Real-time chat is currently disconnected. Please refresh or try again later.");
                      return;
                    }
                    
                    const payload = {
                      caseId: selectedCaseId,
                      senderId: sender,
                      senderRole: role,
                      receiverId: activeRecipient._id,
                      receiverRole: activeRecipient.role,
                      message: sug,
                    };

                    const tempMsg = {
                      _id: "temp_" + Date.now(),
                      senderId: sender,
                      message: sug,
                      timestamp: new Date().toISOString(),
                    };
                    setChatMessages((prev) => [...prev, tempMsg]);

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

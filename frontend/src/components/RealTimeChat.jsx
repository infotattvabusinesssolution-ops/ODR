import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, ShieldAlert, ArrowLeft, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import axiosInstance, { getApiBaseUrl } from "../api/axiosConfig";

const JOINT_CHANNEL = {
  _id: "joint-case-thread",
  name: "Group Joint Discussion",
  role: "joint",
  isJoint: true,
};

const ALLOWED_3S_EMAILS = [
  "santosh.baral@sjtsservices.com",
  "sandeepdeore@yahoo.com",
  "srittam.das@gmail.com",
];

export default function RealTimeChat({ role }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [activeRecipient, setActiveRecipient] = useState(JOINT_CHANNEL);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(true);

  const isJointActive = !activeRecipient || !!activeRecipient.isJoint || activeRecipient._id === "joint-case-thread" || activeRecipient._id === "joint-3s-thread";

  const userEmail = (localStorage.getItem("userEmail") || "").toLowerCase().trim();
  const userRole = role || localStorage.getItem("userRole") || "claimant";
  const is3SUser = ALLOWED_3S_EMAILS.includes(userEmail) || userRole === "admin";

  const selectedCase = cases.find(
    (c) => String(c.caseId || c._id || c.id) === String(selectedCaseId)
  );

  const is3SCase = Boolean(
    selectedCase &&
    (selectedCase.caseId === "CASE-2026-0021" ||
     (selectedCase.DisputeName && selectedCase.DisputeName.includes("Santosh Baral")))
  );

  // Show 3S Joint Discussion ONLY if user logged in with authorized 3S email (or admin) AND viewing the 3S case
  const show3SJoint = is3SCase && is3SUser;

  // Extract individual participants from state or selectedCase
  const claimantParticipant = participants.find((p) => p.role === "claimant");
  const respondentParticipant = participants.find((p) => p.role === "respondent");
  const neutralParticipant = participants.find((p) => p.role === "neutral");

  const claimantName = claimantParticipant?.name || selectedCase?.CustomersName || "Claimant";
  const respondentName = respondentParticipant?.name || selectedCase?.oppositePartyName || "Respondent";
  const neutralName = neutralParticipant?.name || selectedCase?.neutral?.name || "Adv. Srittam Das";

  const jointTitle = show3SJoint
    ? "3S Joint Discussion"
    : (selectedCase?.caseId ? `${selectedCase.caseId} Joint Discussion` : "Case Joint Discussion");

  const jointSubtitle = show3SJoint
    ? "Santosh · Sandeep · Srittam"
    : `${claimantName.split(" ")[0]} · ${respondentName.split(" ")[0]} · ${neutralName.split(" ")[0]}`;

  const jointHeaderDesc = show3SJoint
    ? "Group Joint Session · Santosh Baral (Claimant) · Sandeep Deore (Respondent) · Adv. Srittam Das (Mediator)"
    : `Group Joint Session · ${claimantName} (Claimant) · ${respondentName} (Respondent) · ${neutralName} (Mediator)`;

  const jointBadge = show3SJoint ? "Active Joint Session (3S)" : "Active Joint Session";

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
      const activeRole = role || localStorage.getItem("userRole") || "claimant";
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
          if (is3SUser) {
            const demoCase = { caseId: "CASE-2026-0021", DisputeName: "Santosh Baral (SJTS Services Pvt Ltd) vs. Sandeep Dhansing Deore" };
            loadedCases = [demoCase];
          }
        }

        // Hide CASE-2026-0021 from unauthorized users so only 3S emails & admin can access it
        const visibleCases = is3SUser
          ? loadedCases
          : loadedCases.filter((c) => c.caseId !== "CASE-2026-0021");

        setCases(visibleCases);
        if (visibleCases.length > 0) {
          const firstId = visibleCases[0].caseId || visibleCases[0]._id || visibleCases[0].id;
          setSelectedCaseId(firstId);
        }
      } catch (err) {
        console.error("Failed to load user cases:", err);
        if (is3SUser) {
          const demoCase = { caseId: "CASE-2026-0021", DisputeName: "Santosh Baral (SJTS Services Pvt Ltd) vs. Sandeep Dhansing Deore" };
          setCases([demoCase]);
          setSelectedCaseId("CASE-2026-0021");
        } else {
          setCases([]);
          setSelectedCaseId("");
        }
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
      return;
    }

    const fetchParticipants = async () => {
      try {
        const res = await axiosInstance.get(`/api/chat/participants/${selectedCaseId}`);
        if (res.data?.success) {
          const list = res.data.participants || res.data.data || [];
          const filtered = list.filter(
            (p) => p && (!currentUserId || String(p._id) !== String(currentUserId))
          );
          setParticipants(filtered);
          // Preserve joint session selection or active recipient
          setActiveRecipient((prev) => {
            if (!prev || prev._id === "joint-3s-thread" || prev.isJoint) {
              return JOINT_CHANNEL;
            }
            if (filtered.some((p) => String(p._id) === String(prev._id))) {
              return prev;
            }
            return JOINT_CHANNEL;
          });
        }
      } catch (err) {
        console.error("Failed to fetch case participants:", err);
      }
    };
    fetchParticipants();
  }, [selectedCaseId, currentUserId]);

  // Fetch conversation logs from DB whenever case or activeRecipient changes
  useEffect(() => {
    if (!selectedCaseId || !activeRecipient) return;

    if (selectedCaseId === "DEMO-CASE") {
      setChatMessages([
        { _id: "1", senderId: activeRecipient._id, message: "Hello! I am " + activeRecipient.name + ". This is a demonstration of the Real-Time Communication module.", timestamp: new Date(Date.now() - 60000) },
        { _id: "2", senderId: currentUserId, message: "Hi! It's great to see this working. How does the AI rewrite feature work?", timestamp: new Date(Date.now() - 30000) },
        { _id: "3", senderId: activeRecipient._id, message: "Just type a casual message below and click the sparkle icon before sending! The AI will automatically rewrite it into a professional, legal-standard message.", timestamp: new Date() }
      ]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const sender = currentUserId || localStorage.getItem("userId");
        const isJoint = !activeRecipient || !!activeRecipient.isJoint || activeRecipient._id === "joint-3s-thread";
        const url = isJoint
          ? `/api/chat/joint-history/${selectedCaseId}`
          : `/api/chat/history/${selectedCaseId}/${sender}/${activeRecipient._id}`;

        if (!isJoint && !sender) return;

        console.log(`Fetching history from: ${url}`);
        const res = await axiosInstance.get(url);
        if (res.data?.success && Array.isArray(res.data.data)) {
          console.log(`Loaded ${res.data.data.length} messages from database history.`);
          setChatMessages(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };

    fetchHistory();
  }, [selectedCaseId, activeRecipient, currentUserId]);

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

  // Join Socket.io Room when active recipient or case updates
  useEffect(() => {
    const sender = currentUserId || localStorage.getItem("userId");
    if (!socket || !selectedCaseId || !activeRecipient || !sender) return;

    const isJoint = isJointActive;
    const joinPayload = {
      caseId: selectedCaseId,
      userAId: sender,
      userBId: isJoint ? "joint" : activeRecipient._id,
      isJoint: isJoint,
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
        if (filteredPrev.some((m) => String(m._id) === String(messageData._id))) return filteredPrev;
        return [...filteredPrev, messageData];
      });
    };

    socket.on("receive_message", handleReceive);

    return () => {
      console.log("Cleaning up receive_message socket listener...");
      socket.off("receive_message", handleReceive);
    };
  }, [socket, selectedCaseId, activeRecipient, currentUserId, isJointActive]);

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

  // Helper to resolve sender display name
  const getSenderName = () => {
    const fromStorage = localStorage.getItem("userName") || localStorage.getItem("username") || localStorage.getItem("name");
    if (fromStorage && fromStorage !== "User" && fromStorage !== "null") return fromStorage;
    if (show3SJoint) {
      if (role === "claimant") return "Santosh Baral";
      if (role === "respondent") return "Sandeep Dhansing Deore";
      if (role === "neutral") return "Adv. Srittam Das";
    }
    if (role === "claimant") return claimantName || "Claimant";
    if (role === "respondent") return respondentName || "Respondent";
    if (role === "neutral") return neutralName || "Mediator";
    return "Admin";
  };

  // Send a message
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    if (!activeRecipient) {
      alert("No recipient selected to send the message to.");
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

    const trimmedMsg = inputMessage.trim();
    const isJoint = isJointActive;
    const currentName = getSenderName();

    const payload = {
      caseId: selectedCaseId,
      senderId: sender,
      senderName: currentName,
      senderRole: role || "claimant",
      receiverId: isJoint ? null : activeRecipient._id,
      receiverRole: isJoint ? "all" : (activeRecipient.role || "respondent"),
      isJoint: isJoint,
      isJointThread: isJoint,
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
      senderName: currentName,
      senderRole: role || "claimant",
      receiverId: isJoint ? null : activeRecipient._id,
      receiverRole: isJoint ? "all" : (activeRecipient.role || "respondent"),
      isJointThread: isJoint,
      message: trimmedMsg,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);
    setInputMessage("");
  };

  const getRoleLabel = (userRole) => {
    switch (userRole) {
      case "joint": return "Joint Session";
      case "admin": return "Court Admin";
      case "neutral": return "Mediator";
      case "claimant": return "Claimant";
      case "respondent": return "Respondent";
      default: return userRole || "Party";
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
      width: isMobile ? (showSidebar ? "100%" : "0px") : "330px",
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
      padding: "14px 18px",
      borderBottom: "1px solid #f1f5f9",
      cursor: "pointer",
      backgroundColor: isActive ? "#e0e7ff" : "transparent",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      transition: "all 0.2s"
    }),
    avatar: (userRole) => ({
      width: "42px",
      height: "42px",
      borderRadius: "50%",
      backgroundColor: userRole === "joint" ? "#f59e0b" : userRole === "admin" ? "#ef4444" : userRole === "neutral" ? "#8b5cf6" : "#3b82f6",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "14px",
      flexShrink: 0
    }),
    badge: (userRole) => ({
      fontSize: "10px",
      padding: "3px 8px",
      borderRadius: "12px",
      fontWeight: "600",
      backgroundColor: userRole === "joint" ? "#fef3c7" : userRole === "admin" ? "#fee2e2" : userRole === "neutral" ? "#f3e8ff" : "#dbeafe",
      color: userRole === "joint" ? "#b45309" : userRole === "admin" ? "#dc2626" : userRole === "neutral" ? "#7c3aed" : "#2563eb",
      alignSelf: "flex-start",
      marginTop: "4px"
    })
  };

  return (
    <div style={styles.container}>
      {/* 1. Chat Contacts Sidebar */}
      <div style={styles.sidebar}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", backgroundColor: "white" }}>
          <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Select Active Case
          </label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "6px", fontSize: "13px", outline: "none", fontWeight: "500", backgroundColor: "#f8fafc" }}
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

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {/* 3S Joint Session Thread Channel */}
          <div style={{ padding: "8px 20px 6px", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Group Joint Session
          </div>
          <div
            style={{
              padding: "14px 16px",
              cursor: "pointer",
              backgroundColor: isJointActive ? "#fef3c7" : "#ffffff",
              border: isJointActive ? "2px solid #f59e0b" : "1px solid #e2e8f0",
              margin: "4px 14px 14px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: isJointActive ? "0 4px 12px rgba(245, 158, 11, 0.25)" : "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.2s"
            }}
            onClick={() => {
              setActiveRecipient(JOINT_CHANNEL);
              if (isMobile) setShowSidebar(false);
            }}
          >
            <div style={{ ...styles.avatar("joint"), fontSize: "20px", backgroundColor: "#f59e0b" }}>🏛️</div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: "700", fontSize: "13px", color: isJointActive ? "#92400e" : "#1e293b" }}>{jointTitle}</span>
              <span style={{ fontSize: "11px", color: isJointActive ? "#b45309" : "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {jointSubtitle}
              </span>
              <span style={{ ...styles.badge("joint"), marginTop: "4px" }}>{jointBadge}</span>
            </div>
          </div>

          <div style={{ padding: "8px 20px 6px", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Direct Messages (1-on-1)
          </div>
          {participants.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>No other individual participants found.</div>
          ) : (
            participants.filter(p => !p.isJoint).map((p) => {
              const isActive = !isJointActive && activeRecipient && String(activeRecipient._id) === String(p._id);
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
                    <span style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b" }}>{p.name}</span>
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
                <div style={{ ...styles.avatar(isJointActive ? "joint" : activeRecipient.role), fontSize: isJointActive ? "20px" : "14px" }}>
                  {isJointActive ? "🏛️" : (activeRecipient.name ? activeRecipient.name.substring(0, 2).toUpperCase() : "?")}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: "700", fontSize: "16px", color: "#1e293b" }}>
                    {isJointActive ? jointTitle : activeRecipient.name}
                  </span>
                  <span style={{ fontSize: "12px", color: isJointActive ? "#b45309" : "#64748b", fontWeight: isJointActive ? "600" : "400" }}>
                    {isJointActive
                      ? jointHeaderDesc
                      : `Direct 1-on-1 messaging conversation with ${getRoleLabel(activeRecipient.role)}`}
                  </span>
                </div>
              </div>
              <span style={styles.badge(isJointActive ? "joint" : activeRecipient.role)}>
                {isJointActive ? jointBadge : getRoleLabel(activeRecipient.role)}
              </span>
            </div>

            {/* Messages container */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", gap: "16px" }}>
              {chatMessages.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                  <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                  <p style={{ fontSize: "14px", fontWeight: "500" }}>
                    Start of messaging history in {isJointActive ? jointTitle : activeRecipient.name}.
                  </p>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                    Send a message below to begin discussion.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const msgSenderId = msg.senderId?._id ? String(msg.senderId._id) : String(msg.senderId || "");
                  const myId = String(currentUserId || localStorage.getItem("userId") || "");
                  const isMe = Boolean(msgSenderId && myId && msgSenderId === myId);
                  const senderRole = msg.senderRole || msg.senderId?.role || "claimant";
                  const senderName = msg.senderName || msg.senderId?.name || getRoleLabel(senderRole);

                  return (
                    <div
                      key={msg._id || msg.timestamp}
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "72%",
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      {/* Sender label in Joint Thread */}
                      {!isMe && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>
                            {senderName}
                          </span>
                          <span style={{ ...styles.badge(senderRole), marginTop: 0, padding: "1px 6px", fontSize: "9px" }}>
                            {getRoleLabel(senderRole)}
                          </span>
                        </div>
                      )}
                      <div
                        style={{
                          backgroundColor: isMe ? "#4f46e5" : "#ffffff",
                          color: isMe ? "white" : "#1e293b",
                          padding: "12px 18px",
                          borderRadius: "16px",
                          borderTopRightRadius: isMe ? "4px" : "16px",
                          borderTopLeftRadius: isMe ? "16px" : "4px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
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
                    const sender = currentUserId || localStorage.getItem("userId") || "me";
                    const isJoint = isJointActive;
                    const currentName = getSenderName();

                    const payload = {
                      caseId: selectedCaseId,
                      senderId: sender,
                      senderName: currentName,
                      senderRole: role || "claimant",
                      receiverId: isJoint ? null : activeRecipient._id,
                      receiverRole: isJoint ? "all" : (activeRecipient.role || "respondent"),
                      isJoint: isJoint,
                      isJointThread: isJoint,
                      message: sug,
                    };

                    const tempMsg = {
                      _id: "temp_" + Date.now(),
                      caseId: selectedCaseId,
                      senderId: sender,
                      senderName: currentName,
                      senderRole: role || "claimant",
                      receiverId: isJoint ? null : activeRecipient._id,
                      receiverRole: isJoint ? "all" : (activeRecipient.role || "respondent"),
                      isJointThread: isJoint,
                      message: sug,
                      timestamp: new Date().toISOString(),
                    };
                    setChatMessages((prev) => [...prev, tempMsg]);

                    if (socket) {
                      socket.emit("send_message", payload);
                    }
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
                  placeholder={`Message in ${isJointActive ? jointTitle : activeRecipient.name}...`}
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

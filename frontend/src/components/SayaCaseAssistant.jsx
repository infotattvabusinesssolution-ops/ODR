import { useState, useEffect, useRef } from "react";
import { Bot, Send, X, RefreshCw } from "lucide-react";
import axiosInstance from "../api/axiosConfig";
import "./SayaCaseAssistant.css";

export default function SayaCaseAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [caseId, setCaseId] = useState(() => localStorage.getItem("caseId") || "");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([
    {
      sender: "ai",
      text: "Hello, I am Saya-AI. Ask me about your case status, hearing, documents, neutral, or next step.",
    },
  ]);

  const assistantRef = useRef(null);
  const buttonRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat, loading]);

  // Click outside and Escape key listener to close chat panel
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        assistantRef.current &&
        !assistantRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Load caseId dynamically from localStorage when panel is opened
  useEffect(() => {
    if (open) {
      const storedId = localStorage.getItem("caseId");
      if (storedId && !caseId) {
        setCaseId(storedId);
      }
    }
  }, [open, caseId]);

  const sendMessage = async (presetMessage) => {
    const finalMessage = presetMessage || message;

    if (!finalMessage.trim()) return;

    setChat((prev) => [...prev, { sender: "user", text: finalMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/api/chat/message", {
        message: finalMessage,
        caseId: caseId.trim() || undefined,
      });

      setChat((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.data.message || "No response received.",
        },
      ]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            error.response?.data?.message ||
            "Sorry, I could not fetch your case details.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChat([
      {
        sender: "ai",
        text: "Hello, I am Saya-AI. Ask me about your case status, hearing, documents, neutral, or next step.",
      },
    ]);
    setMessage("");
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`saya-ai-floating-btn ${open ? "active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        title={open ? "Close Saya-AI" : "Chat with Saya-AI"}
      >
        <div className="pulse-ring"></div>
        {open ? (
          <X size={24} className="icon-transition close-icon" />
        ) : (
          <div className="icon-wrapper icon-transition">
            <Bot size={26} className="bot-icon-spin" />
          </div>
        )}
        <span className="online-status-dot"></span>
      </button>

      {!open && (
        <div className="saya-ai-badge-prompt">
          <span>Ask Saya AI</span>
        </div>
      )}

      {open && (
        <div ref={assistantRef} className="saya-ai-box">
          <div className="saya-ai-header">
            <div className="header-title-group">
              <div className="bot-avatar-header">
                <Bot size={18} />
                <span className="online-indicator"></span>
              </div>
              <div>
                <strong>Saya-AI</strong>
                <span>Case Status Assistant</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button onClick={clearChat} title="Reset Conversation" style={{ padding: "6px" }}>
                <RefreshCw size={14} />
              </button>
              <button onClick={() => setOpen(false)} title="Close Chat" style={{ padding: "6px" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="saya-ai-case-input">
            <input
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="Optional Case ID e.g. CASE-2026-0004"
            />
          </div>

          <div className="saya-ai-messages">
            {chat.map((item, index) => (
              <div
                key={index}
                className={`saya-ai-message ${
                  item.sender === "user" ? "user" : "ai"
                }`}
              >
                {item.sender === "ai" && (
                  <div className="ai-message-avatar">
                    <Bot size={14} />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ whiteSpace: "pre-line", wordBreak: "break-word", margin: 0 }}>{item.text}</p>
                  {index === 0 && item.sender === "ai" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Quick Suggestions:</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        <button 
                          onClick={() => sendMessage("What is my case status?")}
                          style={{
                            background: "#e0e7ff",
                            color: "#4f46e5",
                            border: "none",
                            borderRadius: "12px",
                            padding: "6px 12px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          ⚖️ Case Status
                        </button>
                        <button 
                          onClick={() => sendMessage("When is my hearing?")}
                          style={{
                            background: "#e0e7ff",
                            color: "#4f46e5",
                            border: "none",
                            borderRadius: "12px",
                            padding: "6px 12px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          📅 Hearing Details
                        </button>
                        <button 
                          onClick={() => sendMessage("Who is my assigned neutral arbiter?")}
                          style={{
                            background: "#e0e7ff",
                            color: "#4f46e5",
                            border: "none",
                            borderRadius: "12px",
                            padding: "6px 12px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          👤 Neutral Arbiter
                        </button>
                        <button 
                          onClick={() => sendMessage("What documents have been uploaded in my case?")}
                          style={{
                            background: "#e0e7ff",
                            color: "#4f46e5",
                            border: "none",
                            borderRadius: "12px",
                            padding: "6px 12px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          📂 Case Documents
                        </button>
                        <button 
                          onClick={() => sendMessage("What is the payment status of my case?")}
                          style={{
                            background: "#e0e7ff",
                            color: "#4f46e5",
                            border: "none",
                            borderRadius: "12px",
                            padding: "6px 12px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          💳 Payment Status
                        </button>
                        <button 
                          onClick={() => sendMessage("What is the next step to proceed with this case?")}
                          style={{
                            background: "#e0e7ff",
                            color: "#4f46e5",
                            border: "none",
                            borderRadius: "12px",
                            padding: "6px 12px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            textAlign: "left"
                          }}
                        >
                          🚀 Next Step
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="saya-ai-message ai">
                <div className="ai-message-avatar">
                  <Bot size={14} />
                </div>
                <div className="loading-dots-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="saya-ai-chips" style={{ borderBottom: "none", borderTop: "1px solid #f1f5f9", padding: "8px 12px" }}>
            <button onClick={() => sendMessage("What is my case status?")}>
              Case Status
            </button>
            <button onClick={() => sendMessage("When is my hearing?")}>
              Hearing Details
            </button>
            <button onClick={() => sendMessage("Who is my assigned neutral arbiter?")}>
              Neutral Arbiter
            </button>
            <button onClick={() => sendMessage("What documents have been uploaded in my case?")}>
              My Documents
            </button>
            <button onClick={() => sendMessage("What is the payment status of my case?")}>
              Payment Status
            </button>
            <button onClick={() => sendMessage("Who is the opposite party and what are their details?")}>
              Opposite Party
            </button>
            <button onClick={() => sendMessage("What is the next step to proceed with this case?")}>
              Next Step
            </button>
          </div>

          <div className="saya-ai-footer">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your case..."
            />
            <button onClick={() => sendMessage()} disabled={loading} title="Send Message">
              <Send size={17} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
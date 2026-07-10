import React from "react";
import { X } from "lucide-react";

export default function ModalComponent({ title, onClose, children }) {
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
    boxSizing: "border-box"
  };

  const containerStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "640px",
    padding: "28px 32px",
    position: "relative",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90vh",
    overflowY: "auto"
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: title ? "1px solid #e2e8f0" : "none",
    paddingBottom: title ? "12px" : "0px",
    marginBottom: title ? "20px" : "0px",
    width: "100%"
  };

  const titleStyle = {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    flex: 1
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "background-color 0.2s, color 0.2s"
  };

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          {title ? (
            <h2 style={titleStyle}>{title}</h2>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.backgroundColor = "#fee2e2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ boxSizing: "border-box", width: "100%" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

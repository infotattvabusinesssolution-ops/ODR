import React from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

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
    maxWidth: "500px",
    padding: "28px 32px",
    position: "relative",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column"
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "12px",
    marginBottom: "20px",
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
    fontSize: "24px",
    cursor: "pointer",
    lineHeight: 1,
    padding: "0 4px",
    transition: "color 0.2s"
  };

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
          >
            &times;
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ boxSizing: "border-box", width: "100%" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

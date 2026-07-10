import React from "react";

export default function AllDetails({ caseData, onclose }) {
  if (!caseData) {
    return <div>No case data available</div>;
  }

  const styles = {
    container: {
      width: "100%",
      maxWidth: "700px",
      margin: "20px auto",
      padding: "20px",
      background: "#fff",
      borderRadius: "12px",
      // ⭐ Added Scroll
      maxHeight: "80vh",
      overflowY: "auto",
      scrollbarWidth: "thin",
    },
    title: {
      textAlign: "center",
      marginBottom: "20px",
    },
    section: {
      marginBottom: "20px",
      padding: "15px",
      borderRadius: "10px",
      background: "#f8f9fa",
    },
    sectionTitle: {
      marginBottom: "15px",
      fontSize: "18px",
      color: "#333",
    },
    itemRow: {
      display: "flex",
      marginBottom: "10px",
    },
    link: {
      color: "#007bff",
      textDecoration: "underline",
    },
  };

  const Item = ({ label, value }) => (
    <div style={styles.itemRow}>
      <strong style={{ width: "220px" }}>{label}:</strong>
      <span>{value ? value : "—"}</span>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Case Details</h2>

      {/* Basic Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Basic Information</h3>

        <Item label="Case ID" value={caseData.caseId} />
        <Item label="Dispute Type" value={caseData.DisputeType} />
        <Item label="Dispute Name" value={caseData.DisputeName} />
        <Item label="Dispute Amount" value={caseData.DisputeAmount} />
        <Item label="Created At" value={caseData.createdAt} />
        <Item label="Status" value={caseData.status} />
      </div>

      {/* Customer Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Customer Information</h3>

        <Item label="Name" value={caseData.CustomersName} />
        <Item label="Email" value={caseData.CustomersEmail} />
        <Item label="Mobile Number" value={caseData.CustomersMobileNumber} />
        <Item label="Aadhar Number" value={caseData.CustomersAadharNumber} />
      </div>

      {/* Opposite Party */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Opposite Party</h3>

        <Item label="Name" value={caseData.oppositePartyName} />
        <Item label="Email" value={caseData.oppositePartyEmail} />
        <Item label="Phone" value={caseData.oppositeMobile} />
      </div>

      {/* Neutral */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Assigned Neutral</h3>

        <Item label="Name" value={caseData.neutral?.name} />
        <Item label="Email" value={caseData.neutral?.email} />
      </div>

      {/* File */}
      {caseData.file && (
        <div style={styles.section}>
          <a
            href={caseData.file}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            View Document
          </a>
        </div>
      )}
    </div>
  );
}

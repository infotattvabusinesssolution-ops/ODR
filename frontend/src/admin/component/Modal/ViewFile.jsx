import React from "react";
import { FolderOpen } from "lucide-react";
import CaseEvidencesSection from "./CaseEvidencesSection";

/**
 * Modal showing all evidences and submitted documents attached to a case.
 */
const ViewFile = ({ caseData }) => {
  const count = Array.isArray(caseData?.evidences)
    ? caseData.evidences.length
    : caseData?.file
    ? 1
    : 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "740px",
        padding: "20px",
        maxHeight: "82vh",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #e2e8f0",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FolderOpen size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Case Evidences &amp; Documents
            </h2>
            <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "2px" }}>
              {caseData?.caseId || "Case"}
              {caseData?.DisputeName ? ` — ${caseData.DisputeName}` : ""}
            </div>
          </div>
        </div>
        <span
          style={{
            background: "#f1f5f9",
            color: "#334155",
            fontWeight: 700,
            fontSize: "12px",
            padding: "4px 10px",
            borderRadius: "999px",
          }}
        >
          {count} {count === 1 ? "File" : "Files"}
        </span>
      </div>

      <CaseEvidencesSection caseData={caseData} showThumbnails />
    </div>
  );
};

export default ViewFile;

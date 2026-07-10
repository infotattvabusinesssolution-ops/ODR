import { TrendingUp, Calendar, Tag, DollarSign, User } from "lucide-react";
import { useEffect, useState } from "react";
import { ClaimantApi } from "../../api/ClaimantApi";
import "./CaseStatusTracking.css";

export default function CaseStatusTracking() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const res = await ClaimantApi.getMyCases();
        setCases(res.claimantCase || []);
      } catch (err) {
        console.error("Error fetching cases:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const getStatusType = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "verified":
        return "scheduled";
      case "pending":
      case "under review":
        return "under-review";
      case "completed":
      case "closed":
        return "closed";
      case "rejected":
        return "rejected";
      default:
        return "default";
    }
  };

  const getStatusColor = (statusType) => {
    switch (statusType) {
      case "scheduled":
        return "#3b82f6";
      case "under-review":
        return "#d97706";
      case "closed":
        return "#059669";
      case "rejected":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  const getTimelineSteps = (status) => {
    const norm = status?.toLowerCase() || "";
    const steps = [
      { label: "Submitted", active: true, completed: true },
      { label: "Verified", active: false, completed: false },
      { label: "Active", active: false, completed: false },
      { label: "Completed", active: false, completed: false },
    ];

    if (norm === "rejected") {
      return [
        { label: "Submitted", active: true, completed: true },
        { label: "Rejected", active: true, completed: false, isError: true },
      ];
    }

    if (norm === "pending") {
      steps[1].active = true;
    } else if (norm === "under review") {
      steps[1].active = true;
      steps[1].completed = true;
    } else if (norm === "verified") {
      steps[1].completed = true;
      steps[2].active = true;
    } else if (norm === "active") {
      steps[1].completed = true;
      steps[2].completed = true;
      steps[2].active = true;
    } else if (norm === "completed" || norm === "closed") {
      steps[1].completed = true;
      steps[2].completed = true;
      steps[3].completed = true;
      steps[3].active = true;
    }

    return steps;
  };

  return (
    <div className="case-tracking-container">
      {/* Header */}
      <div className="tracking-header">
        <h2>Case Status Tracking</h2>
      </div>

      {/* Cases List */}
      <div className="cases-wrapper">
        <div className="cases-list">
          {loading ? (
            <div className="skeleton-cases-wrapper" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
              {[1, 2].map((i) => (
                <div key={i} className="case-card" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  {/* Header Skeleton */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-shimmer" style={{ width: "60%", height: "24px", marginBottom: "8px" }} />
                      <div className="skeleton-shimmer" style={{ width: "30%", height: "16px" }} />
                    </div>
                    <div className="skeleton-shimmer" style={{ width: "24px", height: "24px", borderRadius: "4px" }} />
                  </div>
                  {/* Meta Grid Skeleton */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", margin: "1.5rem 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", padding: "1rem 0" }}>
                    {[1, 2, 3, 4].map((m) => (
                      <div key={m} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div className="skeleton-shimmer" style={{ width: "16px", height: "16px", borderRadius: "50%" }} />
                        <div className="skeleton-shimmer" style={{ width: "80px", height: "14px" }} />
                      </div>
                    ))}
                  </div>
                  {/* Timeline Skeleton */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                    {[1, 2, 3, 4].map((t) => (
                      <div key={t} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
                        <div className="skeleton-shimmer" style={{ width: "28px", height: "28px", borderRadius: "50%", zIndex: 2 }} />
                        <div className="skeleton-shimmer" style={{ width: "50px", height: "12px", marginTop: "8px" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : cases.length > 0 ? (
            cases.map((caseItem) => {
              const statusType = getStatusType(caseItem.status);
              const timeline = getTimelineSteps(caseItem.status);
              const formattedDate = caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }) : "N/A";

              return (
                <div key={caseItem._id} className={`case-card ${statusType}`}>
                  {/* Case Header */}
                  <div className="case-header">
                    <div className="case-info">
                      <div className="case-title-row">
                        <h3>{caseItem.DisputeName || "Unnamed Case"}</h3>
                        <span className={`status-badge status-${statusType}`} style={{ color: getStatusColor(statusType), borderColor: getStatusColor(statusType) }}>
                          {caseItem.status || "Pending"}
                        </span>
                      </div>
                      <p className="case-id-text">
                        Case ID: <strong>{caseItem.caseId}</strong>
                      </p>
                    </div>
                    <TrendingUp size={24} color={getStatusColor(statusType)} />
                  </div>

                  {/* Case Metadata Grid */}
                  <div className="case-meta-grid">
                    <div className="meta-item">
                      <Tag size={16} className="meta-icon" />
                      <span>Type: <strong>{caseItem.DisputeType || "N/A"}</strong></span>
                    </div>
                    <div className="meta-item">
                      <DollarSign size={16} className="meta-icon" />
                      <span>Amount: <strong>₹{caseItem.DisputeAmount || "N/A"}</strong></span>
                    </div>
                    <div className="meta-item">
                      <Calendar size={16} className="meta-icon" />
                      <span>Filed: <strong>{formattedDate}</strong></span>
                    </div>
                    <div className="meta-item">
                      <User size={16} className="meta-icon" />
                      <span>Opponent: <strong>{caseItem.oppositePartyName || "N/A"}</strong></span>
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div className="case-timeline">
                    {timeline.map((step, idx) => (
                      <div key={idx} className={`timeline-step ${step.completed ? "completed" : ""} ${step.active ? "active" : ""} ${step.isError ? "error" : ""}`}>
                        <div className="step-circle">{step.isError ? "✕" : (step.completed ? "✓" : idx + 1)}</div>
                        <span className="step-label">{step.label}</span>
                        {idx < timeline.length - 1 && <div className="step-line" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="empty-state"
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "3rem 1.5rem",
                textAlign: "center",
                color: "#718096",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                border: "1px dashed #cbd5e0",
              }}
            >
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: "500" }}>
                No cases filed yet.
              </p>
              <p style={{ margin: "8px 0 0 0", fontSize: "0.85rem" }}>
                You can file a new dispute case using the "File Case" page in the sidebar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

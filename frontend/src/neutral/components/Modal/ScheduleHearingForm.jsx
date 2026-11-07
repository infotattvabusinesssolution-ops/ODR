import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { toast } from "react-toastify";
import { Video, Calendar, Clock, MapPin, User, FileText, CheckCircle2 } from "lucide-react";
import { documentDetailsApi } from "../../../api/AdminApi";

export default function ScheduleHearingForm({ onClose, onSuccess }) {
  const neutralId = localStorage.getItem("userId") || "";
  const neutralName = localStorage.getItem("username") || localStorage.getItem("userName") || "Presiding Mediator";

  // Helper for generating Google Meet style codes: xxx-yyyy-zzz
  const generateMeetCode = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
  };

  const [assignedCases, setAssignedCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    caseName: "",
    caseId: "",
    hearingType: "Joint session",
    date: new Date().toISOString().slice(0, 10),
    time: "10:30",
    duration: "1.5",
    location: "Virtual Courtroom (Google Meet)",
    judge: neutralName,
    notes: "",
    meetLink: generateMeetCode(),
    neutralId: neutralId,
  });

  // Fetch assigned cases for easy one-click selection
  useEffect(() => {
    const fetchCases = async () => {
      setLoadingCases(true);
      try {
        const targetId = neutralId || "all";
        const res = await axiosInstance.get(`/admin/get-assign-cases/${targetId}`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAssignedCases(res.data.data);
        }
      } catch (err) {
        console.warn("Could not load assigned cases list for dropdown:", err.message);
      } finally {
        setLoadingCases(false);
      }
    };
    fetchCases();
  }, [neutralId]);

  const handleCaseSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const matched = assignedCases.find((c) => c._id === selectedId || c.caseId === selectedId);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        caseId: matched.caseId || matched._id,
        caseName: matched.DisputeName || matched.caseName || prev.caseName,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateNewMeetLink = () => {
    const newLink = generateMeetCode();
    setFormData((prev) => ({ ...prev, meetLink: newLink }));
    toast.info("Generated new Google Meet link");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.caseName.trim() || !formData.caseId.trim()) {
      toast.warn("Case name and Case ID are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        Judge: formData.judge || neutralName,
        neutralId: neutralId,
      };

      const response = await documentDetailsApi.newScheduleHearing(payload);
      toast.success("Hearing scheduled & meeting link created successfully!");

      if (onSuccess) {
        onSuccess(response.data || response);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error submitting hearing:", error);
      toast.error(error.message || error.response?.data?.message || "Failed to schedule hearing!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxHeight: "88vh", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
        <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#fff7ed", color: "#ea580c" }}>
          <Calendar size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            Schedule New Hearing
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
            Generate dispute hearing sessions with automatic Google Meet integration
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {/* Quick Select from Assigned Cases if available */}
        {assignedCases.length > 0 && (
          <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
              Quick Select from Assigned Cases:
            </label>
            <select
              onChange={handleCaseSelect}
              defaultValue=""
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#fff",
                fontSize: "13px",
              }}
            >
              <option value="">-- Choose one of your assigned cases --</option>
              {assignedCases.map((c) => (
                <option key={c._id || c.caseId} value={c._id || c.caseId}>
                  #{c.caseId} - {c.DisputeName || "Dispute Case"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Case Name & ID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Case Name *
            </label>
            <input
              type="text"
              name="caseName"
              value={formData.caseName}
              onChange={handleChange}
              placeholder="e.g. Smith vs. Johnson"
              required
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Case ID / Docket # *
            </label>
            <input
              type="text"
              name="caseId"
              value={formData.caseId}
              onChange={handleChange}
              placeholder="e.g. ODR-2024-45"
              required
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Meetings Type & Judge */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Meetings Type *
            </label>
            <select
              name="hearingType"
              value={formData.hearingType}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
                backgroundColor: "#fff",
              }}
            >
              <option value="Joint session">Joint session</option>
              <option value="One to One">One to One</option>
              <option value="Evidence walk through">Evidence walk through</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Presiding Mediator / Judge
            </label>
            <input
              type="text"
              name="judge"
              value={formData.judge}
              onChange={handleChange}
              placeholder="Presiding Mediator Name"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Date, Time, Duration */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Time *
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
              Duration (Hrs) *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Location / Virtual Room */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
            Hearing Location / Venue
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Virtual Hearing Chamber / Google Meet"
            required
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Google Meet Link (Automatic & Editable) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
              Google Meet Link *
            </label>
            <button
              type="button"
              onClick={handleGenerateNewMeetLink}
              style={{
                background: "none",
                border: "none",
                color: "#ea580c",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                padding: 0,
              }}
            >
              🔄 Refresh Code
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="url"
              name="meetLink"
              value={formData.meetLink}
              onChange={handleChange}
              required
              placeholder="https://meet.google.com/xxx-yyyy-zzz"
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                color: "#0369a1",
                fontWeight: "600",
                boxSizing: "border-box",
              }}
            />
            <a
              href={formData.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 14px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <Video size={14} />
              Test Link
            </a>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
            Hearing Agenda / Special Instructions
          </label>
          <textarea
            name="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Specify witness examination sequence, digital evidence submission deadlines, etc."
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "10px 18px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#f8fafc",
              color: "#475569",
              fontSize: "14px",
              fontWeight: "600",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 24px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#ff9900",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "700",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(255,153,0,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {submitting ? "Scheduling..." : "Create Hearing & Meet Link"}
          </button>
        </div>
      </form>
    </div>
  );
}

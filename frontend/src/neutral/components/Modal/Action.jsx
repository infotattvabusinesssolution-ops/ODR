import { useEffect, useState } from "react";
import axios from "axios";

export default function Action({ onClose, caseId }) {
  const statusOptions = [
    "Pending",
    "Rejected",
    "Verified",
    "Active",
    "Completed",
    "Closed",
  ];

  const [activeStatus, setActiveStatus] = useState("Pending");

  // Load current case status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!caseId) return;

      try {
        const res = await axios.get(
          `http://localhost:3636/neutral/get-status/${caseId}`
        );
        setActiveStatus(res.data?.status || "Pending");
      } catch (err) {
        console.log("Error loading status", err);
      }
    };

    fetchStatus();
  }, [caseId]);

  // UPDATE STATUS
  const handleStatusChange = async (newStatus) => {
    setActiveStatus(newStatus);

    try {
      await axios.put(
        `http://localhost:3636/neutral/update-status/${caseId}`,
        { status: newStatus }
      );

      console.log("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div
      className="w-full"
      style={{
        padding: window.innerWidth < 480 ? "20px" : "50px",
        maxHeight: "85vh",
        overflowY: "auto",
      }}
    >
      <h2 className="text-xl font-bold mb-4">Update Action</h2>

      <h1>Account Status Filters</h1>

      <div
        className="status-control-group"
        style={{ display: "flex", gap: 10 }}
      >
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className={`status-button ${
              activeStatus === status ? "active" : ""
            }`}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border:
                activeStatus === status ? "2px solid #0bb" : "1px solid #ccc",
              background: activeStatus === status ? "#0bb" : "#f5f5f5",
              color: activeStatus === status ? "#fff" : "#333",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      <p style={{ marginTop: "20px", fontSize: "1.1em" }}>
        Currently selected: <strong>{activeStatus}</strong>
      </p>
    </div>
  );
}

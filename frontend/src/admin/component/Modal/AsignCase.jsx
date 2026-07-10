import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { NeutralApi } from "../../../api/NeutralApi";

const AsignCase = ({ selectedCaseId, onClose, reload }) => {
  const [neutralData, setNeutralData] = useState([]);
  const [selectedNeutralId, setSelectedNeutralId] = useState("");

  useEffect(() => {
    const getAllNeutral = async () => {
      const response = await NeutralApi.getAllNeutral();
      setNeutralData(response.data);
      console.log(response.data);
    };
    getAllNeutral();
  }, []);

  
  // AsignCase.jsx — handleAssignCase
  const handleAssignCase = async () => {
    if (!selectedNeutralId) {
      toast.warning("Please select a neutral");
      return;
    }

    try {
      const res = await axios.put(
        "http://localhost:3636/admin/assign-all-cases",
        {
          caseId: selectedCaseId,
          neutralId: selectedNeutralId,
        }
        // add headers if auth required: { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(res.data);
      toast.success("Case Assigned Successfully!");
      reload && reload(); // optional: refresh parent
      onClose();
    } catch (error) {
      console.error(
        "Assign error:",
        error.response ? error.response.data : error
      );
      toast.error("Error assigning case");
    }
  };

  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <h3
        style={{
          marginBottom: "20px",
          fontWeight: "600",
          color: "#333",
          textAlign: "center",
        }}
      >
        Assign Neutral
      </h3>

      <label style={{ fontWeight: "500", color: "#555" }}>
        Select Neutral:
      </label>
      <select
        className="form-select"
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "5px",
          borderRadius: "8px",
          borderColor: "#ccc",
        }}
        onChange={(e) => setSelectedNeutralId(e.target.value)}
      >
        <option value="">Select Neutral</option>
        {neutralData.map((user) => (
          <option key={user._id} value={user._id}>
            {user.name}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            fontWeight: "600",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            cursor: "pointer",
            transition: "0.2s ease-in-out",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#218838")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#28a745")}
          onClick={handleAssignCase}
        >
          Assign
        </button>

        <button
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            fontWeight: "600",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            cursor: "pointer",
            transition: "0.2s ease-in-out",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#5a636a")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#6c757d")}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AsignCase;

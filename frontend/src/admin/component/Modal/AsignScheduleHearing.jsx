import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { NeutralApi } from "../../../api/NeutralApi";
import { ClaimantApi } from "../../../api/ClaimantApi";

const AsignCase = ({ selectedCaseId, onClose, reload }) => {
  const [neutralData, setNeutralData] = useState([]);

  const [selectedNeutralId, setSelectedNeutralId] = useState("");

  // ⭐ Fetch All Neutrals
  useEffect(() => {
    const getAllNeutral = async () => {
      const res = await NeutralApi.getAllNeutral();
      setNeutralData(res.data);
      console.log("fetch neutral", res.data);
    };
    getAllNeutral();
  }, []);

  // ⭐ Assign Hearing
  const handleAssignHearing = async () => {
    if (!selectedNeutralId) return toast.warning("Select Neutral");

    try {
      const res = await axios.put(
        "http://localhost:3636/admin/schedule-hearing",
        {
          caseId: selectedCaseId,
          neutralId: selectedNeutralId,
        }
      );

      toast.success("Hearing Scheduled!");

      onClose();
    } catch (error) {
      toast.error("Error scheduling hearing");
    }
  };

  return (
    <div style={{ background: "white", padding: "25px", borderRadius: "12px" }}>
      <h3 style={{ textAlign: "center" }}>Schedule Hearing</h3>

      {/* Neutral Select */}
      <label>Select Neutral</label>
      <select
        className="form-select"
        onChange={(e) => setSelectedNeutralId(e.target.value)}
      >
        <option value="">Select Neutral</option>
        {neutralData.map((n) => (
          <option key={n._id} value={n._id}>
            {n.name}
          </option>
        ))}
      </select>

      <button
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "10px",
          background: "green",
          color: "white",
          borderRadius: "8px",
        }}
        onClick={handleAssignHearing}
      >
        Schedule Hearing
      </button>

      <button
        style={{
          marginTop: "10px",
          width: "100%",
          padding: "10px",
          background: "gray",
          color: "white",
          borderRadius: "8px",
        }}
        onClick={onClose}
      >
        Cancel
      </button>
    </div>
  );
};

export default AsignCase;

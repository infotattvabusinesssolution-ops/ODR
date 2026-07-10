// src/admin/component/Modal/NewCaseForm.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Menu, Plus, Paperclip } from "lucide-react";
import { documentDetailsApi } from "../../../api/AdminApi";

export default function ScheduleHearingForm({ onClose }) {
  const [formData, setFormData] = useState({
    caseName: "",
    caseId: "",
    hearingType: "",
    date: "",
    time: "",
    duration: "",
    location: "",
    judge: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // handle submit using axios to post form data
  const handleSubmitAdmin = async (e) => {
    e.preventDefault();

    try {
      const response = await documentDetailsApi.newScheduleHearing(formData);
      console.log("new hirnig", response.data);
      setFormData(response.data);
      toast.success("Hearing created successfully!");
      // RESET FORM
      setFormData({
        caseName: "",
        caseId: "",
        hearingType: "",
        date: "",
        time: "",
        duration: "",
        location: "",
        judge: "",
        notes: "",
      });
      onClose();
    } catch (error) {
      console.error("Error submitting case:", error);
      toast.error(error.response?.data?.message || "Failed to submit hearing!");
    }
  };

  return (
    <div
      className=""
      style={{
        padding: "50px",
        maxHeight: "95vh",
        overflowY: "auto",
      }}
    >
      <div className="">
        <div className="px-20">
          <h2 className=" text-3xl " style={{ marginBottom: "30px" }}>
            Hearing Details
          </h2>
          <form onSubmit={handleSubmitAdmin} className="">
            <div className="form-group text-black">
              <label>Case Name</label>

              <input
                type="text"
                name="caseName"
                value={formData.caseName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter Case Name"
                required
              />
            </div>
            <div className="form-group text-black">
              <label>Case Id</label>

              <input
                type="text"
                name="caseId"
                value={formData.caseId}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter Case Id"
                required
              />
            </div>

            <div className="form-group">
              <label>Hearing Type</label>
              <select
                name="hearingType"
                value={formData.hearingType}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Type</option>
                <option value="InitialHearing">Initial Hearing</option>
                <option value="PreTrialConference">Pre-trial Conference</option>
                <option value="EvidenceHearing">Evidence Hearing</option>
                <option value="FinalHearing">Final Hearing</option>
              </select>
            </div>
            <div className="form-group text-black">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            {/* Opposite Party Name */}

            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (hrs)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="1 or 1.5"
                required
              />
            </div>
            {/* Opposite Party Mobile */}

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Virtual Courtroom / District Court Room 3"
                required
              />
            </div>
            <div className="form-group text-black">
              <label>Judge Name</label>
              <select
                name="judge"
                value={formData.judge}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Case">Select Judge</option>
                <option value="JudgeA">Judge A</option>
                <option value="JudgeB">Judge B</option>
                <option value="JudgeC">Judge C</option>
                <option value="JudgeD">Judge D</option>
                <option value="JudgeE">Judge E</option>
                <option value="JudgeF">Judge F</option>
              </select>
            </div>

            <div className="form-group text-black">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Additional details…"
              ></textarea>
            </div>

            <button
              type="submit"
              className="submit-btn"
              style={{ width: "100%" }}
            >
              {/* <Plus size={20} /> */}
              Create Hearing
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

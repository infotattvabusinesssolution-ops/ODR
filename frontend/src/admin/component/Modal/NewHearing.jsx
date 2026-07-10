// src/admin/component/Modal/NewCaseForm.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Menu, Plus, Paperclip } from "lucide-react";
import { documentDetailsApi } from "../../../api/AdminApi";
import { caseApi } from "../../../api/AdminApi";

export default function ScheduleHearing({ onClose }) {
  const [newHearingData, setNewHearingData] = useState([]);
  const [formData, setFormData] = useState({
    caseName: "",
    caseId: "",
    Judge: "",
    hearingType: "",
    date: "",
    time: "",
    duration: "",
    location: "",
    notes: "",
    meetLink: "https://meet.google.com/tky-hnhr-yfu",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const getNewHearingData = async () => {
      try {
        const response = await caseApi.getAllCases();
        setNewHearingData(response.data);
        // setTotalData(response);
        console.log(response.data);
      } catch (error) {
        console.log("data fetched error", error);
      }
    };
    getNewHearingData();
  }, []);

  const submitHearing = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3636/admin/new-hearing",
        formData
      );

      toast.success("Hearing Scheduled Successfully!");

      console.log(response.data);

      setFormData({
        caseName: "",
        caseId: "",
        Judge: "",
        hearingType: "",
        date: "",
        time: "",
        duration: "",
        location: "",
        notes: "",
        meetLink: "",
      });

      if (onClose) {
        onClose(); // 🔥 Call close function
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to schedule hearing!"
      );
      console.error(error);
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
          <form onSubmit={submitHearing} className="">
            <div className="form-group">
              <label>Case Name</label>
              <select
                name="caseName"
                value={formData.caseName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Case Name</option>
                {newHearingData &&
                  newHearingData.map((item, index) => (
                    <option key={item._id} value={item.caseName}>
                      {` ${item.DisputeName} vs ${item.oppositePartyName}`}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Case Id</label>
              <select
                name="caseId"
                value={formData.caseId}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Case Id</option>
                {newHearingData &&
                  newHearingData.map((item) => (
                    <option key={item._id} value={item.caseId}>
                      {item.caseId}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Judge</label>
              <select
                name="Judge"
                value={formData.Judge}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Judge Name</option>
                {newHearingData &&
                  newHearingData.map((item, index) => (
                    <option key={item._id} value={item.Judge}>
                      {`${item.neutral?.name}`}
                    </option>
                  ))}
              </select>
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
            {/* <div className="form-group text-black">
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
            </div> */}

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

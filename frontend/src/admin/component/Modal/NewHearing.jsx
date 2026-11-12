// src/admin/component/Modal/NewCaseForm.jsx
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { Menu, Plus, Paperclip } from "lucide-react";
import axiosInstance from "../../../api/axiosConfig";
import { caseApi } from "../../../api/AdminApi";

const GENERIC_NEUTRAL_NAMES = new Set(["Neutral User", "User", "Firebase User"]);

function getNeutralDisplayName(neutral, fallback = "") {
  if (neutral?.name && !GENERIC_NEUTRAL_NAMES.has(neutral.name)) {
    return neutral.name;
  }
  return neutral?.email || fallback || "";
}

export default function ScheduleHearing({ onClose }) {
  const [newHearingData, setNewHearingData] = useState([]);
  const [formData, setFormData] = useState({
    caseName: "",
    caseId: "",
    Judge: "",
    neutralId: "",
    hearingType: "",
    date: "",
    time: "",
    duration: "",
    location: "",
    notes: "",
    meetLink: "https://meet.google.com/tky-hnhr-yfu",
  });

  const neutralOptions = useMemo(() => {
    const map = new Map();
    for (const item of newHearingData || []) {
      const label = getNeutralDisplayName(item.neutral, item.Judge);
      if (!label) continue;
      const key = item.neutral?._id || label;
      if (!map.has(key)) {
        map.set(key, {
          key,
          neutralId: item.neutral?._id || "",
          label,
        });
      }
    }
    return Array.from(map.values());
  }, [newHearingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "caseName" || name === "caseId") {
      const matchedCase = (newHearingData || []).find((item) =>
        name === "caseId"
          ? item.caseId === value
          : (item.DisputeName || item.caseName) === value
      );
      if (matchedCase) {
        const neutralName = getNeutralDisplayName(matchedCase.neutral, matchedCase.Judge);
        setFormData((prev) => ({
          ...prev,
          caseName: matchedCase.DisputeName || matchedCase.caseName || value,
          caseId: matchedCase.caseId || prev.caseId,
          Judge: neutralName || prev.Judge,
          neutralId: matchedCase.neutral?._id || "",
        }));
        return;
      }
    }

    if (name === "Judge") {
      const matchedNeutral = neutralOptions.find((opt) => opt.label === value);
      setFormData((prev) => ({
        ...prev,
        Judge: value,
        neutralId: matchedNeutral?.neutralId || "",
      }));
      return;
    }

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
      const response = await axiosInstance.post("/admin/new-hearing", formData);

      toast.success("Session Scheduled Successfully!");

      console.log(response.data);

      setFormData({
        caseName: "",
        caseId: "",
        Judge: "",
        neutralId: "",
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
        error.response?.data?.message || "Failed to schedule session!"
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
            Session Details
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
                  newHearingData.map((item) => (
                    <option key={item._id} value={item.DisputeName || item.caseName || ""}>
                      {`${item.DisputeName || "Dispute"} vs ${item.oppositePartyName || "Respondent"}`}
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
              <label>Mediator / Judge</label>
              <select
                name="Judge"
                value={formData.Judge}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Mediator / Judge</option>
                {neutralOptions.map((opt) => (
                  <option key={opt.key} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Meetings Type</label>
              <select
                name="hearingType"
                value={formData.hearingType}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Type</option>
                <option value="Joint session">Joint session</option>
                <option value="One to One">One to One</option>
                <option value="Evidence walk through">Evidence walk through</option>
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
              Schedule Session
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

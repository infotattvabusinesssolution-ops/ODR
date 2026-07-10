// src/admin/component/Modal/EditCaseForm.jsx
import { useState, useEffect } from "react";
import { Paperclip } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function EditCaseForm({ caseData, onClose }) {
  const [formData, setFormData] = useState({
    requestType: "Case",
    DisputeName: "",
    DisputeSummary: "",
    oppositePartyName: "",
    mobileNumber: "",
    file: null,
  });

  // ✅ Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle file change (admin upload new file)
  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      file: e.target.files[0],
    }));
  };

  // ✅ Load case data when the modal opens or caseData changes
  useEffect(() => {
    if (caseData) {
      setFormData({
        requestType: caseData.requestType || "",
        DisputeName: caseData.DisputeName || "",
        oppositePartyName: caseData.oppositePartyName || "",
        DisputeSummary: caseData.DisputeSummary || "",
        mobileNumber: caseData.mobileNumber || "", // <-- here
        file: caseData.file || null,
      });
    }
  }, [caseData]);

  // ✅ Submit edited data (to backend API)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const {
        requestType,
        DisputeName,
        oppositePartyName,
        mobileNumber,
        DisputeSummary,
        file,
      } = formData;

      const formDataToSend = new FormData();
      formDataToSend.append("requestType", requestType);
      formDataToSend.append("DisputeName", DisputeName);
      formDataToSend.append("oppositePartyName", oppositePartyName);
      formDataToSend.append("mobileNumber", mobileNumber);
      formDataToSend.append("DisputeSummary", DisputeSummary);
      if (file) {
        formDataToSend.append("file", file);
      }

      await axios.put(
        `http://localhost:3636/admin/update-case/${caseData._id}`,
        formDataToSend
      );

      console.log("data", caseData);
      toast.success("Case updated successfully!");
      onClose();
    } catch (error) {
      console.error("❌ Error editing case:", error);
    }
  };

  return (
    <div className="">
      <div className=" " style={{ padding: "20px" }}>
        <h2>Dispute Type</h2>
      </div>

      {/* ✅ Scrollable area */}
      <div
        className="scrollable-form"
        style={{
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "20px",
          scrollbarWidth: "thin",
          scrollbarColor: "#aaa #f1f1f1",
        }}
      >
        <form
          onSubmit={handleSubmit}
          action="/upload"
          method="post"
          encType="multipart/form-data"
        >
          {/* Request Type */}
          <div className="form-group">
            <label>Request Type</label>
            <select
              name="requestType"
              value={formData.requestType}
              onChange={handleChange}
              className="form-select"
            >
              <option value="Case">Case</option>
              <option value="Dispute-1">Dispute - 1</option>
              <option value="Dispute-2">Dispute - 2</option>
              <option value="Dispute-3">Dispute - 3</option>
              <option value="Dispute-4">Dispute - 4</option>
              <option value="Dispute-5">Dispute - 5</option>
            </select>
          </div>

          {/* Dispute Name */}
          <div className="form-group">
            <label>Dispute Name</label>
            <input
              type="text"
              name="DisputeName"
              placeholder="Enter Dispute Name"
              value={formData.DisputeName}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Opposite Party Section */}
          <div
            className="mt-10 p-5 rounded-xl border border-gray-200"
            style={{ marginTop: "5px" }}
          >
            <h3
              className="text-lg font-semibold text-gray-600 mb-4"
              style={{ margin: "5px" }}
            >
              Opposite Party Details
            </h3>

            {/* Opposite Party Name */}
            <div className="form-group" style={{ margin: "5px" }}>
              <label>Name</label>
              <input
                type="text"
                name="oppositePartyName"
                placeholder="Enter Opposite Party Name"
                value={formData.oppositePartyName}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            {/* Opposite Party Mobile */}
            <div className="form-group" style={{ margin: "5px" }}>
              <label>Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                placeholder="Enter Mobile Number"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Dispute Summary */}
          <div className="form-group">
            <label>Dispute Summary</label>
            <textarea
              name="DisputeSummary"
              placeholder="Enter Dispute Summary"
              value={formData.DisputeSummary}
              onChange={handleChange}
              className="form-textarea"
              rows="4"
            />
          </div>

          {/* File Upload */}
          <div className="form-group file-group">
            <div className="file-input-wrapper">
              <Paperclip size={20} />
              <span>
                {formData.file ? "File attached" : "No file attached"}
              </span>
              <label htmlFor="file-input" className="attach-file-label">
                Attach File
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
            {formData.file && (
              <p className="file-name">Attached: {formData.file.name}</p>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn w-full">
            Update
          </button>
        </form>
      </div>
    </div>
  );
}

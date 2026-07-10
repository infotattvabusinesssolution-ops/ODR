// src/admin/component/Modal/NewCaseForm.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Paperclip } from "lucide-react";

export default function uploadDocument({ onClose, respondentId }) {
  const [formData, setFormData] = useState({
    file: null,
    caseId: "", // ⭐ NEW – store case ID
  });

  const email = localStorage.getItem("userEmail");
  const [respondentOwnCase, setrespondentOwnCase] = useState([]);

  // ⭐ Fetch all cases by email
  useEffect(() => {
    const fetchClaimantOwnCase = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";
        const res = await axios.post(
          `${API_BASE_URL}/claimant/get-own-claimant-case`,
          { email }
        );

        setrespondentOwnCase(res.data);
        console.log("Fetched claimant own case:", res.data);
      } catch (error) {
        console.log("Fetch claimant own case error:", error);
      }
    };

    fetchClaimantOwnCase();
  }, []);

  // Handle file input
  const handleFileChangeAdmin = (e) => {
    setFormData((prev) => ({
      ...prev,
      file: e.target.files[0],
    }));
  };

  // ⭐ NEW: Handle selecting caseId
  const handleCaseSelect = (e) => {
    setFormData((prev) => ({
      ...prev,
      caseId: e.target.value,
    }));
  };

  // Submit form
  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    try {
      const { file, caseId } = formData;

      if (!caseId) {
        toast.error("Please select a Case ID");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("caseId", caseId); // ⭐ send case ID
      formDataToSend.append("claimantEmail", email); // optional for backend
      if (file) formDataToSend.append("file", file);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";
      const response = await axios.post(
        `${API_BASE_URL}/claimant/document-upload-by-claimant/${respondentId}`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Response data:", response.data);
      toast.success("Document uploaded successfully!");
      onClose();
    } catch (error) {
      console.error("Error submitting case:", error);
      toast.error("Failed to upload document!");
    }
  };

  return (
    <div
      style={{
        padding: "50px",
        maxHeight: "95vh",
        overflowY: "auto",
      }}
    >
      <div className="px-20">
        <h2 className="text-3xl mb-6">Upload Document</h2>

        <form onSubmit={handleSubmitAdmin}>
          {/* ⭐ Case ID Select Dropdown */}
          <div className="mb-5">
            <label className="block text-lg mb-2">Select Case ID</label>
            <select
              className="w-full p-3 border rounded"
              value={formData.caseId}
              onChange={handleCaseSelect}
            >
              <option value="">-- Select Case --</option>
              {respondentOwnCase.length > 0 &&
                respondentOwnCase.map((c) => (
                  <option key={c._id} value={c.caseId}>
                    {c.caseId}
                  </option>
                ))}
            </select>
          </div>

          {/* File Upload */}
          <div className="form-group file-group">
            <div className="file-input-wrapper text-black">
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
                onChange={handleFileChangeAdmin}
                style={{ display: "none" }}
              />
            </div>

            {formData.file && (
              <p className="file-name mt-2">Attached: {formData.file.name}</p>
            )}
          </div>

          <button type="submit" className="submit-btn w-full mt-6">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

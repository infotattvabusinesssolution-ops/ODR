import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Paperclip } from "lucide-react";
import { caseApi } from "../../../api/AdminApi";

export default function UploadDocument({ onClose }) {
  const [file, setFile] = useState(null);
  const [claimants, setClaimants] = useState([]);
  const [selectedClaimant, setSelectedClaimant] = useState("");

  // Fetch all cases (contains claimant details)
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await caseApi.getAllCases();
        setClaimants(res.data); // Case list
      } catch (error) {
        console.error("Error fetching cases:", error);
      }
    };

    fetchCases();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClaimant) {
      toast.error("Please select a claimant");
      return;
    }

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("claimantName", selectedClaimant); // ⭐ ONLY NAME

      await axios.post(
        "http://localhost:3636/admin/document-upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Document uploaded successfully!");
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed!");
    }
  };

  return (
    <div style={{ padding: "50px", maxHeight: "95vh", overflowY: "auto" }}>
      <h2 className="text-3xl mb-6">Upload Document</h2>

      <form onSubmit={handleSubmit}>
        {/* Claimant Dropdown */}
        <div className="mb-4">
          <select
            name="claimantName"
            value={selectedClaimant}
            onChange={(e) => setSelectedClaimant(e.target.value)}
            className="w-full border p-3 rounded"
          >
            <option value="">Select Claimant</option>

            {claimants.map((c) => (
              <option key={c._id} value={c.claimant.name}>
                {c.claimant.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <Paperclip size={20} />
            <span>{file ? file.name : "No file selected"}</span>

            <label
              htmlFor="file-input"
              className="cursor-pointer text-blue-700 underline"
            >
              Choose File
            </label>

            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded"
        >
          Upload
        </button>
      </form>
    </div>
  );
}

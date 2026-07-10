import React, { useState } from "react";
import axios from "axios";

const uploadDocument = ({ caseId }) => {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]); // store all selected files
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append("caseId", caseId);

      files.forEach((file) => {
        formData.append("documents", file); // append each file
      });

      const res = await axios.post(
        "http://localhost:3636/hearing/upload-documents",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert("Uploaded Successfully!");
      console.log(res.data);
    } catch (error) {
      console.log("Upload Failed:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded shadow-md space-y-4">
      <h2 className="font-bold text-lg">Upload Documents</h2>

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="border p-2 rounded w-full"
      />

      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Upload
      </button>

      {files.length > 0 && (
        <div className="text-sm text-gray-700">
          <strong>Selected Files:</strong>
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default uploadDocument;

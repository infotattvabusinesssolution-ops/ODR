import React from "react";

const ViewFile = ({ onClose }) => {
  return (
    <div>
      <div style={{ padding: "20px" }}>
        <div className="px-20">
          <h2 className="text-3xl" style={{ marginBottom: "30px" }}>
            View Attached File
          </h2>
          <div
            className="flex flex-col items-center gap-4 overflow-y-auto"
            style={{
              maxHeight: "400px", // limit the visible area height
              width: "100%",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <img
              src="https://res.cloudinary.com/demo/image/upload/v1693456789/sample.jpg"
              alt="Case Document"
              style={{ width: "100%", height: "auto", borderRadius: "8px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFile;

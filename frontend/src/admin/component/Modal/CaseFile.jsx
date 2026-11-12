// src/admin/component/Modal/CaseFile.jsx
import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { Paperclip, UploadCloud, CheckCircle2, Trash2, FileText } from "lucide-react";
import axiosInstance from "../../../api/axiosConfig";

export default function CaseFile({ onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    DisputeType: "Civil",
    DisputeName: "",
    DisputeAmount: "AmountOneCror",
    oppositePartyName: "",
    oppositePartyEmail: "",
    mobileNumber: "",
    oppositeMobile: "",
    CustomersName: "",
    CustomersEmail: "",
    CustomersMobileNumber: "",
    CustomersAadharNumber: "",
    consent: "Yes",
    file: null,
  });

  const handleChangeAdmin = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "mobileNumber" ? { oppositeMobile: value } : {}),
    }));
  };

  const handleSelectedFile = (selectedFile) => {
    if (!selectedFile) return;

    // Optional client-side file size check (15MB max)
    if (selectedFile.size > 15 * 1024 * 1024) {
      toast.error("File is too large. Please select a file under 15MB.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      file: selectedFile,
    }));
  };

  const handleFileChangeAdmin = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFormData((prev) => ({
      ...prev,
      file: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();

    if (!formData.DisputeName.trim()) {
      toast.warn("Please enter a dispute name");
      return;
    }

    if (!formData.file) {
      toast.warn("Please attach a supporting case file (PDF, DOC, or Image)");
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("DisputeType", formData.DisputeType);
      formDataToSend.append("DisputeName", formData.DisputeName.trim());
      formDataToSend.append("DisputeAmount", formData.DisputeAmount);
      formDataToSend.append("CustomersName", formData.CustomersName.trim());
      formDataToSend.append("CustomersEmail", formData.CustomersEmail.trim());
      formDataToSend.append("CustomersMobileNumber", formData.CustomersMobileNumber.trim());
      formDataToSend.append("CustomersAadharNumber", formData.CustomersAadharNumber.trim());
      formDataToSend.append("oppositePartyName", formData.oppositePartyName.trim());
      formDataToSend.append("oppositePartyEmail", formData.oppositePartyEmail.trim());
      formDataToSend.append("oppositeMobile", (formData.oppositeMobile || formData.mobileNumber).trim());
      formDataToSend.append("mobileNumber", (formData.mobileNumber || formData.oppositeMobile).trim());
      formDataToSend.append("consent", formData.consent || "Yes");
      formDataToSend.append("filedBy", "admin");
      formDataToSend.append("file", formData.file);

      const response = await axiosInstance.post("/claimant/add-new-case", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success || response.status === 201) {
        toast.success("Case created successfully!");
        if (onSuccess) onSuccess(response.data);
        if (onClose) onClose();
      } else {
        toast.error(response.data?.message || "Failed to submit case!");
      }
    } catch (error) {
      console.error("Error submitting case:", error);
      toast.error(error.response?.data?.message || "Failed to submit case. Please check all fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="responsive-container"
      style={{ maxHeight: "88vh", overflowY: "auto", padding: "10px" }}
    >
      <div
        className="responsive-container-inside"
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "#e0f2fe",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Paperclip size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                Add New Case
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Create and file a new dispute case with evidentiary attachments
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitAdmin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Dispute Details Section */}
            <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#334155", marginBottom: "1rem" }}>
                1. Dispute Information
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Dispute Type *
                  </label>
                  <select
                    name="DisputeType"
                    value={formData.DisputeType}
                    onChange={handleChangeAdmin}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#fff",
                      fontSize: "14px",
                    }}
                  >
                    <option value="Civil">Civil Dispute</option>
                    <option value="Criminal">Criminal Dispute</option>
                    <option value="Corporate">Corporate Dispute</option>
                    <option value="Familly">Family Dispute</option>
                    <option value="RealEstate">Real Estate Dispute</option>
                    <option value="Financial">Financial Dispute</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Dispute Amount *
                  </label>
                  <select
                    name="DisputeAmount"
                    value={formData.DisputeAmount}
                    onChange={handleChangeAdmin}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#fff",
                      fontSize: "14px",
                    }}
                  >
                    <option value="AmountOneCror">Less than ₹1 Cr</option>
                    <option value="AmountFiveCror">₹1 Cr to ₹5 Cr</option>
                    <option value="AmountAboveCror">Above ₹5 Cr</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                  Dispute Name / Title *
                </label>
                <input
                  type="text"
                  name="DisputeName"
                  placeholder="e.g. Ramesh Kumar vs ABC Tech Pvt Ltd"
                  value={formData.DisputeName}
                  onChange={handleChangeAdmin}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Claimant / Customer Details */}
            <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#334155", marginBottom: "1rem" }}>
                2. Claimant (Customer) Details
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Customer / Claimant Name *
                  </label>
                  <input
                    type="text"
                    name="CustomersName"
                    placeholder="Enter claimant name"
                    value={formData.CustomersName}
                    onChange={handleChangeAdmin}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="CustomersEmail"
                    placeholder="Enter claimant email"
                    value={formData.CustomersEmail}
                    onChange={handleChangeAdmin}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    name="CustomersMobileNumber"
                    placeholder="Enter mobile number"
                    value={formData.CustomersMobileNumber}
                    onChange={handleChangeAdmin}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Aadhar / ID Number
                  </label>
                  <input
                    type="text"
                    name="CustomersAadharNumber"
                    placeholder="Enter 12-digit Aadhar number"
                    value={formData.CustomersAadharNumber}
                    onChange={handleChangeAdmin}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Opposite Party Details */}
            <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#334155", marginBottom: "1rem" }}>
                3. Opposite Party (Respondent) Details
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Opposite Party Name *
                  </label>
                  <input
                    type="text"
                    name="oppositePartyName"
                    placeholder="Enter opposite party name"
                    value={formData.oppositePartyName}
                    onChange={handleChangeAdmin}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Opposite Party Email
                  </label>
                  <input
                    type="email"
                    name="oppositePartyEmail"
                    placeholder="Enter opposite party email"
                    value={formData.oppositePartyEmail}
                    onChange={handleChangeAdmin}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Opposite Party Mobile
                  </label>
                  <input
                    type="text"
                    name="mobileNumber"
                    placeholder="Enter mobile number"
                    value={formData.mobileNumber}
                    onChange={handleChangeAdmin}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Data Protection Consent
                  </label>
                  <select
                    name="consent"
                    value={formData.consent}
                    onChange={handleChangeAdmin}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#fff",
                      fontSize: "14px",
                    }}
                  >
                    <option value="Yes">Yes, Consent Granted</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ATTACH FILE SECTION */}
            <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#334155", margin: 0 }}>
                  4. Attach Supporting Document / Evidence *
                </h3>
                {formData.file && (
                  <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={15} /> Ready to upload
                  </span>
                )}
              </div>

              {/* Hidden File Input with guaranteed ref */}
              <input
                ref={fileInputRef}
                id="admin-case-file-upload-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                onChange={handleFileChangeAdmin}
                style={{ display: "none" }}
              />

              {!formData.file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? "#0284c7" : "#94a3b8"}`,
                    backgroundColor: isDragging ? "#f0f9ff" : "#ffffff",
                    borderRadius: "8px",
                    padding: "1.75rem 1rem",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "#e0f2fe",
                      color: "#0284c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 0.75rem",
                    }}
                  >
                    <UploadCloud size={24} />
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>
                    Click to browse or drag & drop case file
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "1rem" }}>
                    PDF, DOC, DOCX, JPG, PNG up to 15MB
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    style={{
                      padding: "8px 18px",
                      backgroundColor: "#0284c7",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Paperclip size={15} />
                    Attach File
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "#ecfdf5",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={22} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={formData.file.name}
                      >
                        {formData.file.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {formatFileSize(formData.file.size)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      style={{
                        padding: "6px 10px",
                        backgroundColor: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Remove attached file"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "10px 28px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: isSubmitting ? "#93c5fd" : "#0066cc",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Creating Case & Uploading..." : "Submit Case"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


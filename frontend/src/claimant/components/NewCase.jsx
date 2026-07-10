import { FilePlus, UploadCloud, Paperclip, CheckCircle, ShieldAlert, UserCircle, Briefcase, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import "./NewCase.css";
import axios from "axios";
import { toast } from "react-toastify";
import { ClaimantApi } from "../../api/ClaimantApi";

export default function NewCase() {
  const [neutralData, setNeutralData] = useState([]);

  useEffect(() => {
    const getAllNeutral = async () => {
      try {
        const data = await ClaimantApi.getAllNeutral();
        setNeutralData(data.data);
        console.log(data.data);
      } catch (error) {
        console.error("Error fetching neutrals:", error);
      }
    };
    getAllNeutral();
  }, []);

  const [formData, setFormData] = useState({
    DisputeType: "Dispute",
    DisputeName: "",
    DisputeAmount: "",
    oppositePartyName: "",
    oppositePartyEmail: "",
    oppositeMobile: "",
    CustomersName: "",
    CustomersEmail: "",
    CustomersMobileNumber: "",
    CustomersAadharNumber: "",
    consent: "consentYes",
    neutral: "",
    file: null,
    claimant: localStorage.getItem("userId"),
  });

  const handleChangeAdmin = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChangeAdmin = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        file: e.target.files[0],
      }));
    }
  };

  const removeAttachedFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFormData((prev) => ({
      ...prev,
      file: null,
    }));
  };

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";
      const response = await axios.post(
        `${API_BASE_URL}/claimant/add-new-case`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const generatedCaseId = response.data.caseId;
      localStorage.setItem("caseId", generatedCaseId);

      console.log("Stored caseId:", generatedCaseId);

      toast.success("Case submitted successfully!");
      // Reset form fields
      setFormData({
        DisputeType: "Dispute",
        DisputeName: "",
        DisputeAmount: "",
        oppositePartyName: "",
        oppositePartyEmail: "",
        oppositeMobile: "",
        CustomersName: "",
        CustomersEmail: "",
        CustomersMobileNumber: "",
        CustomersAadharNumber: "",
        consent: "consentYes",
        neutral: "",
        file: null,
        claimant: localStorage.getItem("userId"),
      });
    } catch (error) {
      console.error("Error submitting case:", error);
      toast.error(error.response?.data?.message || "Failed to submit case!");
    }
  };

  return (
    <div className="new-case-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-icon-wrapper">
            <FilePlus size={16} />
          </div>
          <h1 className="page-title">File a New Dispute Case</h1>
        </div>
        <p className="page-subtitle">
          Initiate your online dispute resolution case. Enter all details below and attach supporting files to begin.
        </p>
      </div>

      {/* Form Grid */}
      <form onSubmit={handleSubmitAdmin} className="form-grid">
        
        {/* Section 1: Dispute Information */}
        <div className="form-card">
          <h3 className="form-card-title">
            <Briefcase size={18} style={{ color: "#4f46e5" }} />
            Dispute Information
          </h3>

          <div className="form-group">
            <label>Dispute Type</label>
            <select
              name="DisputeType"
              value={formData.DisputeType}
              onChange={handleChangeAdmin}
              className="form-select"
            >
              <option value="Dispute">Select Dispute Type</option>
              <option value="Criminal">Criminal Dispute</option>
              <option value="Civil">Civil Dispute</option>
              <option value="Corporate">Corporate/Commercial Dispute</option>
              <option value="Familly">Family Dispute</option>
              <option value="RealEstate">Real Estate Dispute</option>
              <option value="Financial">Financial Dispute</option>
            </select>
          </div>

          <div className="form-group">
            <label>Dispute Name</label>
            <input
              type="text"
              name="DisputeName"
              placeholder="e.g., Unpaid Services Invoice #1024"
              value={formData.DisputeName}
              onChange={handleChangeAdmin}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Dispute Amount Range</label>
            <select
              name="DisputeAmount"
              value={formData.DisputeAmount}
              onChange={handleChangeAdmin}
              className="form-select"
            >
              <option value="">Select Dispute Value</option>
              <option value="AmountOneCror">Less than ₹1 Cr</option>
              <option value="AmountFiveCror">₹1 Cr to ₹5 Cr</option>
              <option value="AmountAboveCror">Above ₹5 Cr</option>
            </select>
          </div>

          <div className="form-group">
            <label>Assigned Neutral (Arbitrator/Mediator)</label>
            <select
              name="neutral"
              value={formData.neutral}
              onChange={handleChangeAdmin}
              className="form-select"
              required
            >
              <option value="">Select Neutral Expert</option>
              {neutralData && neutralData.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Claimant (Customer) Details */}
        <div className="form-card">
          <h3 className="form-card-title">
            <UserCircle size={18} style={{ color: "#10b981" }} />
            Claimant (Your) Information
          </h3>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="CustomersName"
              placeholder="Enter claimant name"
              value={formData.CustomersName}
              onChange={handleChangeAdmin}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="CustomersEmail"
              placeholder="Enter email address"
              value={formData.CustomersEmail}
              onChange={handleChangeAdmin}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              name="CustomersMobileNumber"
              placeholder="Enter 10-digit mobile number"
              value={formData.CustomersMobileNumber}
              onChange={handleChangeAdmin}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Aadhar Number</label>
            <input
              type="text"
              name="CustomersAadharNumber"
              placeholder="Enter 12-digit Aadhar number"
              value={formData.CustomersAadharNumber}
              onChange={handleChangeAdmin}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Section 3: Respondent (Opposite Party) Details */}
        <div className="form-card">
          <h3 className="form-card-title">
            <UserCircle size={18} style={{ color: "#ef4444" }} />
            Respondent (Opposite Party) Information
          </h3>

          <div className="form-group">
            <label>Respondent Full Name</label>
            <input
              type="text"
              name="oppositePartyName"
              placeholder="Enter opposite party name"
              value={formData.oppositePartyName}
              onChange={handleChangeAdmin}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Respondent Email Address</label>
            <input
              type="email"
              name="oppositePartyEmail"
              placeholder="Enter opposite party email"
              value={formData.oppositePartyEmail}
              onChange={handleChangeAdmin}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Respondent Mobile Number</label>
            <input
              type="tel"
              name="oppositeMobile"
              placeholder="Enter opposite party mobile number"
              value={formData.oppositeMobile}
              onChange={handleChangeAdmin}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Section 4: File Upload & Consent */}
        <div className="form-card">
          <h3 className="form-card-title">
            <Paperclip size={18} style={{ color: "#8b5cf6" }} />
            Evidence & Legal Consent
          </h3>

          <div className="form-group">
            <label>Evidentiary File (PDF / Images / Docs)</label>
            
            {formData.file ? (
              <div className="file-attached-info">
                <CheckCircle size={18} style={{ color: "#10b981" }} />
                <span className="file-attached-text">
                  Attached: {formData.file.name}
                </span>
                <button className="remove-file-btn" onClick={removeAttachedFile}>
                  Remove
                </button>
              </div>
            ) : (
              <label className="file-upload-zone">
                <div className="upload-icon-wrapper">
                  <UploadCloud size={22} />
                </div>
                <div className="upload-text">
                  Click to browse or drag case document files here
                </div>
                <div className="upload-hint">
                  Supports PDF, DOC, DOCX up to 10MB
                </div>
                <input
                  type="file"
                  onChange={handleFileChangeAdmin}
                  style={{ display: "none" }}
                  required
                />
              </label>
            )}
          </div>

          <div className="form-group">
            <label>Data Privacy & Consent</label>
            <select
              name="consent"
              value={formData.consent}
              onChange={handleChangeAdmin}
              className="form-select"
            >
              <option value="consentYes">Yes, I consent to the terms of service and data protection acts</option>
              <option value="consentNo">No, I do not consent</option>
            </select>
          </div>
        </div>

        {/* Full-width Actions bar */}
        <div className="form-card-full submit-action-bar">
          <button type="submit" className="submit-btn-premium">
            <Plus size={18} />
            Submit Dispute Case
          </button>
        </div>

      </form>
    </div>
  );
}

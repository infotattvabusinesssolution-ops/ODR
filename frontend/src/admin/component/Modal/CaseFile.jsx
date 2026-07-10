// src/admin/component/Modal/NewCaseForm.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Menu, Plus, Paperclip } from "lucide-react";
import { caseApi } from "../../../api/AdminApi";

export default function NewCaseForm({ onClose }) {
  const [claimantData, setClaimantData] = useState([]);
  const [formData, setFormData] = useState({
    DisputeType: "Dispute",
    DisputeName: "",
    DisputeAmount: "",
    oppositePartyName: "",
    oppositePartyEmail: "",
    mobileNumber: "",
    CustomersName: "",
    CustomersEmail: "",
    CustomersMobileNumber: "",
    CustomersAadharNumber: "",
    consent: "",
    file: null,
  });

  useEffect(() => {
    const getNewHearingData = async () => {
      try {
        const response = await caseApi.getAllCases();
        setClaimantData(response.data);
        // setTotalData(response);
        console.log(response.data);
      } catch (error) {
        console.log("data fetched error", error);
      }
    };
    getNewHearingData();
  }, []);
  const handleChangeAdmin = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChangeAdmin = (e) => {
    setFormData((prev) => ({
      ...prev,
      file: e.target.files[0],
    }));
  };

  // handle submit using axios to post form data
  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });

      const response = await axios.post(
        "http://localhost:3636/claimant/add-new-case",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success("Case submitted successfully!");
      onClose(); // 💡 Now close after success
    } catch (error) {
      console.error("Error submitting case:", error);
      toast.error(error.response?.data?.message || "Failed to submit case!");
    }
  };

  return (
    <div
      className="responsive-container"
      style={{ maxHeight: "95vh", overflowY: "auto" }}
    >
      <div
        className="responsive-container-inside"
        style={{ border: "2px solid black", borderRadius: "10px" }}
      >
        <div className="px-20">
          <h2 className=" text-3xl " style={{ marginBottom: "30px" }}>
            Dispute Details
          </h2>

          <form onSubmit={handleSubmitAdmin}>
            <div className="form-group text-black">
              <label>Dispute type</label>
              <select
                name="DisputeType"
                value={formData.DisputeType}
                onChange={handleChangeAdmin}
                className="form-select"
              >
                <option value="Dispute">Select Dispute</option>
                <option value="Criminal">Criminal Dispute</option>
                <option value="Civil">Civil Dispute</option>
                <option value="Corporate">Corporate Dispute</option>
                <option value="Familly">Familly Dispute</option>
                <option value="RealEstate">Real Estate Dispute</option>
                <option value="Financial">Financial Dispute</option>
              </select>
            </div>

            <div className="form-group">
              <label>Dispute Name</label>
              <input
                type="text"
                name="DisputeName"
                placeholder="Enter Dispute Name"
                value={formData.DisputeName}
                onChange={handleChangeAdmin}
                className="form-input"
              />
            </div>

            <div className="form-group text-black">
              <label>Dispute Amount</label>
              <select
                name="DisputeAmount"
                value={formData.DisputeAmount}
                onChange={handleChangeAdmin}
                className="form-select"
              >
                <option value="DisputeAmount">Select Amount</option>
                <option value="AmountOneCror">Less than ₹1 Cr</option>
                <option value="AmountFiveCror">₹1 Cr to ₹5 Cr</option>
                <option value="AmountAboveCror">Above ₹5 Cr</option>
              </select>
            </div>

            <div className="mt-10 p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-600 mb-4">
                Customer Details
              </h3>

              <div className="form-group">
                <label> Customers Name</label>
                <input
                  type="text"
                  name="CustomersName"
                  placeholder="Enter Opposite Party Name"
                  value={formData.CustomersName}
                  onChange={handleChangeAdmin}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="CustomersEmail"
                  placeholder="Enter Opposite Party Email"
                  value={formData.CustomersEmail}
                  onChange={handleChangeAdmin}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>MobileNumber</label>
                <input
                  type="text"
                  name="CustomersMobileNumber"
                  placeholder="Enter Opposite Party Mobile Number"
                  value={formData.CustomersMobileNumber}
                  onChange={handleChangeAdmin}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>AadharNumber</label>
                <input
                  type="text"
                  name="CustomersAadharNumber"
                  placeholder="Enter Opposite Party Mobile Number"
                  value={formData.CustomersAadharNumber}
                  onChange={handleChangeAdmin}
                  className="form-input"
                />
              </div>
            </div>
            <div className="mt-10 p-5 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-600 mb-4">
                Opposite Party Details
              </h3>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="oppositePartyName"
                  placeholder="Enter Opposite Party Name"
                  value={formData.oppositePartyName}
                  onChange={handleChangeAdmin}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="oppositePartyEmail"
                  placeholder="Enter Opposite Party Email"
                  value={formData.oppositePartyEmail}
                  onChange={handleChangeAdmin}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="text"
                  name="mobileNumber"
                  placeholder="Enter Opposite Party Mobile Number"
                  value={formData.mobileNumber}
                  onChange={handleChangeAdmin}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group text-black">
              <label>Consent as Per Data Protection Acts</label>
              <select
                name="consent"
                value={formData.consent}
                onChange={handleChangeAdmin}
                className="form-select"
              >
                <option value="consentYes">Yes</option>
                <option value="consentNo">No</option>
              </select>
            </div>

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
                <p className="file-name">Attached: {formData.file.name}</p>
              )}
            </div>

            <button
              type="submit"
              className="submit-btn"
              style={{ width: "100%" }}
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

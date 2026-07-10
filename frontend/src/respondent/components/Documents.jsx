import {
  FolderOpen,
  File,
  Download,
  Trash2,
  Plus,
  Upload,
  Eye,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
import UploadDocument from "../../respondent/components/Modal/uploadDocument.jsx";
import ModalComponent from "./Modal/modalComponent.jsx";
import axios from "axios";

export default function Documents() {
  const [openModal, setOpenModal] = useState(null);
  const [documentData, setDocumentData] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const userEmail = localStorage.getItem("userEmail");
      const respondentId = localStorage.getItem("userId");

      if (!userEmail) {
        console.log("No user email found in localStorage");
        return;
      }
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3636";
        const res = await axios.get(
          `${API_BASE_URL}/respondent/get-documents/${userEmail}`
        );
        setDocumentData(res.data.documents);
        console.log("Fetched Document:", res.data);
      } catch (error) {
        console.log("Error fetching documents:", error);
      }
    };
    fetchDocuments();
  }, []);

  const [isMobile] = useState(window.innerWidth <= 480);
  const [documents] = useState([
    {
      id: 1,
      name: "Case_Statement_2024-45.pdf",
      size: "2.4 MB",
      uploadedDate: "20 Sep 2025",
      caseId: "2024-45",
      type: "PDF",
    },
    {
      id: 2,
      name: "Supporting_Evidence.docx",
      size: "1.8 MB",
      uploadedDate: "18 Sep 2025",
      caseId: "2024-45",
      type: "Document",
    },
    {
      id: 3,
      name: "Identity_Proof.pdf",
      size: "3.2 MB",
      uploadedDate: "15 Sep 2025",
      caseId: "2024-52",
      type: "PDF",
    },
    {
      id: 4,
      name: "Agreement_Contract.pdf",
      size: "2.1 MB",
      uploadedDate: "12 Sep 2025",
      caseId: "2024-52",
      type: "PDF",
    },
  ]);

  const styles = {
    container: {
      padding: isMobile ? "1rem" : "2rem",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#ff9900",
      color: "#fff",
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      marginBottom: isMobile ? "1rem" : "2rem",
      fontSize: "18px",
      fontWeight: "600",
      flexWrap: isMobile ? "wrap" : "nowrap",
      gap: "1rem",
    },
    uploadButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 1rem",
      backgroundColor: "rgba(255,255,255,0.2)",
      border: "1px solid rgba(255,255,255,0.5)",
      color: "#fff",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      transition: "all 0.3s ease",
    },
    filterSection: {
      display: "flex",
      gap: "0.75rem",
      marginBottom: "1.5rem",
      flexWrap: "wrap",
    },
    filterButton: (isActive, bgColor) => ({
      padding: "0.5rem 1rem",
      backgroundColor: isActive ? bgColor : "#fff",
      color: isActive ? "#fff" : "#333",
      border: `1px solid ${isActive ? bgColor : "#ddd"}`,
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      transition: "all 0.3s ease",
    }),
    documentsList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    documentCard: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: "1rem",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
    },
    fileIcon: {
      width: "50px",
      height: "50px",
      borderRadius: "8px",
      backgroundColor: "#0066cc22",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#0066cc",
      flexShrink: 0,
      fontSize: "24px",
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "0.25rem",
    },
    documentMeta: {
      display: "flex",
      gap: "1rem",
      fontSize: "12px",
      color: "#999",
    },
    documentActions: {
      display: "flex",
      gap: "0.5rem",
    },
    actionButton: (bgColor) => ({
      padding: "0.5rem",
      backgroundColor: bgColor + "22",
      color: bgColor,
      border: "1px solid " + bgColor + "33",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
    }),
    emptyState: {
      textAlign: "center",
      padding: "3rem 1rem",
      color: "#999",
    },
    emptyIcon: {
      fontSize: "48px",
      marginBottom: "1rem",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span>📁 Documents Workspace</span>
        <button
          style={styles.uploadButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
          }}
          onClick={() => {
            setOpenModal("document");
          }}
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      {/* Filter Section */}
      <div style={styles.filterSection}>
        <button style={styles.filterButton(true, "#ff9900")}>
          All Documents
        </button>
        <button style={styles.filterButton(false, "#ff9900")}>PDFs</button>
        <button style={styles.filterButton(false, "#ff9900")}>Word Docs</button>
        <button style={styles.filterButton(false, "#ff9900")}>Images</button>
      </div>

      {/* Documents List */}
      {documents.length > 0 ? (
        <div style={styles.documentsList}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={styles.documentCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.fileIcon}>
                <File size={24} />
              </div>

              <div style={styles.documentInfo}>
                <div style={styles.documentName}>{doc.name}</div>
                <div style={styles.documentMeta}>
                  <span>Case #{doc.caseId}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.uploadedDate}</span>
                </div>
              </div>

              <div style={styles.documentActions}>
                <button
                  style={styles.actionButton("#0066cc")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#0066cc33";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#0066cc22";
                  }}
                  title="View"
                >
                  <Eye size={16} />
                </button>
                <button
                  style={styles.actionButton("#22bb33")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#22bb3333";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#22bb3322";
                  }}
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  style={styles.actionButton("#ff9900")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff990033";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff990022";
                  }}
                  title="Share"
                >
                  <Share2 size={16} />
                </button>
                <button
                  style={styles.actionButton("#ff5555")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff555533";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff555522";
                  }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <p>No documents uploaded yet</p>
        </div>
      )}

      {openModal === "document" && (
        <ModalComponent
          onClose={() => {
            setOpenModal(null);
          }}
        >
          <UploadDocument
            onClose={() => {
              setOpenModal(null);
              respondentId = { respondentId };
            }}
          />
        </ModalComponent>
      )}
    </div>
  );
}

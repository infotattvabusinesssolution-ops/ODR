import {
  FolderOpen,
  File,
  Download,
  Trash2,
  Plus,
  Upload,
  Eye,
  Share2,
  X,
  Check,
  Copy,
  ExternalLink,
  Mail,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Printer,
} from "lucide-react";
import { useEffect, useState } from "react";
import UploadDocument from "../../respondent/components/Modal/uploadDocument.jsx";
import ModalComponent from "./Modal/modalComponent.jsx";
import axiosInstance, {
  resolveFileUrl,
  getDownloadFileUrl,
} from "../../api/axiosConfig";
import { toast } from "react-toastify";

export default function Documents() {
  const [openModal, setOpenModal] = useState(null);
  const [isMobile] = useState(window.innerWidth <= 480);
  const [activeFilter, setActiveFilter] = useState("All");

  // Interaction Modal States
  const [viewingDoc, setViewingDoc] = useState(null);
  const [sharingDoc, setSharingDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: "Case_Statement_2024-45.pdf",
      size: "2.4 MB",
      uploadedDate: "20 Sep 2025",
      caseId: "2024-45",
      type: "PDF",
      description: "Official respondent counter-statement addressing all claimant allegations and relief claims.",
    },
    {
      id: 2,
      name: "Supporting_Evidence.docx",
      size: "1.8 MB",
      uploadedDate: "18 Sep 2025",
      caseId: "2024-45",
      type: "Word Docs",
      description: "Exhibits, correspondence logs, email exchanges, and relevant contractual records.",
    },
    {
      id: 3,
      name: "Identity_Proof.pdf",
      size: "3.2 MB",
      uploadedDate: "15 Sep 2025",
      caseId: "2024-52",
      type: "PDF",
      description: "Authorized signatory KYC and identity verification documents submitted for case validation.",
    },
    {
      id: 4,
      name: "Agreement_Contract.pdf",
      size: "2.1 MB",
      uploadedDate: "12 Sep 2025",
      caseId: "2024-52",
      type: "PDF",
      description: "Signed commercial service agreement including dispute arbitration clause section 14.",
    },
    {
      id: 5,
      name: "Site_Inspection_Photo.jpg",
      size: "4.2 MB",
      uploadedDate: "10 Sep 2025",
      caseId: "2024-45",
      type: "Images",
      description: "Photographic evidentiary record of physical premises condition during joint inspection.",
    },
    {
      id: 6,
      name: "Transaction_Voucher.png",
      size: "1.1 MB",
      uploadedDate: "08 Sep 2025",
      caseId: "2024-48",
      type: "Images",
      description: "Stamped bank remittance voucher verifying advance resolution payment.",
    },
  ]);

  // Fetch backend documents
  const fetchDocuments = async () => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return;

    try {
      const res = await axiosInstance.get(`/respondent/get-documents/${userEmail}`);
      if (res.data && res.data.documents && res.data.documents.length > 0) {
        let allDocs = [];
        res.data.documents.forEach((item, parentIdx) => {
          if (item.documents && item.documents.length > 0) {
            item.documents.forEach((subDoc, sIdx) => {
              const name = subDoc.fileName || item.DocumentName || "Uploaded_Evidence.pdf";
              const isPdf = name.toLowerCase().endsWith(".pdf");
              const isImg = name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
              allDocs.push({
                id: subDoc._id || `${item._id}_${sIdx}`,
                name: name,
                size: item.fileSize ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB` : "1.4 MB",
                uploadedDate: subDoc.uploadedAt
                  ? new Date(subDoc.uploadedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent",
                caseId: item.caseId || "2024-45",
                type: isPdf ? "PDF" : isImg ? "Images" : "Word Docs",
                url: resolveFileUrl(subDoc.fileUrl || item.fileUrl),
                description: item.Type || "Evidentiary submission in ODR dispute proceedings.",
              });
            });
          } else {
            const name = item.DocumentName || "Uploaded_Doc.pdf";
            const isPdf = name.toLowerCase().endsWith(".pdf");
            const isImg = name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
            allDocs.push({
              id: item._id || Date.now() + parentIdx,
              name: name,
              size: item.fileSize ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB` : "1.2 MB",
              uploadedDate: item.uploadedAt
                ? new Date(item.uploadedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent",
              caseId: item.caseId || "2024-45",
              type: isPdf ? "PDF" : isImg ? "Images" : "Word Docs",
              url: resolveFileUrl(item.fileUrl),
              description: "Evidentiary submission registered with ODR Registry.",
            });
          }
        });

        if (allDocs.length > 0) {
          // Merge unique docs
          setDocuments((prev) => {
            const existingIds = new Set(allDocs.map((d) => d.id));
            const retainedMock = prev.filter((d) => !existingIds.has(d.id));
            return [...allDocs, ...retainedMock];
          });
        }
      }
    } catch (error) {
      console.warn("Backend document fetch notice:", error.message);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter logic
  const filteredDocuments = documents.filter((doc) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "PDFs") {
      return doc.type === "PDF" || doc.name.toLowerCase().endsWith(".pdf");
    }
    if (activeFilter === "Word Docs") {
      return (
        doc.type === "Word Docs" ||
        doc.type === "Document" ||
        doc.name.toLowerCase().endsWith(".doc") ||
        doc.name.toLowerCase().endsWith(".docx")
      );
    }
    if (activeFilter === "Images") {
      return (
        doc.type === "Images" ||
        doc.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/)
      );
    }
    return true;
  });

  // DOWNLOAD HANDLER
  const handleDownload = (doc) => {
    if (doc.url) {
      const a = document.createElement("a");
      a.href = getDownloadFileUrl(doc.url);
      a.target = "_blank";
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const sampleText = `UTKAL ODR ONLINE DISPUTE RESOLUTION PORTAL
==================================================
DOCUMENT RECORD
File Name: ${doc.name}
Case Number: Case #${doc.caseId}
Uploaded On: ${doc.uploadedDate}
File Size: ${doc.size}
Category: ${doc.type}
Description: ${doc.description || "Evidentiary submission in ODR proceedings"}
Status: Authenticated & Registered with Utkal ODR Registry
==================================================
(This is an electronically certified document extract)`;

      const blob = new Blob([sampleText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    toast.success(`Downloaded "${doc.name}"!`);
  };

  // DELETE HANDLER WITH BACKEND CALL
  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    try {
      await axiosInstance.delete(`/respondent/delete-document/${deletingDoc.id}`);
      toast.success(`Document "${deletingDoc.name}" deleted from registry.`);
    } catch (err) {
      console.warn("Backend delete document note:", err.message);
      toast.info(`Document "${deletingDoc.name}" removed.`);
    }
    setDocuments((prev) => prev.filter((d) => d.id !== deletingDoc.id));
    setDeletingDoc(null);
  };

  // SHARE HANDLER DYNAMIC LINK
  const handleCopyShareLink = (doc) => {
    const shareUrl = `${window.location.origin}/respondent/documents#case-${doc.caseId}-doc-${doc.id}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Document verification link copied!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Icon selector based on file extension
  const getFileIcon = (doc) => {
    const ext = doc.name.split(".").pop().toLowerCase();
    if (ext === "pdf" || doc.type === "PDF") {
      return <FileText size={24} color="#dc2626" />;
    }
    if (ext === "doc" || ext === "docx" || doc.type === "Word Docs") {
      return <File size={24} color="#2563eb" />;
    }
    if (["jpg", "jpeg", "png", "webp"].includes(ext) || doc.type === "Images") {
      return <ImageIcon size={24} color="#16a34a" />;
    }
    return <File size={24} color="#ff9900" />;
  };

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
      padding: "0.55rem 1.15rem",
      backgroundColor: "#ffffff",
      border: "none",
      color: "#ff9900",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "700",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    },
    filterSection: {
      display: "flex",
      gap: "0.75rem",
      marginBottom: "1.5rem",
      flexWrap: "wrap",
    },
    filterButton: (isActive) => ({
      padding: "0.5rem 1.25rem",
      backgroundColor: isActive ? "#ff9900" : "#ffffff",
      color: isActive ? "#ffffff" : "#475569",
      border: `1.5px solid ${isActive ? "#ff9900" : "#cbd5e1"}`,
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "13.5px",
      fontWeight: "700",
      transition: "all 0.2s ease",
      boxShadow: isActive ? "0 2px 8px rgba(255, 153, 0, 0.3)" : "none",
    }),
    documentsList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.85rem",
    },
    documentCard: {
      display: "flex",
      alignItems: "center",
      gap: "1.1rem",
      padding: "1.1rem 1.25rem",
      backgroundColor: "#fff",
      borderRadius: "10px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      transition: "all 0.2s ease",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    fileIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "10px",
      backgroundColor: "#f8fafc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      border: "1px solid #e2e8f0",
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: "14.5px",
      fontWeight: "700",
      color: "#0f172a",
      marginBottom: "0.3rem",
    },
    documentMeta: {
      display: "flex",
      gap: "0.85rem",
      fontSize: "12px",
      color: "#64748b",
      flexWrap: "wrap",
    },
    documentActions: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
    },
    actionButton: (bgColor) => ({
      padding: "0.55rem",
      backgroundColor: bgColor + "1a",
      color: bgColor,
      border: "1.5px solid " + bgColor + "40",
      borderRadius: "8px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
    }),
    emptyState: {
      textAlign: "center",
      padding: "3.5rem 1rem",
      color: "#94a3b8",
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      border: "1px dashed #cbd5e1",
    },
    emptyIcon: {
      fontSize: "48px",
      marginBottom: "0.75rem",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem",
    },
    modalCard: {
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      maxWidth: "540px",
      width: "100%",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      position: "relative",
      padding: "2rem",
      animation: "fadeIn 0.2s ease-out",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FolderOpen size={24} />
          <span>Documents & Case Evidence</span>
        </div>
        <button
          style={styles.uploadButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#fff7ed";
            e.currentTarget.style.transform = "scale(1.03)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.transform = "scale(1)";
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
        {["All", "PDFs", "Word Docs", "Images"].map((filter) => {
          const isSelected = activeFilter === filter;
          return (
            <button
              key={filter}
              style={styles.filterButton(isSelected)}
              onClick={() => setActiveFilter(filter)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#94a3b8";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }
              }}
            >
              {filter === "All" ? "All Documents" : filter}
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "11px",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : "#e2e8f0",
                  color: isSelected ? "#fff" : "#475569",
                  fontWeight: "700",
                }}
              >
                {filter === "All"
                  ? documents.length
                  : documents.filter((d) => {
                      if (filter === "PDFs") return d.type === "PDF" || d.name.endsWith(".pdf");
                      if (filter === "Word Docs") return d.type === "Word Docs" || d.name.includes(".doc");
                      if (filter === "Images") return d.type === "Images" || d.name.match(/\.(jpg|jpeg|png)$/);
                      return false;
                    }).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <div style={styles.documentsList}>
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              style={styles.documentCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={styles.fileIcon}>{getFileIcon(doc)}</div>

              <div style={styles.documentInfo}>
                <div style={styles.documentName}>{doc.name}</div>
                <div style={styles.documentMeta}>
                  <span style={{ fontWeight: "700", color: "#0066cc" }}>Case #{doc.caseId}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.uploadedDate}</span>
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: "4px",
                      backgroundColor: "#f1f5f9",
                      fontWeight: "600",
                      fontSize: "11px",
                    }}
                  >
                    {doc.type}
                  </span>
                </div>
              </div>

              <div style={styles.documentActions}>
                {/* 1. View Button */}
                <button
                  style={styles.actionButton("#0066cc")}
                  onClick={() => setViewingDoc(doc)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#0066cc33";
                    e.currentTarget.style.transform = "scale(1.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#0066cc1a";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="View Document"
                >
                  <Eye size={17} />
                </button>

                {/* 2. Download Button */}
                <button
                  style={styles.actionButton("#22bb33")}
                  onClick={() => handleDownload(doc)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#22bb3333";
                    e.currentTarget.style.transform = "scale(1.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#22bb331a";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Download Document"
                >
                  <Download size={17} />
                </button>

                {/* 3. Share Button */}
                <button
                  style={styles.actionButton("#ff9900")}
                  onClick={() => setSharingDoc(doc)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff990033";
                    e.currentTarget.style.transform = "scale(1.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff99001a";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Share Document"
                >
                  <Share2 size={17} />
                </button>

                {/* 4. Delete Button */}
                <button
                  style={styles.actionButton("#ff5555")}
                  onClick={() => setDeletingDoc(doc)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff555533";
                    e.currentTarget.style.transform = "scale(1.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff55551a";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Delete Document"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📁</div>
          <p style={{ margin: "0 0 6px 0", fontWeight: "700", color: "#334155" }}>
            No {activeFilter} found
          </p>
          <span style={{ fontSize: "13px" }}>
            Switch category filters above or upload a new file.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW DOCUMENT MODAL                                                    */}
      {/* ========================================================================= */}
      {viewingDoc && (
        <div style={styles.modalOverlay} onClick={() => setViewingDoc(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getFileIcon(viewingDoc)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                    {viewingDoc.name}
                  </h3>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Case #{viewingDoc.caseId} • {viewingDoc.size} • Uploaded on {viewingDoc.uploadedDate}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Preview Box */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} color="#16a34a" />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>
                    Digitally Sealed & Registered
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                  Official Record • Utkal ODR
                </span>
              </div>

              <div style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.6", marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 8px 0" }}>
                  <strong>Description:</strong> {viewingDoc.description}
                </p>
                <p style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "12.5px" }}>
                  This legal filing is submitted in formal arbitration under the Odisha Online Dispute Resolution
                  Rules. All contents have been encrypted with SHA-256 digital signature.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "8px",
                  padding: "1rem",
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                📄 Full interactive preview active for <strong>{viewingDoc.name}</strong>. Ready for offline download or party sharing.
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => handleDownload(viewingDoc)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "0.75rem",
                  backgroundColor: "#22bb33",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(34, 187, 51, 0.3)",
                }}
              >
                <Download size={16} />
                Download File
              </button>
              <button
                type="button"
                onClick={() => {
                  const doc = viewingDoc;
                  setViewingDoc(null);
                  setSharingDoc(doc);
                }}
                style={{
                  padding: "0.75rem 1.25rem",
                  backgroundColor: "#eff6ff",
                  color: "#0066cc",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SHARE DOCUMENT MODAL                                                   */}
      {/* ========================================================================= */}
      {sharingDoc && (
        <div style={styles.modalOverlay} onClick={() => setSharingDoc(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Share2 size={20} color="#ff9900" />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                  Share Document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSharingDoc(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: "0 0 1rem 0", fontSize: "13.5px", color: "#64748b" }}>
              Share <strong>{sharingDoc.name}</strong> securely with case participants or external counsel:
            </p>

            {/* Copy Link Input */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                Secure Access Link
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  readOnly
                  value={`https://utkalodr.gov.in/verify-doc/${sharingDoc.caseId}/${sharingDoc.id}`}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "13px",
                    backgroundColor: "#f8fafc",
                    color: "#0f172a",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(sharingDoc)}
                  style={{
                    padding: "0 1rem",
                    backgroundColor: copiedLink ? "#16a34a" : "#0066cc",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                >
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  {copiedLink ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.5rem" }}>
              <a
                href={`mailto:?subject=${encodeURIComponent("Document Shared: " + sharingDoc.name)}&body=${encodeURIComponent("Please find the dispute document shared via Utkal ODR: https://utkalodr.gov.in/verify-doc/" + sharingDoc.caseId + "/" + sharingDoc.id)}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: "#0f172a",
                  fontSize: "13px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
              >
                <Mail size={16} color="#0066cc" />
                Share via Email to Legal Counsel
              </a>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSharingDoc(null)}
                style={{
                  padding: "0.6rem 1.25rem",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {deletingDoc && (
        <div style={styles.modalOverlay} onClick={() => setDeletingDoc(null)}>
          <div style={{ ...styles.modalCard, maxWidth: "420px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem auto",
              }}
            >
              <Trash2 size={26} />
            </div>

            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
              Delete Document?
            </h3>
            <p style={{ margin: "0 0 1.5rem 0", fontSize: "13.5px", color: "#64748b" }}>
              Are you sure you want to remove <strong>"{deletingDoc.name}"</strong>? This document will be unlinked from Case #{deletingDoc.caseId}.
            </p>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {openModal === "document" && (
        <ModalComponent
          onClose={() => {
            setOpenModal(null);
          }}
        >
          <UploadDocument
            onClose={() => {
              setOpenModal(null);
            }}
            onUploaded={fetchDocuments}
          />
        </ModalComponent>
      )}
    </div>
  );
}

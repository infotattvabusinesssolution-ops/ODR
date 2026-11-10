import axiosInstance from "./axiosConfig";

const triggerBlobDownload = (response, fallbackName = "downloaded-file") => {
  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/octet-stream",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  let fileName = fallbackName;
  const contentDisposition = response.headers["content-disposition"];
  if (contentDisposition) {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\r\n]+)/i);
    const basicMatch = contentDisposition.match(/filename="?([^";\r\n]+)"?/i);
    const rawName = (utf8Match && utf8Match[1]) || (basicMatch && basicMatch[1]);
    if (rawName) {
      try {
        fileName = decodeURIComponent(rawName);
      } catch {
        fileName = rawName;
      }
    }
  }
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    window.URL.revokeObjectURL(url);
  }, 100);
  return true;
};

export const caseApi = {
  // 🟢 Get all cases
  getAllCases: async () => {
    try {
      const response = await axiosInstance.get("/admin/cases");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to fetch cases",
        }
      );
    }
  },

  // delete cases
  deleteClaimantCase: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/delete-case/${id}`);
      return response.data;
      console.log("Case deleted successfully");
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to delete case",
        }
      );
    }
  },

  downloadClaimantCaseFile: async (id) => {
    try {
      const response = await axiosInstance.get(
        `/admin/download-case-file/${id}`,
        {
          responseType: "blob",
        }
      );
      return triggerBlobDownload(response, "case-document");
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to download file",
        }
      );
    }
  },
};
export const allUserApi = {
  getAllUsers: async () => {
    try {
      const response = await axiosInstance.get("/admin/get-all-users");
      return "all users data", response;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to fetch cases",
        }
      );
    }
  },

  // delete all users
  deleteAllUsers: async (id) => {
    try {
      const response = await axiosInstance.delete(
        `/admin/delete-all-users/${id}`
      );
      return response.data;
      console.log("Case deleted successfully");
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to delete case",
        }
      );
    }
  },
};

export const documentDetailsApi = {
  getAllDocumentsDetails: async () => {
    try {
      const response = await axiosInstance.get("/admin/document-details");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to fetch cases",
        }
      );
    }
  },

  updateVerifyStatus: async (id, status) => {
    try {
      const response = await axiosInstance.post(
        `admin/update-verify-status/${id}`,
        {
          status,
        }
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to update",
        }
      );
    }
  },

  updateActiveStatus: async (id, status) => {
    try {
      const response = await axiosInstance.post(
        `admin/update-active-status/${id}`,
        {
          status,
        }
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to update",
        }
      );
    }
  },

  downloadSubmittedDocument: async (id, docName) => {
    const response = await axiosInstance.get(
      `/admin/download-submitted-document/${id}`,
      {
        responseType: "blob",
      }
    );
    return triggerBlobDownload(response, docName || "submitted-document");
  },

  newScheduleHearing: async (formData) => {
    try {
      const response = await axiosInstance.post(
        "/admin/new-hearing",
        formData
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to upload new hearing",
        }
      );
    }
  },
  GetnewScheduleHearing: async () => {
    try {
      const response = await axiosInstance.get("admin/get-new-hearing");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to fetch new hearing",
        }
      );
    }
  },

  // delete hearing
  deleteHearing: async (id) => {
    try {
      const response = await axiosInstance.delete(
        `/admin/delete-hearing/${id}`
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to delete case",
        }
      );
    }
  },
  hearingActiveStatus: async (id, status) => {
    try {
      const response = await axiosInstance.post(
        `admin/hearing-active-status/${id}`,
        {
          status,
        }
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to update",
        }
      );
    }
  },
  // delete hearing
  deleteSubmitDocument: async (id) => {
    try {
      const response = await axiosInstance.delete(
        `/admin/delete-document/${id}`
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to delete case",
        }
      );
    }
  },
};

import axiosInstance from "./axiosConfig";

export const ClaimantApi = {
  // Claimant file a new case
  fileCase: async (requestType, title, description, file) => {
    try {
      const endpoint = `/claimant/add-new-case`;
      const response = await axiosInstance.post(endpoint, {
        requestType,
        title,
        description,
        file,
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: "Login failed" };
    }
  },
  getAllClaimant: async () => {
    try {
      const response = await axiosInstance.get("/claimant/get-all-claimant");
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
  getAllNeutral: async () => {
    try {
      const response = await axiosInstance.get("/neutral/get-all-neutral");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to fetch neutral users",
        }
      );
    }
  },
  getMyCases: async () => {
    try {
      const response = await axiosInstance.get("/claimant/my-cases");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to fetch own cases",
        }
      );
    }
  },
  getMyDocuments: async () => {
    try {
      const response = await axiosInstance.get("/claimant/my-documents");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Failed to fetch documents",
        }
      );
    }
  },
};

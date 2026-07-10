import axiosInstance from "./axiosConfig";

export const NeutralApi = {
  
  getAllNeutral: async () => {
    try {
      const response = await axiosInstance.get("/neutral/get-all-neutral");
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
};

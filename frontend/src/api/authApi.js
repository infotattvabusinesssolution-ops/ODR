import axiosInstance from "./axiosConfig";

export const authApi = {
  // Register a new user
  register: async (name,phone, role, email, password) => {
    try {
      const endpoint = `/${role}/register`;
      const response = await axiosInstance.post(endpoint, {
        name,
        phone,
        email,
        password,
        role,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          success: false,
          message: "Registration failed",
        }
      );
    }
  },

  // Login a user
  login: async (email, password, role) => {
    try {
      const endpoint = `/${role}/login`;
      const response = await axiosInstance.post(endpoint, { email, password });

      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: "Login failed" };
    }
  },

  // Logout a user
  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
  },

  // Get token
  getToken: () => localStorage.getItem("authToken"),

  // Check if user is authenticated
  isAuthenticated: () => !!localStorage.getItem("authToken"),
};

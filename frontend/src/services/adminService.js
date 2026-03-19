import api from "../api";

const ADMIN_TOKEN_KEY = "adminToken";

export const adminService = {
  getToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),

  setToken: (token) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  clearToken: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  login: async (password, code) => {
    const response = await api.post("/admin/login", { password, code });
    if (response.data?.token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, response.data.token);
    }
    return response.data;
  },

  getAuthHeader: () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  },

  getStats: async () => {
    const response = await api.get("/admin/stats", adminService.getAuthHeader());
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get("/admin/users", adminService.getAuthHeader());
    return response.data;
  },

  getLogs: async () => {
    const response = await api.get("/admin/logs", adminService.getAuthHeader());
    return response.data;
  }
};
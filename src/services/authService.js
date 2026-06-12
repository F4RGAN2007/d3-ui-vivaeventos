import api from "./api.js";

const authService = {
  /**
   * POST /auth/login
   * @param {string} username
   * @param {string} password
   */
  login: (username, password) =>
    api.post("/auth/login", { username, password }),

  /**
   * POST /auth/register
   * @param {{ username, email, firstName, lastName, password, role }} data
   */
  register: (data) => api.post("api/auth/register", data),

  /** Remove token from localStorage */
  logout: () => localStorage.removeItem("token"),
};

export default authService;
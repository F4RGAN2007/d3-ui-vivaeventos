import api from "./api.js";

const ticketService = {
  /**
   * GET /api/tickets/:ticketId  (CLIENT, ADMIN)
   */
  getById: (ticketId) => api.get(`/api/tickets/${ticketId}`),

  /**
   * POST /api/tickets/validate  (ORGANIZER, ADMIN)
   * Body: { qrToken }
   */
  validate: (qrToken) => api.post("/api/tickets/validate", { qrToken }),

  /**
   * POST /api/tickets/generate  (ADMIN)
   * Body: { orderId, ticketTypeId, ticketTypeName, eventId, buyerId }
   */
  generate: (data) => api.post("/api/tickets/generate", data),

  getMyTickets: () => api.get("/api/tickets/buyer/me"),
};

export default ticketService;
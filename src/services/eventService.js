import api from "./api.js";

const eventService = {
  /**
   * GET /api/v1/events
   * Supports: keyword, location, page, limit
   */
  getAll: (params = {}) => api.get("/api/v1/events", { params }),

  /**
   * GET /api/v1/events/search  (alias)
   */
  search: (params = {}) => api.get("/api/v1/events/search", { params }),

  /**
   * GET /api/v1/events/:id
   */
  getById: (id) => api.get(`/api/v1/events/${id}`),

  /**
   * GET /api/v1/events/my-events  (ORGANIZER)
   */
  getMyEvents: () => api.get("/api/v1/events/my-events"),

  /**
   * POST /api/v1/events  (ORGANIZER)
   * Body: { name, description, eventDate, location, imageUrl, maxCapacity, ticketTypes[] }
   */
  create: (data) => api.post("/api/v1/events", data),

  /**
   * PATCH /api/v1/events/:id/publish  (ORGANIZER)
   */
  publish: (id) => api.patch(`/api/v1/events/${id}/publish`),

  /**
   * PATCH /api/v1/events/:id/cancel  (ORGANIZER)
   */
  cancel: (id) => api.patch(`/api/v1/events/${id}/cancel`),
};

export default eventService;
import api from "./api.js";

const discountService = {
  /**
   * POST /api/discount-codes
   * Body: { code, discountPercent, maxUses, eventId? }
   */
  create: (data) => api.post("/api/discount-codes", data),

  /**
   * GET /api/discount-codes
   */
  getAll: () => api.get("/api/discount-codes"),

  /**
   * PATCH /api/discount-codes/:id/toggle
   */
  toggle: (id) => api.patch(`/api/discount-codes/${id}/toggle`),

  /**
   * DELETE /api/discount-codes/:id
   */
  remove: (id) => api.delete(`/api/discount-codes/${id}`),
};

export default discountService;
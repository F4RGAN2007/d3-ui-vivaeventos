import api from "./api.js";

const paymentService = {
  /**
   * POST /api/payments/initiate
   * Body: { cartId } — retorna { paymentUrl, ... }
   */
  initiate: (cartId) => api.post("/api/payments/initiate", { cartId }),

  /**
   * GET /api/payments/cart/:cartId
   */
  getByCart: (cartId) => api.get(`/api/payments/cart/${cartId}`),

  /**
   * GET /api/payments/:paymentId
   */
  getById: (paymentId) => api.get(`/api/payments/${paymentId}`),

  /**
   * GET /api/payments/my — historial del cliente autenticado
   */
  getMy: () => api.get("/api/payments/my"),

  /**
   * POST /api/payments/:paymentId/refund  (ORGANIZER)
   */
  refund: (paymentId) => api.post(`/api/payments/${paymentId}/refund`),

  /**
   * GET /api/payments/:paymentId/audit
   */
  getAudit: (paymentId) => api.get(`/api/payments/${paymentId}/audit`),
};

export default paymentService;
import api from "./api.js";

/**
 * paymentService — cliente HTTP del payment-service.
 *
 * Endpoints reales del backend (PaymentController.java):
 *   POST   /api/payments/initiate
 *   GET    /api/payments/cart/:cartId
 *   GET    /api/payments/:paymentId
 *   GET    /api/payments/my
 *   POST   /api/payments/:paymentId/refund   (ORGANIZER)
 *   GET    /api/payments/:paymentId/audit
 *
 * NO existe /api/payments/session/:sessionId → no se incluye.
 */
const paymentService = {
  /**
   * POST /api/payments/initiate
   * Body: { cartId } — retorna { id, cartId, status, paymentUrl, amount, ... }
   */
  initiate: (cartId) =>
    api.post("/api/payments/initiate", { cartId }),

  /**
   * GET /api/payments/cart/:cartId
   * Usado por PaymentSuccess para saber si el pago ya está COMPLETED.
   * Requiere que success_url incluya ?cart_id=... (ver README de configuración).
   */
  getByCart: (cartId) =>
    api.get(`/api/payments/cart/${cartId}`),

  /**
   * GET /api/payments/:paymentId
   */
  getById: (paymentId) =>
    api.get(`/api/payments/${paymentId}`),

  /**
   * GET /api/payments/my — historial del cliente autenticado
   */
  getMy: () =>
    api.get("/api/payments/my"),

  /**
   * POST /api/payments/:paymentId/refund  (ORGANIZER)
   */
  refund: (paymentId, reason) =>
    api.post(`/api/payments/${paymentId}/refund`, { reason }),

  /**
   * GET /api/payments/:paymentId/audit
   */
  getAudit: (paymentId) =>
    api.get(`/api/payments/${paymentId}/audit`),
};

export default paymentService;
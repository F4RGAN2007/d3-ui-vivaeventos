import api from "./api.js";

const cartService = {
  /**
   * GET /api/cart — obtiene o crea el carrito del usuario autenticado
   */
  getOrCreate: () => api.get("/api/cart"),

  /**
   * POST /api/cart/items
   * Body: { ticketTypeId, quantity }
   */
  addItem: (ticketTypeId, quantity) =>
    api.post("/api/cart/items", { ticketTypeId, quantity }),

  /**
   * PUT /api/cart/items/:itemId
   * Body: { quantity }
   */
  updateItem: (itemId, quantity) =>
    api.put(`/api/cart/items/${itemId}`, { quantity }),

  /**
   * DELETE /api/cart/items/:itemId
   */
  removeItem: (itemId) => api.delete(`/api/cart/items/${itemId}`),

  /**
   * POST /api/cart/discount
   * Body: { code }
   */
  applyDiscount: (code) => api.post("/api/cart/discount", { code }),

  /**
   * GET /api/cart/summary
   */
  getSummary: () => api.get("/api/cart/summary"),

  /**
   * POST /api/cart/checkout
   * Body: { email }
   */
  checkout: (email) => api.post("/api/cart/checkout", { email }),
};

export default cartService;
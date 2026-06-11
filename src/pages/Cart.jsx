import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import cartService    from "../services/cartService.js";
import paymentService from "../services/paymentService.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Cart.css";

function formatPrice(p) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(p ?? 0);
}

export default function Cart() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [cart,    setCart]    = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const [discountCode, setDiscountCode] = useState("");
  const [discountMsg,  setDiscountMsg]  = useState({ type: "", text: "" });
  const [applyingDisc, setApplyingDisc] = useState(false);

  const [updatingItem, setUpdatingItem] = useState(null);
  const [checkingOut,  setCheckingOut]  = useState(false);
  const [checkoutMsg,  setCheckoutMsg]  = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cartRes, sumRes] = await Promise.all([
        cartService.getOrCreate(),
        cartService.getSummary(),
      ]);
      setCart(cartRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      setError(err.userMessage ?? "No se pudo cargar el carrito.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdateQty = async (itemId, qty) => {
    if (qty < 1) return;
    setUpdatingItem(itemId);
    try {
      await cartService.updateItem(itemId, qty);
      await load();
    } catch (err) {
      setError(err.userMessage ?? "Error al actualizar.");
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemove = async (itemId) => {
    setUpdatingItem(itemId);
    try {
      await cartService.removeItem(itemId);
      await load();
    } catch (err) {
      setError(err.userMessage ?? "Error al eliminar el ítem.");
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setApplyingDisc(true);
    setDiscountMsg({ type: "", text: "" });
    try {
      await cartService.applyDiscount(discountCode.trim());
      setDiscountMsg({ type: "success", text: "✓ Descuento aplicado correctamente." });
      await load();
    } catch (err) {
      setDiscountMsg({ type: "error", text: err.userMessage ?? "Código inválido." });
    } finally {
      setApplyingDisc(false);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    setCheckoutMsg({ type: "", text: "" });
    try {
      await cartService.checkout(user?.email ?? "");

      setCheckoutMsg({ type: "info", text: "⏳ Procesando pago, espera un momento…" });
      await new Promise((r) => setTimeout(r, 2500));

      const cartId = cart?.id ?? cart?.cartId;
      if (cartId) {
        try {
          const payRes = await paymentService.getByCart(cartId);
          const payUrl = payRes.data?.paymentUrl ?? payRes.data?.payment_url;
          if (payUrl) {
            setCheckoutMsg({ type: "success", text: "✓ Redirigiendo al pago…" });
            setTimeout(() => (window.location.href = payUrl), 1000);
            return;
          }
        } catch {
          // fall through to payments page
        }
      }
      setCheckoutMsg({ type: "success", text: "✓ Orden creada. Revisa tu historial de pagos." });
      setTimeout(() => navigate("/payments"), 1500);
    } catch (err) {
      setCheckoutMsg({ type: "error", text: err.userMessage ?? "Error en el checkout." });
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return (
    <div className="loading-wrapper">
      <div className="spinner" />
      <span>Cargando carrito…</span>
    </div>
  );

  const items = cart?.items ?? [];

  return (
    <div className="page">

      {/* ── Encabezado ─────────────────────────────────────── */}
      <div className="organizer-page-header">
        <h1 className="page-title">Carrito</h1>
        <p className="page-subtitle">Revisa y confirma tus boletas antes de pagar</p>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🛒</span>
          <h3>Tu carrito está vacío</h3>
          <p>Explora los eventos disponibles y agrega boletas.</p>
          <a href="/" className="btn btn-primary mt-3">Ver eventos</a>
        </div>
      ) : (
        <div className="cart-layout">

          {/* ── Columna izquierda: ítems + descuento ─────────── */}
          <div>
            <div className="cart-items">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  busy={updatingItem === item.id}
                  onUpdate={(qty) => handleUpdateQty(item.id, qty)}
                  onRemove={() => handleRemove(item.id)}
                />
              ))}
            </div>

            {/* Código de descuento */}
            <div className="card mt-3">
              <p className="cart-section-title">¿Tienes un código de descuento?</p>
              <div className="discount-form">
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ej: ROCK2026"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleApplyDiscount}
                  disabled={applyingDisc || !discountCode.trim()}
                >
                  {applyingDisc ? "…" : "Aplicar"}
                </button>
              </div>
              {discountMsg.text && (
                <div className={`alert alert-${discountMsg.type} mt-2`}>
                  {discountMsg.text}
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha: resumen ──────────────────────── */}
          <div className="cart-summary">
            <div className="card">
              <h2 className="cart-summary-title">Resumen</h2>

              {summary && (
                <div className="cart-summary-rows">
                  <SummaryRow
                    label="Subtotal"
                    value={formatPrice(summary.subtotal ?? summary.originalTotal)}
                  />
                  {summary.discount > 0 && (
                    <SummaryRow
                      label="Descuento"
                      value={`−${formatPrice(summary.discount)}`}
                      variant="discount"
                    />
                  )}
                  <div className="divider" />
                  <SummaryRow
                    label="Total"
                    value={formatPrice(summary.total ?? summary.finalTotal)}
                    variant="total"
                  />
                </div>
              )}

              {checkoutMsg.text && (
                <div className={`alert alert-${checkoutMsg.type} mt-2 mb-2`}>
                  {checkoutMsg.text}
                </div>
              )}

              <button
                className="btn btn-primary btn-full btn-lg mt-2"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? "Procesando…" : "Ir al pago →"}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

/* ── CartItem ────────────────────────────────────────────────── */
function CartItem({ item, busy, onUpdate, onRemove }) {
  const unitPrice = item.unitPrice ?? item.price ?? 0;

  return (
    <div
      className="card"
      style={{ opacity: busy ? 0.5 : 1, transition: "opacity 0.2s" }}
    >
      <div className="cart-item">

        <div className="cart-item-info">
          <p className="cart-item-name">
            {item.ticketTypeName ?? item.eventName ?? "Boleta"}
          </p>
          <p className="cart-item-event">{item.eventName ?? ""}</p>
          <p className="cart-item-price">
            Precio unitario: <strong>{formatPrice(unitPrice)}</strong>
          </p>
        </div>

        <div className="cart-item-controls">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onUpdate(item.quantity - 1)}
            disabled={busy || item.quantity <= 1}
          >−</button>
          <span className="cart-item-qty">{item.quantity}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onUpdate(item.quantity + 1)}
            disabled={busy}
          >+</button>
        </div>

        <span className="cart-item-subtotal">
          {formatPrice(unitPrice * item.quantity)}
        </span>

        <button
          className="btn btn-danger btn-sm"
          onClick={onRemove}
          disabled={busy}
        >✕</button>

      </div>
    </div>
  );
}

/* ── SummaryRow ──────────────────────────────────────────────── */
function SummaryRow({ label, value, variant = "default" }) {
  return (
    <div className={`cart-summary-row ${variant !== "default" ? variant : ""}`}>
      <span className="cart-summary-label">{label}</span>
      <span className="cart-summary-value">{value}</span>
    </div>
  );
}
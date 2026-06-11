import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import eventService from "../services/eventService.js";
import cartService  from "../services/cartService.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./EventDetail.css";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatPrice(p) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(p);
}

export default function EventDetail() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event,   setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const [selected, setSelected] = useState(null);
  const [qty,      setQty]      = useState(1);
  const [adding,   setAdding]   = useState(false);
  const [addMsg,   setAddMsg]   = useState({ type: "", text: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await eventService.getById(id);
        setEvent(res.data);
        const types = res.data?.ticketTypes ?? [];
        if (types.length > 0) setSelected(types[0].id);
      } catch (err) {
        setError(err.userMessage ?? "No se pudo cargar el evento.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/events/${id}` } } });
      return;
    }
    if (!selected) return;
    setAdding(true);
    setAddMsg({ type: "", text: "" });
    try {
      await cartService.addItem(selected, qty);
      setAddMsg({ type: "success", text: `✓ ${qty} boleta(s) agregada(s) al carrito.` });
    } catch (err) {
      setAddMsg({ type: "error", text: err.userMessage ?? "Error al agregar al carrito." });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <div className="loading-wrapper">
      <div className="spinner" />
      <span>Cargando evento…</span>
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="alert alert-error">{error}</div>
      <Link to="/" className="back-link">← Volver</Link>
    </div>
  );

  if (!event) return null;

  const ticketTypes  = event.ticketTypes ?? [];
  const selectedType = ticketTypes.find((t) => t.id === selected);

  return (
    <div className="page event-detail-page">

      {/* ── Back link ───────────────────────────────────────── */}
      <Link to="/" className="back-link">← Todos los eventos</Link>

      <div className="event-detail-grid">

        {/* ── Columna izquierda: detalles del evento ─────────── */}
        <div>
          {/* Hero image */}
          <div className="event-detail-img">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.name}
                onError={(e) => (e.target.style.display = "none")}
              />
            ) : (
              <div className="event-detail-placeholder">🎵</div>
            )}
          </div>

          {/* Status + ID */}
          <div className="event-detail-status-row">
            <span className={`badge badge-${(event.status ?? "DRAFT").toLowerCase()}`}>
              {event.status}
            </span>
            <span className="text-muted text-xs">ID #{event.id}</span>
          </div>

          {/* Title */}
          <h1 className="event-detail-title">{event.name}</h1>

          {/* Meta */}
          <div className="event-detail-meta">
            <div className="event-detail-meta-item">
              <i className="event-detail-meta-icon">📅</i>
              {formatDate(event.eventDate)}
            </div>
            <div className="event-detail-meta-item">
              <i className="event-detail-meta-icon">📍</i>
              {event.location}
            </div>
            <div className="event-detail-meta-item">
              <i className="event-detail-meta-icon">👥</i>
              Capacidad máx.: {event.maxCapacity?.toLocaleString("es-CO")}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="event-detail-desc">
              <h3>Descripción</h3>
              <p>{event.description}</p>
            </div>
          )}
        </div>

        {/* ── Columna derecha: panel de compra ───────────────── */}
        <div className="event-ticket-panel">
          <h2 className="ticket-panel-title">Selecciona tus boletas</h2>

          {ticketTypes.length === 0 ? (
            <p className="text-muted text-sm">No hay tipos de boleta disponibles.</p>
          ) : (
            <>
              {/* Tipos de boleta */}
              <div className="ticket-types-list">
                {ticketTypes.map((tt) => {
                  const sold = tt.remainingCapacity === 0;
                  return (
                    <button
                      key={tt.id}
                      className={`ticket-type-option${selected === tt.id ? " selected" : ""}${sold ? " sold" : ""}`}
                      onClick={() => setSelected(tt.id)}
                      disabled={sold}
                    >
                      <span className="ticket-type-name">{tt.name}</span>
                      <span className="ticket-type-price">{formatPrice(tt.price)}</span>
                      <span className="ticket-type-avail">
                        {sold
                          ? "Agotado"
                          : `${tt.remainingCapacity ?? tt.quantity} disponibles`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selector de cantidad */}
              <div className="quantity-selector">
                <label className="form-label">Cantidad</label>
                <div className="qty-controls">
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >−</button>
                  <span className="qty-value">{qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.min(10, q + 1))}
                    disabled={qty >= 10}
                  >+</button>
                </div>
              </div>

              {/* Total */}
              {selectedType && (
                <div className="ticket-total">
                  <span className="ticket-total-label">Subtotal</span>
                  <span className="ticket-total-price">
                    {formatPrice(selectedType.price * qty)}
                  </span>
                </div>
              )}

              {/* Feedback */}
              {addMsg.text && (
                <div className={`alert alert-${addMsg.type}`}>
                  {addMsg.text}
                </div>
              )}

              {/* CTA */}
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleAddToCart}
                disabled={adding || !selected || event.status !== "PUBLISHED"}
              >
                {adding ? "Agregando…" : "Agregar al carrito"}
              </button>

              {event.status !== "PUBLISHED" && (
                <p className="text-sm text-muted text-center">
                  Este evento no está disponible para compra.
                </p>
              )}

              {addMsg.type === "success" && (
                <Link to="/cart" className="btn btn-secondary btn-full">
                  Ver carrito →
                </Link>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
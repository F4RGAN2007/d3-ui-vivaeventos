import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import eventService from "../../services/eventService.js";
import "./Organizer.css";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatPrice(p) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(p ?? 0);
}

function resolveTotal(tt) {
  return tt.quantity ?? tt.totalQuantity ?? tt.total ?? tt.totalCapacity ?? tt.availableQuantity ?? "—";
}

function resolveAvailable(tt) {
  // Prefer remainingStock (live count after sales), then other fallbacks
  return (
    tt.remainingStock ??
    tt.remainingCapacity ??
    tt.available ??
    tt.remaining ??
    tt.stock ??
    resolveTotal(tt)
  );
}

export default function MyEvents() {
  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [actionMsg, setActionMsg] = useState({ id: null, type: "", text: "" });
  const [busy,      setBusy]      = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await eventService.getMyEvents();
      setEvents(res.data?.content ?? res.data ?? []);
    } catch (err) {
      setError(err.userMessage ?? "No se pudieron cargar tus eventos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePublish = async (id) => {
    setBusy(id);
    setActionMsg({ id, type: "", text: "" });
    try {
      await eventService.publish(id);
      setActionMsg({ id, type: "success", text: "✓ Evento publicado." });
      await load();
    } catch (err) {
      setActionMsg({ id, type: "error", text: err.userMessage ?? "Error al publicar." });
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("¿Seguro que deseas cancelar este evento?")) return;
    setBusy(id);
    setActionMsg({ id, type: "", text: "" });
    try {
      await eventService.cancel(id);
      setActionMsg({ id, type: "success", text: "✓ Evento cancelado." });
      await load();
    } catch (err) {
      setActionMsg({ id, type: "error", text: err.userMessage ?? "Error al cancelar." });
    } finally {
      setBusy(null);
    }
  };

  if (loading) return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>Cargando eventos…</span>
    </div>
  );

  return (
    <div className="page">
      <div className="my-events-top">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Mis Eventos</h1>
          <p className="page-subtitle">Gestiona y publica tus eventos</p>
        </div>
        <Link to="/organizer/events/create" className="btn btn-primary">
          ＋ Crear Evento
        </Link>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {events.length === 0 && !error ? (
        <div className="empty-state">
          <span className="empty-state-icon">🎭</span>
          <h3>Sin eventos creados</h3>
          <p>Crea tu primer evento para empezar a vender boletas.</p>
          <Link to="/organizer/events/create" className="btn btn-primary mt-3">
            Crear Evento
          </Link>
        </div>
      ) : (
        <div className="my-events-list">
          {events.map((ev) => (
            <EventRow
              key={ev.id}
              event={ev}
              busy={busy === ev.id}
              msg={actionMsg.id === ev.id ? actionMsg : null}
              onPublish={() => handlePublish(ev.id)}
              onCancel={() => handleCancel(ev.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({ event, busy, msg, onPublish, onCancel }) {
  const [expanded,      setExpanded]      = useState(false);
  const [ticketTypes,   setTicketTypes]   = useState(event.ticketTypes ?? []);
  const [loadingTix,    setLoadingTix]    = useState(false);
  const [ticketError,   setTicketError]   = useState("");
  const navigate = useNavigate();

  const canEdit = event.status === "DRAFT" || event.status === "PUBLISHED";

  const statusCls = {
    PUBLISHED: "badge-published",
    DRAFT:     "badge-draft",
    CANCELLED: "badge-cancelled",
  }[event.status] ?? "badge-inactive";

  // Fetch fresh ticket availability every time the panel is opened
  const handleToggle = async () => {
    const opening = !expanded;
    setExpanded(opening);

    if (!opening) return; // closing — nothing to fetch

    setLoadingTix(true);
    setTicketError("");
    try {
      const res = await eventService.getById(event.id);
      const fresh = res.data?.ticketTypes ?? [];
      setTicketTypes(fresh);
    } catch (err) {
      setTicketError(err.userMessage ?? "No se pudo actualizar la disponibilidad.");
      // Keep showing the stale data rather than blanking the panel
    } finally {
      setLoadingTix(false);
    }
  };

  return (
    <div className={`card my-event-row-card${busy ? " is-busy" : ""}`}>
      <div className="my-event-row">

        <div className="my-event-info">
          <div className="my-event-name-row">
            <span className={`badge ${statusCls}`}>{event.status}</span>
            <span className="my-event-id">ID #{event.id}</span>
          </div>
          <h3 className="my-event-name">{event.name}</h3>
          <div className="my-event-meta">
            <span>📅 {formatDate(event.eventDate)}</span>
            <span>📍 {event.location}</span>
            <span>👥 Cap. {event.maxCapacity?.toLocaleString("es-CO")}</span>
          </div>
        </div>

        <div className="my-event-actions">
          {canEdit && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/organizer/events/edit/${event.id}`)}
              disabled={busy}
            >
              ✏️ Editar
            </button>
          )}
          {event.status === "DRAFT" && (
            <button className="btn btn-success btn-sm" onClick={onPublish} disabled={busy}>
              {busy ? "…" : "Publicar"}
            </button>
          )}
          {event.status !== "CANCELLED" && (
            <button className="btn btn-danger btn-sm" onClick={onCancel} disabled={busy}>
              {busy ? "…" : "Cancelar"}
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleToggle}
            disabled={loadingTix}
          >
            {loadingTix ? "⏳" : expanded ? "▲" : "▼"} Boletas
          </button>
        </div>
      </div>

      {msg?.text && (
        <div className={`alert alert-${msg.type} mt-2`} style={{ fontSize: "0.85rem" }}>
          {msg.text}
        </div>
      )}

      {expanded && (
        <div className="my-event-tickets">
          {ticketError && (
            <div className="alert alert-error mb-2" style={{ fontSize: "0.85rem" }}>
              {ticketError}
            </div>
          )}

          {ticketTypes.length === 0 ? (
            <p className="text-muted text-sm">Sin tipos de boleta registrados.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Precio</th>
                    <th>Disponibles</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketTypes.map((tt) => {
                    const available = resolveAvailable(tt);
                    const total     = resolveTotal(tt);
                    return (
                      <tr key={tt.id}>
                        <td style={{ fontWeight: 600 }}>{tt.name}</td>
                        <td><span className="price">{formatPrice(tt.price)}</span></td>
                        <td>{available}</td>
                        <td style={{ color: "var(--color-text-muted, #888)", fontSize: "0.85em" }}>
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
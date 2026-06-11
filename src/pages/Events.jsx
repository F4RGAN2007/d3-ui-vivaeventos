import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import eventService from "../services/eventService.js";
import "./Events.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatPrice(price) {
  if (price == null) return "";
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(price);
}

function minPrice(ticketTypes = []) {
  if (!ticketTypes.length) return null;
  return Math.min(...ticketTypes.map((t) => t.price ?? 0));
}

export default function Events() {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [keyword,  setKeyword]  = useState("");
  const [location, setLocation] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (keyword.trim())  params.keyword  = keyword.trim();
      if (location.trim()) params.location = location.trim();
      const res = await eventService.getAll(params);
      setEvents(res.data?.content ?? res.data ?? []);
    } catch (err) {
      setError(err.userMessage ?? "No se pudieron cargar los eventos.");
    } finally {
      setLoading(false);
    }
  }, [keyword, location]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleSearch = (e) => { e.preventDefault(); loadEvents(); };

  return (
    <div className="page">
      <div className="page-header events-header">
        <h1 className="page-title">Eventos</h1>
        <p className="page-subtitle">Descubre los mejores conciertos, festivales y espectáculos</p>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="form-input search-input"
          type="text"
          placeholder="🔍 Buscar por nombre o artista…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <input
          className="form-input"
          type="text"
          placeholder="📍 Filtrar por ciudad…"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button type="submit" className="btn btn-primary">Buscar</button>
        {(keyword || location) && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setKeyword(""); setLocation(""); }}
          >
            Limpiar
          </button>
        )}
      </form>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          <span>Cargando eventos…</span>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-error">{error}</div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">🎭</span>
          <h3>Sin resultados</h3>
          <p>Intenta con otros términos de búsqueda.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="grid-cards">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  const min = minPrice(event.ticketTypes ?? []);

  return (
    <Link to={`/events/${event.id}`} className="event-card fade-up">

      {/* Imagen: placeholder siempre visible como fondo */}
      <div className="event-card-img">
        <div className="event-card-placeholder">🎵</div>
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.name}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>

      <div className="event-card-body">
        <h3 className="event-card-title">{event.name}</h3>

        <div className="event-card-meta">
          <span>📍 {event.location ?? "Por confirmar"}</span>
          <span>📅 {formatDate(event.eventDate)}</span>
        </div>

        {event.description && (
          <p className="event-card-desc">{event.description}</p>
        )}

        {min != null && (
          <div className="event-card-footer">
            <span className="event-price">
              Desde <strong>{formatPrice(min)}</strong>
            </span>
            <span className="event-cta">Ver más →</span>
          </div>
        )}
      </div>
    </Link>
  );
}
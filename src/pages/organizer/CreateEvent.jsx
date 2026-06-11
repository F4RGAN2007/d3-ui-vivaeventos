import { useState } from "react";
import { useNavigate } from "react-router-dom";
import eventService from "../../services/eventService.js";

const DEFAULT_TYPE = { name: "", price: "", quantity: "" };

export default function CreateEvent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    eventDate: "",
    location: "",
    imageUrl: "",
    maxCapacity: "",
  });

  const [ticketTypes, setTicketTypes] = useState([{ ...DEFAULT_TYPE }]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleTypeChange = (idx, field, value) =>
    setTicketTypes((arr) =>
      arr.map((t, i) => (i === idx ? { ...t, [field]: value } : t))
    );

  const addType    = () => setTicketTypes((a) => [...a, { ...DEFAULT_TYPE }]);
  const removeType = (idx) => setTicketTypes((a) => a.filter((_, i) => i !== idx));

  const validate = () => {
    if (!form.name || !form.eventDate || !form.location || !form.maxCapacity)
      return "Nombre, fecha, lugar y capacidad son obligatorios.";
    if (ticketTypes.some((t) => !t.name || !t.price || !t.quantity))
      return "Completa todos los campos de tipos de boleta.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        maxCapacity: Number(form.maxCapacity),
        ticketTypes: ticketTypes.map((t) => ({
          name:     t.name,
          price:    Number(t.price),
          quantity: Number(t.quantity),
        })),
      };
      const res = await eventService.create(payload);
      setSuccess(`✓ Evento creado (ID: ${res.data?.id ?? "—"}). Redirigiendo a Mis Eventos…`);
      setTimeout(() => navigate("/organizer/events"), 2000);
    } catch (err) {
      setError(err.userMessage ?? "Error al crear el evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 720 }}>

      {/* Back link */}
      <a
        className="back-link"
        onClick={() => navigate("/organizer/events")}
        style={{ cursor: "pointer" }}
      >
        ← Mis eventos
      </a>

      <div className="organizer-page-header">
        <h1 className="page-title">Crear evento</h1>
        <p className="page-subtitle">
          Completa los datos del evento y define los tipos de boleta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="organizer-form">

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* ── Información general ─────────────────────────── */}
        <div className="card">
          <div className="form-section">
            <p className="form-section-title">Información general</p>

            <div className="form-grid">
              {/* Nombre — ocupa ambas columnas */}
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Nombre del evento *</label>
                <input
                  className="form-input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Concierto Rock Cali 2026"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha y hora *</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  name="eventDate"
                  value={form.eventDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ciudad / Lugar *</label>
                <input
                  className="form-input"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Cali, Estadio Pascual Guerrero"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Capacidad máxima *</label>
                <input
                  className="form-input"
                  type="number"
                  name="maxCapacity"
                  value={form.maxCapacity}
                  onChange={handleChange}
                  min={1}
                  placeholder="500"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL de imagen</label>
                <input
                  className="form-input"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/img.jpg"
                />
              </div>

              {/* Descripción — ocupa ambas columnas */}
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-input"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe tu evento…"
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tipos de boleta ──────────────────────────────── */}
        <div className="card">
          <div className="form-section">
            <div className="form-section-header">
              <p className="form-section-title">Tipos de boleta</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addType}
              >
                ＋ Agregar tipo
              </button>
            </div>

            {ticketTypes.map((tt, idx) => (
              <div key={idx} className="ticket-type-form">
                {/* Grid de 3 columnas para los campos del tipo */}
                <div
                  className="form-grid"
                  style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
                >
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-input"
                      value={tt.name}
                      onChange={(e) =>
                        handleTypeChange(idx, "name", e.target.value)
                      }
                      placeholder="General / VIP"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio (COP)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={tt.price}
                      onChange={(e) =>
                        handleTypeChange(idx, "price", e.target.value)
                      }
                      placeholder="80000"
                      min={0}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cantidad</label>
                    <input
                      className="form-input"
                      type="number"
                      value={tt.quantity}
                      onChange={(e) =>
                        handleTypeChange(idx, "quantity", e.target.value)
                      }
                      placeholder="400"
                      min={1}
                    />
                  </div>
                </div>

                {ticketTypes.length > 1 && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeType(idx)}
                    >
                      ✕ Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Acciones ─────────────────────────────────────── */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost btn-lg"
            onClick={() => navigate("/organizer/events")}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? "Creando…" : "Crear evento"}
          </button>
        </div>

      </form>
    </div>
  );
}
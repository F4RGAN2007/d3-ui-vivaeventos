import { useState, useEffect } from "react";
import discountService from "../../services/discountService.js";

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const [form, setForm] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    maxUses: "",
    expiresAt: "",
  });

  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState({ type: "", text: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await discountService.getAll();
      setDiscounts(res.data?.content ?? res.data ?? []);
      setError("");
    } catch (err) {
      setError(err.userMessage ?? "No se pudieron cargar los descuentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateMsg({ type: "", text: "" });

    if (!form.code.trim() || !form.value) {
      setCreateMsg({
        type: "error",
        text: "Código y valor del descuento son obligatorios.",
      });
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
      };
      if (form.maxUses)   payload.maxUses  = Number(form.maxUses);
      if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();

      await discountService.create(payload);
      setCreateMsg({
        type: "success",
        text: `✓ Código "${payload.code}" creado correctamente.`,
      });
      setForm({ code: "", type: "PERCENTAGE", value: "", maxUses: "", expiresAt: "" });
      await load();
    } catch (err) {
      setCreateMsg({
        type: "error",
        text: err.userMessage ?? "Error al crear el descuento.",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggle = async (id) => {
    setBusy(id);
    try {
      await discountService.toggle(id);
      await load();
    } catch (err) {
      setError(err.userMessage ?? "Error al cambiar estado.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`¿Eliminar el código "${code}"?`)) return;
    setBusy(id);
    try {
      await discountService.remove(id);
      await load();
    } catch (err) {
      setError(err.userMessage ?? "Error al eliminar.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page">

      {/* ── Encabezado ─────────────────────────────────────── */}
      <div className="organizer-page-header">
        <h1 className="page-title">Códigos de descuento</h1>
        <p className="page-subtitle">Crea y gestiona descuentos para tus eventos</p>
      </div>

      {/* ── Formulario de creación ──────────────────────────── */}
      <div className="card mb-3 discount-create-form">
        <div className="form-section">
          <p className="form-section-title">Nuevo código de descuento</p>

          <form onSubmit={handleCreate}>
            {/* Grid auto-fill de 5 campos — override de columnas sobre form-grid */}
            <div
              className="form-grid"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
            >
              <div className="form-group">
                <label className="form-label">Código *</label>
                <input
                  className="form-input"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="ROCK2026"
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select
                  className="form-input"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED">Monto fijo</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {form.type === "PERCENTAGE" ? "Porcentaje (%) *" : "Valor descuento *"}
                </label>
                <input
                  className="form-input"
                  type="number"
                  name="value"
                  value={form.value}
                  onChange={handleChange}
                  placeholder={form.type === "PERCENTAGE" ? "15" : "10000"}
                  min={1}
                  max={form.type === "PERCENTAGE" ? 100 : undefined}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Usos máximos</label>
                <input
                  className="form-input"
                  type="number"
                  name="maxUses"
                  value={form.maxUses}
                  onChange={handleChange}
                  placeholder="100"
                  min={1}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha expiración</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  name="expiresAt"
                  value={form.expiresAt}
                  onChange={handleChange}
                />
              </div>
            </div>

            {createMsg.text && (
              <div className={`alert alert-${createMsg.type} mt-2 mb-2`}>
                {createMsg.text}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={createLoading}>
                {createLoading ? "Creando..." : "Crear código"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Error global ────────────────────────────────────── */}
      {error && <div className="alert alert-error mb-2">{error}</div>}

      {/* ── Lista de descuentos ─────────────────────────────── */}
      {loading ? (
        <div className="loading-wrapper">
          <div className="spinner" />
          <span>Cargando...</span>
        </div>
      ) : discounts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🏷️</span>
          <h3>Sin códigos de descuento</h3>
          <p>Crea tu primer código para ofrecer promociones.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Usos</th>
                <th>Expira</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {discounts.map((d) => (
                <tr
                  key={d.id}
                  style={{ opacity: busy === d.id ? 0.5 : 1, transition: "opacity 0.2s" }}
                >
                  {/* Código */}
                  <td>
                    <span className="discount-code">{d.code}</span>
                  </td>

                  {/* Tipo */}
                  <td>
                    <span className="badge badge-draft">
                      {d.type === "PERCENTAGE" ? "Porcentaje" : "Monto fijo"}
                    </span>
                  </td>

                  {/* Valor */}
                  <td>
                    <span style={{ color: "#f97316", fontWeight: 700 }}>
                      {d.type === "PERCENTAGE"
                        ? `${d.value}%`
                        : `$${Number(d.value).toLocaleString("es-CO")}`}
                    </span>
                  </td>

                  {/* Usos */}
                  <td className="text-secondary text-sm">
                    {d.usedCount ?? 0} / {d.maxUses ?? "∞"}
                  </td>

                  {/* Expiración */}
                  <td className="text-muted text-sm">
                    {d.expiresAt
                      ? new Date(d.expiresAt).toLocaleString("es-CO")
                      : "Sin vencimiento"}
                  </td>

                  {/* Estado */}
                  <td>
                    <span className={`badge ${d.active ? "badge-active" : "badge-inactive"}`}>
                      {d.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td>
                    <div className="discount-actions">
                      <button
                        className={`btn btn-sm ${d.active ? "btn-ghost" : "btn-success"}`}
                        onClick={() => handleToggle(d.id)}
                        disabled={busy === d.id}
                      >
                        {d.active ? "Desactivar" : "Activar"}
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(d.id, d.code)}
                        disabled={busy === d.id}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
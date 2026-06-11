import { useState, useEffect } from "react";
import paymentService from "../services/paymentService.js";
import ticketService  from "../services/ticketService.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Payments.css";

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

const STATUS_LABEL = {
  PENDING:   { label: "Pendiente",   cls: "badge-pending" },
  COMPLETED: { label: "Completado",  cls: "badge-published" },
  FAILED:    { label: "Fallido",     cls: "badge-cancelled" },
  REFUNDED:  { label: "Reembolsado", cls: "badge-draft" },
};

export default function Payments() {
  const { user } = useAuth();

  const [payments,      setPayments]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [selected,      setSelected]      = useState(null);

  const [genForm,       setGenForm]       = useState({ orderId: "", ticketTypeId: "", ticketTypeName: "", eventId: "", buyerId: "" });
  const [genMsg,        setGenMsg]        = useState({ type: "", text: "" });
  const [genLoading,    setGenLoading]    = useState(false);
  const [showGenModal,  setShowGenModal]  = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await paymentService.getMy();
        setPayments(res.data?.content ?? res.data ?? []);
      } catch (err) {
        setError(err.userMessage ?? "No se pudieron cargar los pagos.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleGenerate = async () => {
    setGenLoading(true);
    setGenMsg({ type: "", text: "" });
    try {
      const res = await ticketService.generate(genForm);
      setGenMsg({ type: "success", text: `✓ Ticket generado. ID: ${res.data?.id ?? res.data?.ticketId}` });
    } catch (err) {
      setGenMsg({ type: "error", text: err.userMessage ?? "Error al generar ticket." });
    } finally {
      setGenLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-wrapper">
      <div className="spinner" />
      <span>Cargando pagos…</span>
    </div>
  );

  return (
    <div className="page">

      {/* ── Encabezado ─────────────────────────────────────── */}
      <div className="flex-between mb-3">
        <div>
          <h1 className="page-title">Mis Pagos</h1>
          <p className="page-subtitle">Historial de transacciones</p>
        </div>
        {user?.role === "ADMIN" && (
          <button className="btn btn-primary" onClick={() => setShowGenModal(true)}>
            ＋ Generar Ticket
          </button>
        )}
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {payments.length === 0 && !error ? (
        <div className="empty-state">
          <span className="empty-state-icon">💳</span>
          <h3>Sin pagos registrados</h3>
          <p>Tus transacciones aparecerán aquí después de hacer checkout.</p>
        </div>
      ) : (
        <div className="payments-layout">

          {/* ── Lista de pagos ────────────────────────────────── */}
          <div className="payments-list">
            {payments.map((p) => {
              const s   = STATUS_LABEL[p.status] ?? { label: p.status, cls: "badge-inactive" };
              const pid = p.id ?? p.paymentId;
              const isSelected = selected?.id === p.id;

              return (
                <div
                  key={pid}
                  className={`card${isSelected ? " payment-card-selected" : ""}`}
                  onClick={() => setSelected(p)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="payment-card-header">
                    <div>
                      <p className="payment-id">
                        Pago #{pid?.toString().slice(0, 8)}
                      </p>
                      <p className="payment-date">
                        {formatDate(p.createdAt ?? p.created_at)}
                      </p>
                    </div>
                    <div className="payment-card-right">
                      <span className="payment-amount">
                        {formatPrice(p.amount ?? p.total)}
                      </span>
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>

                  {p.paymentUrl && p.status === "PENDING" && (
                    <div className="payment-card-footer">
                      <a
                        href={p.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Completar pago →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Panel de detalle ──────────────────────────────── */}
          {selected && (
            <PaymentDetail
              payment={selected}
              onClose={() => setSelected(null)}
            />
          )}

        </div>
      )}

      {/* ── Modal: generar ticket (ADMIN) ─────────────────────── */}
      {showGenModal && (
        <div className="modal-backdrop" onClick={() => setShowGenModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Generar Ticket Manualmente</h2>

            <div className="form-section">
              {[
                ["orderId",        "Order / Cart ID"],
                ["ticketTypeId",   "ID Tipo de Boleta"],
                ["ticketTypeName", "Nombre Tipo (ej: General)"],
                ["eventId",        "ID del Evento"],
                ["buyerId",        "ID del Comprador (Keycloak)"],
              ].map(([field, label]) => (
                <div key={field} className="form-group">
                  <label className="form-label">{label}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={genForm[field]}
                    onChange={(e) =>
                      setGenForm((f) => ({ ...f, [field]: e.target.value }))
                    }
                    placeholder={field}
                  />
                </div>
              ))}

              {genMsg.text && (
                <div className={`alert alert-${genMsg.type}`}>{genMsg.text}</div>
              )}

              <div className="form-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => { setShowGenModal(false); setGenMsg({ type: "", text: "" }); }}
                >
                  Cerrar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerate}
                  disabled={genLoading}
                >
                  {genLoading ? "Generando…" : "Generar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PaymentDetail ───────────────────────────────────────────── */
function PaymentDetail({ payment, onClose }) {
  const [audit,   setAudit]   = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getAudit(payment.id ?? payment.paymentId);
      setAudit(res.data);
    } catch {
      setAudit(null);
    } finally {
      setLoading(false);
    }
  };

  const s = STATUS_LABEL[payment.status] ?? { label: payment.status, cls: "badge-inactive" };

  return (
    <div className="payment-detail-panel">
      <div className="card">

        <div className="payment-detail-header">
          <h3 className="payment-detail-title">Detalle del pago</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <table className="payment-detail-table">
          <tbody>
            {[
              ["ID",      payment.id ?? payment.paymentId],
              ["Estado",  <span key="s" className={`badge ${s.cls}`}>{s.label}</span>],
              ["Monto",   <span key="m" className="payment-amount" style={{ fontSize: "1rem" }}>{formatPrice(payment.amount ?? payment.total)}</span>],
              ["Cart ID", payment.cartId ?? payment.orderId ?? "—"],
              ["Creado",  new Date(payment.createdAt ?? payment.created_at).toLocaleString("es-CO")],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="payment-detail-key">{k}</td>
                <td className="payment-detail-val">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {payment.paymentUrl && (
          <a
            href={payment.paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-full mt-2"
          >
            Ir al pago →
          </a>
        )}

        <button
          className="btn btn-ghost btn-full mt-2"
          onClick={loadAudit}
          disabled={loading}
        >
          {loading ? "Cargando auditoría…" : "Ver auditoría"}
        </button>

        {audit && (
          <div className="payment-audit">
            <pre>{JSON.stringify(audit, null, 2)}</pre>
          </div>
        )}

      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const { user }                            = useAuth();
  const navigate                            = useNavigate();
  const [searchParams, setSearchParams]     = useSearchParams();

  const [payments,      setPayments]        = useState([]);
  const [loading,       setLoading]         = useState(true);
  const [error,         setError]           = useState("");
  const [selected,      setSelected]        = useState(null);
  // Banner shown when Stripe redirects back with success
  const [stripeSuccess, setStripeSuccess]   = useState(false);

  const [genForm,       setGenForm]         = useState({ orderId: "", ticketTypeId: "", ticketTypeName: "", eventId: "", buyerId: "" });
  const [genMsg,        setGenMsg]          = useState({ type: "", text: "" });
  const [genLoading,    setGenLoading]      = useState(false);
  const [showGenModal,  setShowGenModal]    = useState(false);

  /* ── Carga / refresco de pagos ─────────────────────────── */
  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await paymentService.getMy();
      const list = res.data?.content ?? res.data ?? [];
      setPayments(list);

      // Si venimos de Stripe y el pago ya está COMPLETED, lo seleccionamos
      const cartId = searchParams.get("cart_id");
      if (cartId) {
        const match = list.find(
          (p) => (p.cartId ?? p.orderId) === cartId && p.status === "COMPLETED"
        );
        if (match) setSelected(match);
      }
    } catch (err) {
      setError(err.userMessage ?? "No se pudieron cargar los pagos.");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    // Detectar retorno desde Stripe (success_url suele incluir ?redirect_status=succeeded
    // o un parámetro propio; ajusta según tu configuración en payment-service)
    const redirectStatus = searchParams.get("redirect_status");
    const sessionId      = searchParams.get("session_id");

    if (redirectStatus === "succeeded" || sessionId) {
      setStripeSuccess(true);
      // Limpiar params de la URL para que no queden en historial
      setSearchParams({}, { replace: true });
    }

    loadPayments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Polling: si hay pagos PENDING, refresca cada 5 s ─── */
  useEffect(() => {
    const hasPending = payments.some((p) => p.status === "PENDING");
    if (!hasPending) return;

    const id = setInterval(async () => {
      try {
        const res  = await paymentService.getMy();
        const list = res.data?.content ?? res.data ?? [];
        setPayments(list);

        // Actualizar el panel de detalle si el pago seleccionado cambió
        if (selected) {
          const updated = list.find(
            (p) => (p.id ?? p.paymentId) === (selected.id ?? selected.paymentId)
          );
          if (updated) setSelected(updated);
        }
      } catch {
        // silencioso; el usuario puede refrescar manualmente
      }
    }, 5000);

    return () => clearInterval(id);
  }, [payments, selected]);

  /* ── Generar ticket (ADMIN) ────────────────────────────── */
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
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-ghost" onClick={loadPayments} title="Refrescar">
            ↻ Refrescar
          </button>
          {user?.role === "ADMIN" && (
            <button className="btn btn-primary" onClick={() => setShowGenModal(true)}>
              ＋ Generar Ticket
            </button>
          )}
        </div>
      </div>

      {/* ── Banner de pago exitoso (retorno desde Stripe) ─── */}
      {stripeSuccess && (
        <div className="alert alert-success mb-2" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✓ Pago procesado. Tus boletas se están generando — aparecerán en segundos.</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setStripeSuccess(false)}>✕</button>
        </div>
      )}

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
              const isSelected = (selected?.id ?? selected?.paymentId) === pid;

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
              onNavigateTicket={(id) => navigate(`/tickets/${id}`)}
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
function PaymentDetail({ payment, onClose, onNavigateTicket }) {
  const [audit,          setAudit]          = useState(null);
  const [auditLoading,   setAuditLoading]   = useState(false);
  const [tickets,        setTickets]        = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError,   setTicketsError]   = useState("");

  /* Cargar boletas cuando el pago está COMPLETED ─────────── */
  useEffect(() => {
    if (payment.status !== "COMPLETED") return;

    const cartId = payment.cartId ?? payment.orderId;
    if (!cartId) return;

    const fetchTickets = async () => {
      setTicketsLoading(true);
      setTicketsError("");
      try {
        // Intenta primero por cartId; ajusta el método según tu ticketService
        const res = await ticketService.getByCart(cartId);
        setTickets(res.data?.content ?? res.data ?? []);
      } catch {
        // Fallback: buscar entre todos los tickets del usuario
        try {
          const fallback = await ticketService.getMy();
          const all      = fallback.data?.content ?? fallback.data ?? [];
          setTickets(all.filter((t) => (t.cartId ?? t.orderId) === cartId));
        } catch {
          setTicketsError("No se pudieron cargar las boletas.");
        }
      } finally {
        setTicketsLoading(false);
      }
    };

    fetchTickets();
  }, [payment]);

  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await paymentService.getAudit(payment.id ?? payment.paymentId);
      setAudit(res.data);
    } catch {
      setAudit(null);
    } finally {
      setAuditLoading(false);
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

        {/* ── Boletas del pago ─────────────────────────────── */}
        {payment.status === "COMPLETED" && (
          <div className="mt-2">
            <p className="payment-detail-key" style={{ marginBottom: "0.5rem" }}>
              Boletas generadas
            </p>

            {ticketsLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                <div className="spinner" style={{ width: 16, height: 16 }} /> Buscando boletas…
              </div>
            )}

            {ticketsError && (
              <div className="alert alert-error" style={{ fontSize: "0.85rem" }}>{ticketsError}</div>
            )}

            {!ticketsLoading && !ticketsError && tickets.length === 0 && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                Aún no hay boletas — puede tardar unos segundos en procesarse.
              </p>
            )}

            {tickets.map((t) => {
              const tid = t.id ?? t.ticketId;
              return (
                <div
                  key={tid}
                  className="card"
                  style={{ marginBottom: "0.5rem", padding: "0.75rem", cursor: "pointer" }}
                  onClick={() => onNavigateTicket(tid)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                        {t.ticketTypeName ?? t.type ?? "Boleta"}
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                        ID: {tid?.toString().slice(0, 12)}…
                      </p>
                    </div>
                    <span className="btn btn-ghost btn-sm">Ver QR →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Auditoría ─────────────────────────────────────── */}
        <button
          className="btn btn-ghost btn-full mt-2"
          onClick={loadAudit}
          disabled={auditLoading}
        >
          {auditLoading ? "Cargando auditoría…" : "Ver auditoría"}
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
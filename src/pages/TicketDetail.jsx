import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ticketService from "../services/ticketService.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_STYLE = {
  VALID:    { label: "Válido",      cls: "badge-published" },
  USED:     { label: "Utilizado",   cls: "badge-cancelled" },
  INVALID:  { label: "Inválido",    cls: "badge-cancelled" },
  PENDING:  { label: "Pendiente",   cls: "badge-pending" },
};

export default function TicketDetail() {
  const { ticketId } = useParams();
  const { user } = useAuth();

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Validate form (ORGANIZER / ADMIN)
  const [qrInput,   setQrInput]   = useState("");
  const [valResult, setValResult] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await ticketService.getById(ticketId);
        setTicket(res.data);
      } catch (err) {
        setError(err.userMessage ?? "No se encontró el ticket.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ticketId]);

  const handleValidate = async () => {
    const token = qrInput.trim() || ticket?.qrToken;
    if (!token) return;
    setValidating(true);
    setValResult(null);
    try {
      const res = await ticketService.validate(token);
      setValResult({ success: true, message: res.data?.message ?? "Acceso permitido" });
    } catch (err) {
      const msg = err.response?.data?.message ?? err.userMessage ?? "Boleta inválida.";
      setValResult({ success: false, message: msg });
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner"/><span>Cargando ticket…</span></div>;
  if (error)   return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!ticket) return null;

  const s = STATUS_STYLE[ticket.status] ?? { label: ticket.status, cls: "badge-inactive" };
  const qrUrl = ticket.qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(ticket.qrToken)}&bgcolor=ffffff&color=000000`
    : null;

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="ticket-card">
        {/* Header stripe */}
        <div style={styles.header}>
          <div>
            <p style={styles.headerLabel}>BOLETA</p>
            <h1 style={styles.headerTitle}>{ticket.eventName ?? "Evento"}</h1>
            <p style={styles.headerSub}>{ticket.ticketTypeName ?? "General"}</p>
          </div>
          <span className={`badge ${s.cls}`} style={{ fontSize: "0.85rem", padding: "0.35rem 0.875rem" }}>
            {s.label}
          </span>
        </div>

        <div style={styles.body}>
          <div style={styles.twoCol}>
            {/* Ticket details */}
            <div>
              <h2 style={styles.sectionTitle}>Información</h2>
              {[
                ["ID de boleta", ticket.id ?? ticket.ticketId],
                ["Evento ID",    ticket.eventId],
                ["Tipo",         ticket.ticketTypeName],
                ["Comprador ID", ticket.buyerId],
                ["Emitido el",   formatDate(ticket.createdAt ?? ticket.issuedAt)],
                ["Usado el",     ticket.usedAt ? formatDate(ticket.usedAt) : "—"],
              ].map(([k, v]) => (
                <div key={k} style={styles.row}>
                  <span style={styles.rowKey}>{k}</span>
                  <span style={styles.rowVal}>{v ?? "—"}</span>
                </div>
              ))}
            </div>

            {/* QR code */}
            <div style={{ textAlign: "center" }}>
              <h2 style={{ ...styles.sectionTitle, textAlign: "center" }}>Código QR</h2>
              {qrUrl ? (
                <div className="qr-container">
                  <img src={qrUrl} alt="QR ticket" width={220} height={220} />
                  <p className="qr-token">{ticket.qrToken}</p>
                </div>
              ) : (
                <p className="text-muted text-sm">QR no disponible</p>
              )}
            </div>
          </div>

          {/* Validate section — ORGANIZER / ADMIN */}
          {(user?.role === "ORGANIZER" || user?.role === "ADMIN") && (
            <div style={styles.validateBox}>
              <h3 style={{ fontSize: "0.95rem", marginBottom: "0.875rem" }}>Validar QR en puerta</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Pega el qrToken aquí (o usa el del ticket cargado)"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleValidate}
                  disabled={validating}
                >
                  {validating ? "Validando…" : "Validar"}
                </button>
              </div>
              {valResult && (
                <div
                  className={`alert ${valResult.success ? "alert-success" : "alert-error"} mt-2`}
                  style={{ fontSize: "1rem" }}
                >
                  {valResult.success ? "✓" : "✗"} {valResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    padding: "1.75rem 2rem 1.5rem",
    borderBottom: "1px solid #2e2e60",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    flexWrap: "wrap",
  },
  headerLabel: { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "#7c3aed", textTransform: "uppercase", marginBottom: "0.25rem" },
  headerTitle: { fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.2rem" },
  headerSub:   { color: "#94a3b8", fontSize: "0.9rem" },
  body: { padding: "1.75rem 2rem" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "start", marginBottom: "1.5rem" },
  sectionTitle: { fontSize: "0.78rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" },
  row: { display: "flex", gap: "1rem", padding: "0.4rem 0", borderBottom: "1px solid #1e1e45" },
  rowKey: { color: "#94a3b8", fontSize: "0.83rem", minWidth: "120px", flexShrink: 0 },
  rowVal: { color: "#f1f5f9", fontSize: "0.83rem", wordBreak: "break-all" },
  validateBox: { background: "#12122b", borderRadius: "12px", padding: "1.25rem", border: "1px solid #2e2e60" },
};
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ticketService from "../services/ticketService.js";
import "./TicketDetail.css";

/* ── Helpers ─────────────────────────────────────────────────── */

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_META = {
  VALID:   { label: "Válido",     cls: "badge-published", color: "#22c55e" },
  USED:    { label: "Utilizado",  cls: "badge-cancelled", color: "#94a3b8" },
  INVALID: { label: "Inválido",   cls: "badge-cancelled", color: "#ef4444" },
  PENDING: { label: "Pendiente",  cls: "badge-pending",   color: "#f59e0b" },
};

/* ── Componente principal ────────────────────────────────────── */

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [expanded, setExpanded] = useState(null); // ticketId expandido

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Llama a GET /api/tickets/my  (el nuevo endpoint que extrae buyerId del JWT)
        const res = await ticketService.getMyTickets();
        setTickets(res.data ?? []);
      } catch (err) {
        setError(err.userMessage ?? "No se pudieron cargar las boletas.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
        <span>Cargando boletas…</span>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-ghost mt-2" onClick={() => navigate("/")}>
          Volver al inicio
        </button>
      </div>
    );
  }

  /* ── Sin boletas ── */
  if (tickets.length === 0) {
    return (
      <div className="page fade-up" style={{ maxWidth: 520, margin: "0 auto", paddingTop: "4rem", textAlign: "center" }}>
        <div className="card" style={S.card}>
          <EmptyIcon />
          <h2 style={{ ...S.h, marginTop: "1.25rem" }}>Sin boletas aún</h2>
          <p style={S.sub}>Tus boletas aparecerán aquí después de completar una compra.</p>
          <button className="btn btn-primary btn-full mt-2" onClick={() => navigate("/")}>
            Ver eventos
          </button>
        </div>
      </div>
    );
  }

  /* ── Lista de boletas ── */
  return (
    <div className="page fade-up" style={{ maxWidth: 680, margin: "0 auto", paddingTop: "3rem", paddingBottom: "3rem" }}>

      {/* Encabezado */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={S.pageTitle}>Mis boletas</h1>
        <p style={S.pageSub}>{tickets.length} boleta{tickets.length !== 1 ? "s" : ""} encontrada{tickets.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Tarjetas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id ?? ticket.ticketId}
            ticket={ticket}
            isExpanded={expanded === (ticket.id ?? ticket.ticketId)}
            onToggle={() =>
              setExpanded((prev) =>
                prev === (ticket.id ?? ticket.ticketId) ? null : (ticket.id ?? ticket.ticketId)
              )
            }
          />
        ))}
      </div>

      {/* Acción inferior */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button className="btn btn-ghost" onClick={() => navigate("/")}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

/* ── Tarjeta individual de boleta ────────────────────────────── */

function TicketCard({ ticket, isExpanded, onToggle }) {
  const s = STATUS_META[ticket.status] ?? { label: ticket.status, cls: "badge-inactive", color: "#94a3b8" };
  const tid = ticket.id ?? ticket.ticketId;

  const qrUrl = ticket.qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qrToken)}&bgcolor=ffffff&color=000000`
    : null;

  return (
    <div style={{
      ...S.card,
      border: isExpanded ? `1px solid ${s.color}40` : "1px solid var(--border)",
      transition: "border-color 0.2s",
    }}>
      {/* Franja de color según estado */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: s.color, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
      }} />

      {/* Cabecera clicable */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: 0, textAlign: "left",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          {/* Info principal */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={S.typeLabel}>{ticket.ticketTypeName ?? "General"}</span>
            <h3 style={S.eventName}>{ticket.eventName ?? `Evento #${ticket.eventId}`}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
              <span className={`badge ${s.cls}`}>{s.label}</span>
              <span style={S.dateText}>{formatDate(ticket.createdAt ?? ticket.issuedAt)}</span>
            </div>
          </div>

          {/* ID corto + chevron */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", flexShrink: 0 }}>
            <span style={S.ticketId}>#{String(tid).slice(0, 8).toUpperCase()}</span>
            <ChevronIcon rotated={isExpanded} />
          </div>
        </div>
      </button>

      {/* Detalle expandido */}
      {isExpanded && (
        <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>

            {/* Datos */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <InfoRow label="ID boleta"   value={tid} mono />
              <InfoRow label="Evento ID"   value={ticket.eventId} />
              <InfoRow label="Comprador"   value={ticket.buyerId} mono />
              <InfoRow label="Emitida"     value={formatDate(ticket.createdAt ?? ticket.issuedAt)} />
              {ticket.usedAt && (
                <InfoRow label="Usada" value={formatDate(ticket.usedAt)} />
              )}
            </div>

            {/* QR */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              {qrUrl ? (
                <>
                  <img
                    src={qrUrl}
                    alt="Código QR"
                    style={{ width: 160, height: 160, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "block" }}
                  />
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.4rem", wordBreak: "break-all", maxWidth: 160 }}>
                    {ticket.qrToken}
                  </p>
                </>
              ) : (
                <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>QR no disponible</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────── */

const InfoRow = ({ label, value, mono }) => (
  <div style={{
    display: "flex", flexDirection: "column", gap: "0.1rem",
    padding: "0.35rem 0", borderBottom: "1px solid var(--border)",
  }}>
    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </span>
    <span style={{
      fontSize: "0.83rem", color: "var(--text-primary)", fontWeight: 600,
      ...(mono ? { fontFamily: "monospace", fontSize: "0.78rem", wordBreak: "break-all" } : {}),
    }}>
      {value ?? "—"}
    </span>
  </div>
);

const ChevronIcon = ({ rotated }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    style={{ transition: "transform 0.2s", transform: rotated ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-muted)" }}
  >
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ margin: "0 auto", display: "block" }}>
    <circle cx="28" cy="28" r="27" stroke="var(--border)" strokeWidth="1.5" fill="var(--bg-elevated)" />
    <rect x="16" y="18" width="24" height="20" rx="3" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" />
    <line x1="20" y1="24" x2="36" y2="24" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="28" x2="32" y2="28" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="32" x2="28" y2="32" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ── Estilos ─────────────────────────────────────────────────── */
const S = {
  card: {
    padding: "1.5rem",
    background: "var(--bg-card)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
    position: "relative",
    overflow: "hidden",
  },
  pageTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
    letterSpacing: "0.03em",
  },
  pageSub: {
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  },
  h: {
    fontFamily: "var(--font-display)",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
  },
  sub: {
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    lineHeight: 1.6,
    marginBottom: "1.5rem",
  },
  typeLabel: {
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 600,
    display: "block",
    marginBottom: "0.2rem",
  },
  eventName: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  ticketId: {
    fontSize: "0.72rem",
    fontFamily: "monospace",
    color: "var(--text-muted)",
    background: "var(--bg-elevated)",
    padding: "0.2rem 0.5rem",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
  dateText: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
  },
};
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ticketService from "../services/ticketService.js";

// Importa los estilos específicos del ticket
import "./TicketDetail.css"; 

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_STYLE = {
  VALID:    { label: "Válido",    cls: "badge-published" },
  USED:     { label: "Utilizado", cls: "badge-cancelled" },
  INVALID:  { label: "Inválido",  cls: "badge-cancelled" },
  PENDING:  { label: "Pendiente", cls: "badge-pending" },
};

export default function TicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

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

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "60vh" }}>
        <div className="spinner"/>
        <span>Cargando ticket…</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }
  
  if (!ticket) return null;

  const s = STATUS_STYLE[ticket.status] ?? { label: ticket.status, cls: "badge-inactive" };
  const qrUrl = ticket.qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(ticket.qrToken)}&bgcolor=ffffff&color=000000`
    : null;

  return (
    <div className="page fade-up flex-center flex-col">
      <div className="tickets-list" style={{ width: "100%" }}>
        
        <div className="ticket-card">
          
          {/* Cuerpo principal del Ticket (Diseño tipo Stub) */}
          <div className="ticket-stub">
            <div className="ticket-stub-left">
              <span className="ticket-type-label">Boleta • {ticket.ticketTypeName ?? "General"}</span>
              <h1 className="ticket-event-name">{ticket.eventName ?? "Evento"}</h1>
              
              <div className="mt-1">
                <span className={`badge ${s.cls}`}>
                  {s.label}
                </span>
              </div>

              <div className="mt-3 flex-col gap-1">
                <p className="ticket-date"><strong>Emitido:</strong> {formatDate(ticket.createdAt ?? ticket.issuedAt)}</p>
                {ticket.usedAt && (
                  <p className="ticket-date"><strong>Usado:</strong> {formatDate(ticket.usedAt)}</p>
                )}
                <p className="ticket-location"><strong>Comprador ID:</strong> {ticket.buyerId}</p>
              </div>
            </div>

            <div className="ticket-stub-right">
              <p className="ticket-seat">
                Evento ID
                <strong>{ticket.eventId}</strong>
              </p>
              <div className="ticket-id mt-2">
                ID: {ticket.id ?? ticket.ticketId}
              </div>
            </div>
          </div>

          {/* Sección del Código QR */}
          <div className="ticket-qr">
            {qrUrl ? (
              <>
                <img src={qrUrl} alt="QR ticket" />
                <p className="ticket-qr-hint">{ticket.qrToken}</p>
              </>
            ) : (
              <p className="text-muted text-sm">QR no disponible</p>
            )}
          </div>
          
        </div>

        {/* Acciones */}
        <div className="mt-2 text-center">
          <button 
            className="btn btn-primary btn-lg" 
            onClick={() => navigate("/")}
            style={{ width: "100%", maxWidth: "300px" }}
          >
            Volver a la página principal
          </button>
        </div>

      </div>
    </div>
  );
}
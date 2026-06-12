import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import paymentService from "../services/paymentService.js";

const MAX_POLLS = 20;   // 20 × 3 s = 60 s de espera máxima
const POLL_MS   = 3000;

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const cartId    = searchParams.get("cart_id");
  const sessionId = searchParams.get("session_id");

  const [phase,   setPhase]   = useState(() => !cartId ? "no_cart_id" : "polling");
  const [payment, setPayment] = useState(null);
  const [dots,    setDots]    = useState(".");
  const pollCount = useRef(0);
  const timerRef  = useRef(null);

  /* Puntos suspensivos */
  useEffect(() => {
    if (phase !== "polling") return;
    const id = setInterval(() =>
      setDots((d) => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(id);
  }, [phase]);

  /* Polling GET /api/payments/cart/:cartId */
  useEffect(() => {
    if (phase !== "polling") return;

    const poll = async () => {
      pollCount.current += 1;
      try {
        const res = await paymentService.getByCart(cartId);
        const pay = res.data;
        if (!pay) return;

        if (pay.status === "COMPLETED") {
          clearInterval(timerRef.current);
          setPayment(pay);
          setPhase("completed");
          return;
        }
        if (pay.status === "FAILED") {
          clearInterval(timerRef.current);
          setPayment(pay);
          setPhase("failed");
          return;
        }
        // PENDING → seguir esperando
      } catch {
        /* Error transitorio — no interrumpir */
      }

      if (pollCount.current >= MAX_POLLS) {
        clearInterval(timerRef.current);
        setPhase("timeout");
      }
    };

    poll();
    timerRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [phase, cartId]);

  return (
    <div className="page" style={{ maxWidth: 560, margin: "0 auto", paddingTop: "4rem" }}>
      {phase === "polling"    && <PollingView dots={dots} />}
      {phase === "completed"  && <CompletedView payment={payment} navigate={navigate} />}
      {phase === "timeout"    && <TimeoutView onRetry={() => { pollCount.current = 0; setPhase("polling"); }} onGoPayments={() => navigate("/payments")} />}
      {phase === "failed"     && <FailedView onGoPayments={() => navigate("/payments")} />}
      {phase === "no_cart_id" && <NoCartIdView sessionId={sessionId} onGoPayments={() => navigate("/payments")} />}
    </div>
  );
}

/* ── Vistas ──────────────────────────────────────────────────── */

function PollingView({ dots }) {
  return (
    <div className="card" style={S.card}>
      <IconWrap bg="#E8F5E9"><SpinnerIcon /></IconWrap>
      <h2 style={S.h}>Confirmando tu pago{dots}</h2>
      <p style={S.sub}>Estamos verificando la transacción con Stripe.<br />Esto suele tardar menos de 10 segundos.</p>
      <div style={S.track}><div style={S.bar} /></div>
      <p style={S.hint}>No cierres esta pestaña</p>
    </div>
  );
}

function CompletedView({ payment, navigate }) {
  return (
    <div className="card" style={S.card}>
      <IconWrap bg="#E8F5E9"><CheckIcon /></IconWrap>
      <h2 style={{ ...S.h, color: "var(--color-text-success)" }}>¡Pago exitoso!</h2>
      <p style={S.sub}>Tu transacción fue confirmada. Tus boletas ya están disponibles.</p>
      {payment && (
        <div style={S.box}>
          <Row label="Referencia" value={`#${String(payment.id ?? payment.paymentId).slice(0, 8).toUpperCase()}`} />
          <Row label="Total"      value={fmtCOP(payment.amount ?? payment.total)} />
          <Row label="Estado"     value="Completado ✓" ok />
        </div>
      )}
      
      {/* NUEVO BOTÓN: Redirige al detalle del ticket */}
      <button 
        className="btn btn-primary btn-full mt-2" 
        onClick={() => navigate(`/ticket-detail/${payment?.id ?? payment?.paymentId}`)}
      >
        Ver detalle de boleta
      </button>

      {/* BOTÓN EXISTENTE: Se pasó a una variante secundaria/ghost para que destaque el de arriba */}
      <button className="btn btn-ghost btn-full mt-2" style={{ border: "1px solid var(--color-border-tertiary)" }} onClick={() => navigate("/payments")}>
        Ver mis pagos →
      </button>
      
      <Link to="/" className="btn btn-ghost btn-full mt-1" style={{ display: "block", textAlign: "center" }}>
        Volver al inicio
      </Link>
    </div>
  );
}

function TimeoutView({ onRetry, onGoPayments }) {
  return (
    <div className="card" style={S.card}>
      <IconWrap bg="#FFF8E1"><ClockIcon /></IconWrap>
      <h2 style={S.h}>Tomando más tiempo del esperado</h2>
      <p style={S.sub}>Si ya completaste el pago, tus boletas aparecerán en el historial en unos minutos.</p>
      <button className="btn btn-primary btn-full mt-2" onClick={onRetry}>Verificar nuevamente</button>
      <button className="btn btn-ghost btn-full mt-1" onClick={onGoPayments}>Ir a mis pagos</button>
    </div>
  );
}

function FailedView({ onGoPayments }) {
  return (
    <div className="card" style={S.card}>
      <IconWrap bg="#FFEBEE"><XIcon /></IconWrap>
      <h2 style={{ ...S.h, color: "var(--color-text-danger)" }}>Pago no completado</h2>
      <p style={S.sub}>La transacción no pudo procesarse. No se realizó ningún cargo.</p>
      <Link to="/cart" className="btn btn-primary btn-full mt-2" style={{ display: "block", textAlign: "center" }}>Volver al carrito</Link>
      <button className="btn btn-ghost btn-full mt-1" onClick={onGoPayments}>Ver mis pagos</button>
    </div>
  );
}

function NoCartIdView({ sessionId, onGoPayments }) {
  return (
    <div className="card" style={S.card}>
      <IconWrap bg="#E8F5E9"><CheckIcon /></IconWrap>
      <h2 style={S.h}>Pago procesado</h2>
      <p style={S.sub}>Stripe confirma que el pago se completó. Tus boletas estarán disponibles en tu historial en unos segundos.</p>
      {sessionId && (
        <div style={S.box}>
          <Row label="Referencia Stripe" value={`${sessionId.slice(0, 20)}…`} />
        </div>
      )}
      {/* Aviso solo en desarrollo */}
      {typeof import.meta !== "undefined" && import.meta.env?.DEV && (
        <div className="alert alert-error mt-2" style={{ textAlign: "left", fontSize: "0.8rem", padding: "1rem", background: "#fef2f2", color: "#991b1b", borderRadius: "8px" }}>
          <strong>Dev:</strong> La URL no incluye <code>cart_id</code>.
          Agrega <code>?cart_id=CART_ID_PLACEHOLDER</code> al <code>stripe.success-url</code> en{" "}
          <code>application.yml</code> y llama a{" "}
          <code>successUrl.replace("CART_ID_PLACEHOLDER", cartId)</code> en{" "}
          <code>PaymentService.java</code>.
        </div>
      )}
      <button className="btn btn-primary btn-full mt-2" onClick={onGoPayments}>Ver mis pagos</button>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

const IconWrap = ({ bg, children }) => (
  <div style={{ width: 72, height: 72, borderRadius: "50%", background: bg,
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
    {children}
  </div>
);

const Row = ({ label, value, ok }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0",
    borderBottom: "1px solid var(--color-border-tertiary)", fontSize: "0.9rem" }}>
    <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
    <span style={ok ? { color: "var(--color-text-success)", fontWeight: 500 } : { fontWeight: 500 }}>{value}</span>
  </div>
);

const fmtCOP = (p) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0,
}).format(p ?? 0);

/* ── Iconos ──────────────────────────────────────────────────── */
const SpinnerIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ animation: "psspin 1s linear infinite" }}>
    <circle cx="20" cy="20" r="16" stroke="var(--color-border-secondary)" strokeWidth="3"/>
    <path d="M20 4a16 16 0 0 1 16 16" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="18" fill="#1D9E75" fillOpacity="0.12"/>
    <circle cx="20" cy="20" r="14" stroke="#1D9E75" strokeWidth="2"/>
    <path d="M13 20.5l5 5 9-10" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="14" stroke="#BA7517" strokeWidth="2"/>
    <path d="M20 12v9l5 3" stroke="#BA7517" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const XIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="14" stroke="#E24B4A" strokeWidth="2"/>
    <path d="M14 14l12 12M26 14L14 26" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

/* ── Estilos ─────────────────────────────────────────────────── */
const S = {
  card:  { padding: "2.5rem 2rem", textAlign: "center", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  h:     { fontSize: "1.4rem", fontWeight: 500, margin: "1rem 0 0.5rem" },
  sub:   { color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "1.5rem" },
  hint:  { fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "1rem" },
  box:   { background: "var(--color-background-secondary)", borderRadius: "8px",
           padding: "0.75rem 1rem", marginBottom: "1rem", textAlign: "left" },
  track: { width: "100%", height: 4, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" },
  bar:   { height: "100%", width: "40%", background: "#1D9E75", animation: "psprogress 2s ease-in-out infinite alternate" },
};

if (!document.getElementById("ps-kf")) {
  const el = document.createElement("style");
  el.id = "ps-kf";
  el.textContent = `
    @keyframes psspin     { to { transform: rotate(360deg); } }
    @keyframes psprogress { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
  `;
  document.head.appendChild(el);
}
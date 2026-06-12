import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import paymentService from "../services/paymentService.js";

const MAX_POLLS = 20;
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

  useEffect(() => {
    if (phase !== "polling") return;
    const id = setInterval(() =>
      setDots((d) => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(id);
  }, [phase]);

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
      } catch { /* transitorio */ }

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
    <div className="page" style={{ maxWidth: 520, margin: "0 auto", paddingTop: "4rem" }}>
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
    <div className="card fade-up" style={S.card}>
      <Stripe color="linear-gradient(90deg, var(--accent), var(--purple))" />
      <IconWrap color="rgba(255,92,53,0.12)" ring="rgba(255,92,53,0.3)">
        <SpinnerIcon />
      </IconWrap>
      <h2 style={S.h}>Confirmando pago{dots}</h2>
      <p style={S.sub}>
        Verificando la transacción con Stripe.<br />
        Esto suele tardar menos de 10 segundos.
      </p>
      <div style={S.track}>
        <div style={S.bar} />
      </div>
      <p style={S.hint}>No cierres esta pestaña</p>
    </div>
  );
}

function CompletedView({ payment, navigate }) {
  return (
    <div className="card fade-up" style={S.card}>
      <Stripe color="linear-gradient(90deg, var(--success), #16a34a)" />
      <IconWrap color="rgba(34,197,94,0.12)" ring="rgba(34,197,94,0.35)">
        <CheckIcon />
      </IconWrap>
      <h2 style={{ ...S.h, color: "var(--success)" }}>¡Pago exitoso!</h2>
      <p style={S.sub}>
        Transacción confirmada. Tus boletas ya están disponibles.
      </p>

      {payment && (
        <div style={S.box}>
          <Row label="Referencia" value={`#${String(payment.id ?? payment.paymentId).slice(0, 8).toUpperCase()}`} />
          <Row label="Total"      value={fmtCOP(payment.amount ?? payment.total)} />
          <Row label="Estado"     value="Completado ✓" ok />
        </div>
      )}

      <button
        className="btn btn-primary btn-full mt-2"
        onClick={() => navigate(`/tickets/${payment?.id ?? payment?.paymentId}`)}
      >
        Ver boleta
      </button>
      <button
        className="btn btn-secondary btn-full mt-2"
        onClick={() => navigate("/payments")}
      >
        Ver mis pagos
      </button>
      <Link
        to="/"
        className="btn btn-ghost btn-full mt-1"
        style={{ display: "block", textAlign: "center" }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}

function TimeoutView({ onRetry, onGoPayments }) {
  return (
    <div className="card fade-up" style={S.card}>
      <Stripe color="linear-gradient(90deg, var(--warning), #d97706)" />
      <IconWrap color="rgba(245,158,11,0.12)" ring="rgba(245,158,11,0.3)">
        <ClockIcon />
      </IconWrap>
      <h2 style={{ ...S.h, color: "var(--warning)" }}>Tomando más tiempo</h2>
      <p style={S.sub}>
        Si ya completaste el pago, tus boletas aparecerán
        en el historial en unos minutos.
      </p>
      <button className="btn btn-primary btn-full mt-2" onClick={onRetry}>
        Verificar de nuevo
      </button>
      <button className="btn btn-ghost btn-full mt-1" onClick={onGoPayments}>
        Ir a mis pagos
      </button>
    </div>
  );
}

function FailedView({ onGoPayments }) {
  return (
    <div className="card fade-up" style={S.card}>
      <Stripe color="linear-gradient(90deg, var(--danger), #b91c1c)" />
      <IconWrap color="rgba(239,68,68,0.12)" ring="rgba(239,68,68,0.3)">
        <XIcon />
      </IconWrap>
      <h2 style={{ ...S.h, color: "var(--danger)" }}>Pago no completado</h2>
      <p style={S.sub}>
        La transacción no pudo procesarse. No se realizó ningún cargo.
      </p>
      <Link
        to="/cart"
        className="btn btn-danger btn-full mt-2"
        style={{ display: "block", textAlign: "center" }}
      >
        Volver al carrito
      </Link>
      <button className="btn btn-ghost btn-full mt-1" onClick={onGoPayments}>
        Ver mis pagos
      </button>
    </div>
  );
}

function NoCartIdView({ sessionId, onGoPayments }) {
  return (
    <div className="card fade-up" style={S.card}>
      <Stripe color="linear-gradient(90deg, var(--success), #16a34a)" />
      <IconWrap color="rgba(34,197,94,0.12)" ring="rgba(34,197,94,0.35)">
        <CheckIcon />
      </IconWrap>
      <h2 style={{ ...S.h, color: "var(--success)" }}>Pago procesado</h2>
      <p style={S.sub}>
        Stripe confirma el pago. Tus boletas estarán disponibles
        en tu historial en unos segundos.
      </p>
      {sessionId && (
        <div style={S.box}>
          <Row label="Referencia Stripe" value={`${sessionId.slice(0, 20)}…`} />
        </div>
      )}
      {typeof import.meta !== "undefined" && import.meta.env?.DEV && (
        <div className="alert alert-warning mt-2" style={{ textAlign: "left", fontSize: "0.8rem" }}>
          <strong>Dev:</strong> La URL no incluye <code>cart_id</code>.
          Agrega <code>?cart_id=CART_ID_PLACEHOLDER</code> al{" "}
          <code>stripe.success-url</code> en <code>application.yml</code>.
        </div>
      )}
      <button className="btn btn-primary btn-full mt-2" onClick={onGoPayments}>
        Ver mis pagos
      </button>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

/** Franja de color en la parte superior de la card */
const Stripe = ({ color }) => (
  <div style={{
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 4,
    background: color,
    borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
  }} />
);

const IconWrap = ({ color, ring, children }) => (
  <div style={{
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: color,
    border: `1px solid ${ring}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 0.25rem",
  }}>
    {children}
  </div>
);

const Row = ({ label, value, ok }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.45rem 0",
    borderBottom: "1px solid var(--border)",
    fontSize: "0.875rem",
  }}>
    <span style={{ color: "var(--text-secondary)" }}>{label}</span>
    <span style={ok
      ? { color: "var(--success)", fontWeight: 700 }
      : { color: "var(--text-primary)", fontWeight: 600 }
    }>{value}</span>
  </div>
);

const fmtCOP = (p) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0,
}).format(p ?? 0);

/* ── Iconos ──────────────────────────────────────────────────── */

const SpinnerIcon = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none"
    style={{ animation: "psspin 1s linear infinite" }}>
    <circle cx="20" cy="20" r="16"
      stroke="var(--border-light)" strokeWidth="3" />
    <path d="M20 4a16 16 0 0 1 16 16"
      stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="14"
      stroke="#22c55e" strokeWidth="2" fill="rgba(34,197,94,0.08)" />
    <path d="M13 20.5l5 5 9-10"
      stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="14"
      stroke="#f59e0b" strokeWidth="2" fill="rgba(245,158,11,0.08)" />
    <path d="M20 12v9l5 3"
      stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="14"
      stroke="#ef4444" strokeWidth="2" fill="rgba(239,68,68,0.08)" />
    <path d="M14 14l12 12M26 14L14 26"
      stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/* ── Estilos inline ──────────────────────────────────────────── */
const S = {
  card: {
    padding: "2.5rem 2rem",
    textAlign: "center",
    background: "var(--bg-card)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-lg)",
    position: "relative",
    overflow: "hidden",
  },
  h: {
    fontFamily: "var(--font-display)",
    fontSize: "2rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    color: "var(--text-primary)",
    margin: "1rem 0 0.5rem",
    lineHeight: 1.1,
  },
  sub: {
    color: "var(--text-secondary)",
    lineHeight: 1.65,
    marginBottom: "1.5rem",
    fontSize: "0.9rem",
  },
  hint: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    marginTop: "1rem",
    letterSpacing: "0.03em",
  },
  box: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "0.5rem 1rem",
    marginBottom: "1.25rem",
    textAlign: "left",
  },
  track: {
    width: "100%",
    height: 3,
    background: "var(--border)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: "1rem",
  },
  bar: {
    height: "100%",
    width: "40%",
    background: "linear-gradient(90deg, var(--accent), var(--purple))",
    borderRadius: 2,
    animation: "psprogress 2s ease-in-out infinite alternate",
  },
};

/* ── Keyframes (inyección única) ─────────────────────────────── */
if (!document.getElementById("ps-kf")) {
  const el = document.createElement("style");
  el.id = "ps-kf";
  el.textContent = `
    @keyframes psspin     { to { transform: rotate(360deg); } }
    @keyframes psprogress { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
  `;
  document.head.appendChild(el);
}
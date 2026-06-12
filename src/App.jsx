import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";

// Public pages
import Login          from "./pages/Login.jsx";
import Register       from "./pages/Register.jsx";
import Events         from "./pages/Events.jsx";
import EventDetail    from "./pages/EventDetail.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";   // ← nuevo

// Client pages
import Cart         from "./pages/Cart.jsx";
import Payments     from "./pages/Payments.jsx";
import TicketDetail from "./pages/TicketDetail.jsx";

// Organizer pages
import CreateEvent from "./pages/organizer/CreateEvent.jsx";
import MyEvents    from "./pages/organizer/MyEvents.jsx";
import Discounts   from "./pages/organizer/Discounts.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <div className="with-nav">
          <Routes>
            {/* ── Públicas ── */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/"         element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />

            {/*
              Ruta de retorno de Stripe.
              Stripe redirige aquí con ?session_id=cs_test_...
              No requiere auth: el usuario puede no estar logueado justo al volver.
            */}
            <Route path="/payment-success" element={<PaymentSuccess />} />

            {/* ── Cliente / Admin ── */}
            <Route element={<ProtectedRoute roles={["CLIENT", "ADMIN"]} />}>
              <Route path="/cart"     element={<Cart />} />
              <Route path="/payments" element={<Payments />} />
            </Route>

            {/* ── Ticket: CLIENT y ADMIN ── */}
            <Route element={<ProtectedRoute roles={["CLIENT", "ADMIN"]} />}>
              <Route path="/tickets/:ticketId" element={<TicketDetail />} />
            </Route>

            {/* ── Organizador ── */}
            <Route element={<ProtectedRoute roles={["ORGANIZER"]} />}>
              <Route path="/organizer/events/create" element={<CreateEvent />} />
              <Route path="/organizer/events"        element={<MyEvents />} />
              <Route path="/organizer/discounts"     element={<Discounts />} />
            </Route>

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
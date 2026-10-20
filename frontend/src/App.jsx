import React, { useState, useEffect } from "react";
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Users,
  BarChart3,
  RefreshCw,
  Download,
  X,
  CreditCard,
} from "lucide-react";
import confetti from "canvas-confetti";
import { QRCodeSVG } from "qrcode.react";
import {
  fetchEvents,
  fetchSeats,
  holdSeats,
  releaseSeats,
  bookSeats,
  fetchAdminStats,
  resetEventSeats,
} from "./services/api";
import "./App.css";

export default function App() {
  const [view, setView] = useState("booking"); // "booking" or "admin"
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [holdToken, setHoldToken] = useState(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load initial data
  useEffect(() => {
    loadData();
    const interval = setInterval(refreshSeatsOnly, 6000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const events = await fetchEvents();
      if (events && events.length > 0) {
        setEvent(events[0]);
        const s = await fetchSeats(events[0].id);
        setSeats(s);
      }
    } catch (e) {
      setErrorMsg("Failed to connect to backend service. Ensure Uvicorn is running.");
    }
  }

  async function refreshSeatsOnly() {
    if (!event) return;
    try {
      const s = await fetchSeats(event.id);
      setSeats(s);
    } catch (e) {
      // quiet refresh
    }
  }

  // Timer countdown for active hold
  useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeft(0);
      return;
    }
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(holdExpiresAt) - new Date()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        setHoldToken(null);
        setHoldExpiresAt(null);
        setSelectedSeatIds([]);
        setErrorMsg("Your seat hold has expired. Please select your seats again.");
        refreshSeatsOnly();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [holdExpiresAt]);

  // Handle seat click
  async function handleSeatClick(seat) {
    if (seat.status === "BOOKED" || (seat.status === "HELD" && !selectedSeatIds.includes(seat.id))) {
      return;
    }

    setErrorMsg(null);
    let nextIds = [];
    if (selectedSeatIds.includes(seat.id)) {
      nextIds = selectedSeatIds.filter((id) => id !== seat.id);
    } else {
      nextIds = [...selectedSeatIds, seat.id];
    }
    setSelectedSeatIds(nextIds);

    // If holdToken exists and deselected all, release
    if (nextIds.length === 0 && holdToken) {
      try {
        await releaseSeats(event.id, holdToken);
      } catch (err) {}
      setHoldToken(null);
      setHoldExpiresAt(null);
      refreshSeatsOnly();
    }
  }

  // Hold action
  async function handleLockSeats() {
    if (selectedSeatIds.length === 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await holdSeats(event.id, selectedSeatIds, 600);
      setHoldToken(res.hold_token);
      setHoldExpiresAt(res.expires_at);
      await refreshSeatsOnly();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Confirm booking
  async function handleCheckout(e) {
    e.preventDefault();
    if (!holdToken) {
      setErrorMsg("Please hold your selected seats first.");
      return;
    }
    if (!customerName || !customerEmail) {
      setErrorMsg("Please enter attendee name and email.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const booking = await bookSeats(holdToken, customerName, customerEmail);
      setConfirmedBooking(booking);
      setHoldToken(null);
      setHoldExpiresAt(null);
      setSelectedSeatIds([]);
      setCustomerName("");
      setCustomerEmail("");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      await refreshSeatsOnly();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load Admin stats
  async function loadAdminView() {
    setView("admin");
    if (!event) return;
    try {
      const stats = await fetchAdminStats(event.id);
      setAdminStats(stats);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleResetDemo() {
    if (!event) return;
    if (confirm("Reset all venue seats to AVAILABLE and clear demo bookings?")) {
      try {
        await resetEventSeats(event.id);
        setSelectedSeatIds([]);
        setHoldToken(null);
        setHoldExpiresAt(null);
        await refreshSeatsOnly();
        const s = await fetchAdminStats(event.id);
        setAdminStats(s);
      } catch (err) {
        setErrorMsg(err.message);
      }
    }
  }

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotal = selectedSeats.reduce((acc, s) => acc + (s.tier?.price || 0), 0);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <Ticket size={24} />
          </div>
          <div>
            <div className="brand-title">ReservaSeat Engine</div>
            <div className="brand-subtitle">Interactive Real-Time Seating & Ticketing</div>
          </div>
        </div>

        <div className="nav-controls">
          <button
            className={`tab-btn ${view === "booking" ? "active" : ""}`}
            onClick={() => setView("booking")}
          >
            <Ticket size={16} /> Guest Seating
          </button>
          <button
            className={`tab-btn ${view === "admin" ? "active" : ""}`}
            onClick={loadAdminView}
          >
            <BarChart3 size={16} /> Occupancy Analytics
          </button>
        </div>
      </header>

      {/* Error alert */}
      {errorMsg && (
        <div style={{ background: "#7F1D1D", border: "1px solid #DC2626", padding: "12px 18px", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} style={{ marginLeft: "auto", background: "none", color: "white" }}><X size={16} /></button>
        </div>
      )}

      {/* Hold timer alert */}
      {holdToken && timeLeft > 0 && (
        <div className="hold-timer-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Clock size={20} />
            <span>Seats are locked for checkout! Complete reservation before timer runs out.</span>
          </div>
          <div style={{ fontSize: "20px", fontFamily: "JetBrains Mono" }}>
            {formatTimer(timeLeft)}
          </div>
        </div>
      )}

      {/* Event Details Card */}
      {event && (
        <div className="event-hero">
          <div className="event-details">
            <h1>{event.title}</h1>
            <div className="event-meta">
              <span className="meta-item"><MapPin size={16} /> {event.venue}</span>
              <span className="meta-item"><Calendar size={16} /> {new Date(event.date_time).toLocaleDateString()}</span>
              <span className="meta-item"><Users size={16} /> {event.total_seats} Total Venue Capacity</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Booking Mode */}
      {view === "booking" && (
        <div className="main-layout">
          {/* Seating Grid */}
          <div className="seating-card">
            <div className="stage-wrapper">
              <div className="stage-curve">MAIN STAGE & PRESENTATION AREA</div>
            </div>

            <div className="seating-grid">
              {["A", "B", "C", "D", "E", "F"].map((rowLabel) => {
                const rowSeats = seats.filter((s) => s.row === rowLabel);
                return (
                  <div key={rowLabel} className="seat-row">
                    <span className="row-label">{rowLabel}</span>
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isBooked = seat.status === "BOOKED";
                      const isHeldByOther = seat.status === "HELD" && !isSelected;

                      let seatClass = "seat-available";
                      if (isSelected) seatClass = "seat-selected";
                      else if (isHeldByOther) seatClass = "seat-held-other";
                      else if (isBooked) seatClass = "seat-booked";

                      return (
                        <button
                          key={seat.id}
                          className={`seat-btn ${seatClass}`}
                          onClick={() => handleSeatClick(seat)}
                          disabled={isBooked || isHeldByOther}
                          title={`${seat.tier?.name} - $${seat.tier?.price} (Row ${seat.row}, Seat ${seat.number})`}
                        >
                          <span
                            className="tier-indicator"
                            style={{ background: seat.tier?.color || "#3B82F6" }}
                          />
                          {seat.number}
                        </button>
                      );
                    })}
                    <span className="row-label">{rowLabel}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="legend-bar">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#1F2937", border: "1px solid #374151" }} />
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#10B981" }} />
                <span>Your Selection</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#F59E0B" }} />
                <span>Locked by Another User</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#111827", border: "1px solid #374151" }} />
                <span>Booked</span>
              </div>
            </div>
          </div>

          {/* Checkout Drawer */}
          <div className="checkout-card">
            <div className="checkout-title">
              <CreditCard size={20} />
              <span>Reservation Summary</span>
            </div>

            {selectedSeats.length === 0 ? (
              <div className="empty-selection">
                Click any available seat on the venue map to select.
              </div>
            ) : (
              <>
                <div className="selected-seats-list">
                  {selectedSeats.map((s) => (
                    <div key={s.id} className="selected-seat-item">
                      <div>
                        <strong>Row {s.row}, Seat {s.number}</strong>
                        <div style={{ fontSize: "12px", color: s.tier?.color }}>
                          {s.tier?.name}
                        </div>
                      </div>
                      <span style={{ fontWeight: 700 }}>${s.tier?.price}</span>
                    </div>
                  ))}
                </div>

                <div className="price-summary">
                  <div className="price-row">
                    <span>Subtotal ({selectedSeats.length} seats)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span>Processing Fee</span>
                    <span>$0.00</span>
                  </div>
                  <div className="price-row total">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {!holdToken ? (
                  <button
                    className="primary-btn"
                    onClick={handleLockSeats}
                    disabled={loading}
                  >
                    <Clock size={18} />
                    {loading ? "Locking..." : "Hold Selected Seats (10 mins)"}
                  </button>
                ) : (
                  <form onSubmit={handleCheckout} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Jyoti Pomde"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. jyoti@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="primary-btn" disabled={loading}>
                      <CheckCircle size={18} />
                      {loading ? "Confirming..." : "Complete Booking"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* VIEW: Admin / Analytics Mode */}
      {view === "admin" && (
        <div className="admin-view">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Venue Occupancy & Revenue Dashboard</h2>
            <button className="danger-btn" onClick={handleResetDemo}>
              <RefreshCw size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              Reset Demo Seats
            </button>
          </div>

          {adminStats && (
            <>
              <div className="stats-grid">
                <div className="stat-box">
                  <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Occupancy Rate</div>
                  <div className="stat-value" style={{ color: "#10B981" }}>{adminStats.occupancy_rate_percent}%</div>
                </div>
                <div className="stat-box">
                  <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Total Revenue</div>
                  <div className="stat-value" style={{ color: "#3B82F6" }}>${adminStats.total_revenue.toFixed(2)}</div>
                </div>
                <div className="stat-box">
                  <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Booked Seats</div>
                  <div className="stat-value">{adminStats.booked_seats} / {adminStats.total_seats}</div>
                </div>
                <div className="stat-box">
                  <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Active Holds</div>
                  <div className="stat-value" style={{ color: "#F59E0B" }}>{adminStats.held_seats}</div>
                </div>
              </div>

              <div className="seating-card" style={{ alignItems: "stretch", marginTop: "16px" }}>
                <h3>Tier Breakdown</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tier</th>
                      <th>Total</th>
                      <th>Booked</th>
                      <th>Held</th>
                      <th>Available</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminStats.tier_stats.map((t, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{t.tier_name}</td>
                        <td>{t.total}</td>
                        <td style={{ color: "#10B981" }}>{t.booked}</td>
                        <td style={{ color: "#F59E0B" }}>{t.held}</td>
                        <td>{t.available}</td>
                        <td style={{ fontWeight: 700 }}>${t.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmedBooking && (
        <div className="modal-overlay">
          <div className="ticket-modal">
            <div className="ticket-header">
              <h2 style={{ fontSize: "20px", color: "white" }}>Booking Confirmed!</h2>
              <div style={{ fontSize: "13px", color: "#E0E7FF", marginTop: "4px" }}>
                Reference: <strong style={{ fontFamily: "JetBrains Mono" }}>{confirmedBooking.booking_reference}</strong>
              </div>
            </div>

            <div className="ticket-body">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Attendee</div>
                <div style={{ fontSize: "18px", fontWeight: 700 }}>{confirmedBooking.customer_name}</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{confirmedBooking.customer_email}</div>
              </div>

              <div className="ticket-qr">
                <QRCodeSVG value={confirmedBooking.qr_data || confirmedBooking.booking_reference} size={150} />
                <div style={{ fontSize: "11px", color: "#4B5563", marginTop: "8px", fontWeight: 600 }}>
                  ENTRY SCANNER CODE
                </div>
              </div>

              <div style={{ background: "#1F2937", padding: "14px", borderRadius: "10px", display: "flex", justifyContent: "space-between" }}>
                <span>Reserved Seats:</span>
                <strong>{confirmedBooking.items.map((i) => i.seat_label).join(", ")}</strong>
              </div>

              <div style={{ background: "#1F2937", padding: "14px", borderRadius: "10px", display: "flex", justifyContent: "space-between" }}>
                <span>Total Paid:</span>
                <strong style={{ color: "#10B981" }}>${confirmedBooking.total_amount.toFixed(2)}</strong>
              </div>

              <button
                className="primary-btn"
                onClick={() => setConfirmedBooking(null)}
              >
                Close & Return to Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

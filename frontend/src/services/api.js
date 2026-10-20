const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchEvents() {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchSeats(eventId) {
  const res = await fetch(`${API_BASE}/events/${eventId}/seats`);
  if (!res.ok) throw new Error("Failed to fetch seats");
  return res.json();
}

export async function holdSeats(eventId, seatIds, duration = 600) {
  const res = await fetch(`${API_BASE}/events/${eventId}/hold`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seat_ids: seatIds, hold_duration_seconds: duration }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to hold selected seats");
  }
  return res.json();
}

export async function releaseSeats(eventId, holdToken, seatIds = null) {
  const res = await fetch(`${API_BASE}/events/${eventId}/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hold_token: holdToken, seat_ids: seatIds }),
  });
  return res.json();
}

export async function bookSeats(holdToken, customerName, customerEmail) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hold_token: holdToken,
      customer_name: customerName,
      customer_email: customerEmail,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Booking failed");
  }
  return res.json();
}

export async function fetchAdminStats(eventId) {
  const res = await fetch(`${API_BASE}/admin/stats/${eventId}`);
  if (!res.ok) throw new Error("Failed to fetch admin statistics");
  return res.json();
}

export async function resetEventSeats(eventId) {
  const res = await fetch(`${API_BASE}/admin/reset/${eventId}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset event seats");
  return res.json();
}

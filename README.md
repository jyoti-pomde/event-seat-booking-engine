# 🎟️ Event Seating & Reservation Engine

A full-stack event ticketing and interactive seating reservation platform built with **Python (FastAPI & SQLAlchemy)** and **React 19**. It features a visual tiered seating floor plan, real-time seat lock timeouts to prevent double-booking, digital tickets with QR codes, and an administrative occupancy analytics dashboard.

---

## 🌟 Features

- **Interactive Seating Matrix:** Visual SVG floor plan color-coded by ticket tiers (*VIP Front Row*, *Premium Balcony*, *Standard Floor*).
- **Seat Hold & Expiration Engine:** 10-minute hold window with countdown timer preventing race conditions and double-booking during checkout.
- **Dynamic Pricing & Checkout:** Calculates instant subtotals, tier differentials, and attendee reservation confirmations.
- **Digital Ticket & QR Generation:** Instant confirmation receipt with unique booking references (`TKT-XXXXXXXX`) and scannable QR codes for venue entry.
- **Venue Occupancy & Revenue Analytics:** Live administrative dashboard showcasing seat occupancy percentages, revenue per tier, and active hold counts.
- **Zero Setup Database:** Uses embedded SQLite for instant plug-and-play local development with zero external database dependencies.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2
- **Frontend:** React 19, Vite, Lucide Icons, QRCode.react, Canvas Confetti
- **Database:** SQLite (SQLAlchemy ORM)
- **Testing:** Pytest, FastAPI TestClient

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/events` | List all available events |
| `GET` | `/api/events/{id}` | Get event details with ticket tiers |
| `GET` | `/api/events/{id}/seats` | Fetch current venue seating layout and seat statuses |
| `POST` | `/api/events/{id}/hold` | Temporarily hold selected seats for checkout (10 min lock) |
| `POST` | `/api/events/{id}/release` | Release held seats manually or on cancel |
| `POST` | `/api/bookings` | Confirm reservation and generate ticket with QR payload |
| `GET` | `/api/bookings/{ref}` | Lookup confirmed booking by reference code |
| `GET` | `/api/admin/stats/{id}` | Live venue occupancy and revenue statistics |
| `POST` | `/api/admin/reset/{id}` | Reset venue seats to available state for demo/testing |

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*Interactive Swagger documentation available at `http://127.0.0.1:8000/docs`*

### 3. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
*Application runs at `http://localhost:5173`*

---

## 🧪 Running Tests

```powershell
# Backend automated tests
cd backend
pytest -v tests

# Frontend build & bundle check
cd frontend
npm run build
```

---

## 👤 Author
**Jyoti Pomde**  
- GitHub: [@jyoti-pomde](https://github.com/jyoti-pomde)

# 🎟️ Event Seating & Reservation Engine

A full-stack, high-concurrency event ticketing and interactive seating reservation system. Built with **Python (FastAPI & SQLAlchemy)** and **JavaScript (React & Vite)**, featuring an interactive tiered seating matrix, real-time seat lock timeouts, ticket generation with cryptographic QR codes, and real-time venue occupancy analytics.

---

## 🌟 Key Features

- **Interactive Seating Matrix:** Real-time venue floor plan visualizer categorized by ticket tiers (*VIP Front Row*, *Premium Balcony*, *Standard Floor*).
- **Seat Hold & Expiration Engine:** 10-minute hold window prevents double-booking and automatic lock release sweeps on expiry.
- **Dynamic Pricing & Checkout:** Calculates instant subtotals, tier differentials, and attendee reservation confirmations.
- **Digital Ticket & QR Generation:** Generates an on-screen ticket with a unique booking reference (`TKT-XXXXXXXX`) and verifiable QR code for venue entrance scanners.
- **Venue Occupancy & Revenue Analytics:** Live administrative dashboard showcasing seat occupancy percentages, revenue per tier, and live hold counts.
- **Zero External Dependencies:** Runs 100% locally with zero cloud costs using embedded SQLite and local Vite server.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Backend** | Python 3.11 / FastAPI | High-performance asynchronous REST API with auto-generated Swagger documentation |
| **ORM & Database** | SQLAlchemy 2.0 / SQLite | Relational schema with transactional seat status transitions and zero-config local storage |
| **Frontend** | React 19 / Vite | Component-driven responsive UI with glassmorphic styling and live countdown timers |
| **Icons & QR** | Lucide React / qrcode.react | Modern visual iconography and SVG-based ticket QR codes |
| **Testing** | Pytest / TestClient | Automated test suite covering seat holds, conflict rejection, and booking workflows |

---

## 📁 Repository Structure

```text
event-seat-booking-engine/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/
│   │   │       └── events.py       # Event, seat hold, booking, and admin endpoints
│   │   ├── services/
│   │   │   └── seat_service.py     # Business logic, hold expiration sweeps, event seeder
│   │   ├── database.py             # SQLite engine and session management
│   │   ├── models.py               # SQLAlchemy ORM models (Event, Tier, Seat, Booking)
│   │   ├── schemas.py              # Pydantic v2 validation models
│   │   └── main.py                 # FastAPI application and CORS middleware
│   ├── tests/
│   │   └── test_api.py             # Pytest integration tests
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js              # REST API client
│   │   ├── App.jsx                 # Main application UI and seating layout
│   │   ├── App.css                 # Custom responsive stylesheet
│   │   └── index.css               # Global typography and theme variables
│   └── package.json
└── README.md                       # Technical documentation
```

---

## 🚀 Local Setup & Quick Start

### 1. Prerequisites
- **Python 3.11+** installed
- **Node.js v20+** and **npm** installed

---

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```powershell
   cd backend
   ```
2. Activate the virtual environment:
   ```powershell
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies (if setting up fresh):
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   * The backend will start at `http://127.0.0.1:8000`.
   * Interactive API documentation (Swagger UI) is available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup
1. In a separate terminal, navigate to the frontend folder:
   ```powershell
   cd frontend
   ```
2. Install frontend packages:
   ```powershell
   npm install
   ```
3. Launch the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173` to explore the interactive seating map!

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests
Run the test suite using `pytest`:
```powershell
cd backend
pytest -v tests
```
*Tests verify root service health, event catalog retrieval, seat layout queries, concurrent hold conflict prevention (409 Conflict), hold expiration, and booking confirmation.*

### Frontend Production Build Test
Verify the frontend build and bundling:
```powershell
cd frontend
npm run build
```

---

## 🔒 Security & Data Privacy
- **Zero Secrets Committed:** No hardcoded passwords, secret keys, or cloud credentials are in the source code.
- **Local SQLite DB:** Stored locally on the filesystem; never transmitted to external cloud platforms.
- **Git Protection:** `.gitignore` excludes database files, virtual environments, node modules, and environment configs.

---

## 👤 Author
**Jyoti Pomde**  
- GitHub: [@jyoti-pomde](https://github.com/jyoti-pomde)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.services.seat_service import seed_sample_event

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_sample_event(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "Event Seating & Reservation Engine"

def test_get_events(client):
    response = client.get("/api/events")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "DevCon" in data[0]["title"]
    assert len(data[0]["tiers"]) == 3

def test_get_event_seats(client):
    response = client.get("/api/events/1/seats")
    assert response.status_code == 200
    seats = response.json()
    assert len(seats) == 60
    assert seats[0]["status"] == "AVAILABLE"

def test_seat_hold_and_collision_flow(client):
    # Get first 2 seats
    seats_resp = client.get("/api/events/1/seats")
    seats = seats_resp.json()
    seat_1_id = seats[0]["id"]
    seat_2_id = seats[1]["id"]

    # Hold seat 1 & 2
    hold_resp = client.post("/api/events/1/hold", json={"seat_ids": [seat_1_id, seat_2_id], "hold_duration_seconds": 300})
    assert hold_resp.status_code == 200
    hold_data = hold_resp.json()
    token = hold_data["hold_token"]
    assert len(token) > 0

    # Attempt collision: Another user tries to hold seat 1
    collision_resp = client.post("/api/events/1/hold", json={"seat_ids": [seat_1_id], "hold_duration_seconds": 300})
    assert collision_resp.status_code == 409
    assert "currently on hold" in collision_resp.json()["detail"]

    # Confirm booking with valid hold token
    book_resp = client.post("/api/bookings", json={
        "hold_token": token,
        "customer_name": "Jyoti Pomde",
        "customer_email": "jyoti@example.com"
    })
    assert book_resp.status_code == 200
    booking_data = book_resp.json()
    assert booking_data["status"] == "CONFIRMED"
    assert "TKT-" in booking_data["booking_reference"]
    assert len(booking_data["items"]) == 2

    # Verify seats are now BOOKED
    updated_seats = client.get("/api/events/1/seats").json()
    booked_ids = [s["id"] for s in updated_seats if s["status"] == "BOOKED"]
    assert seat_1_id in booked_ids
    assert seat_2_id in booked_ids

def test_admin_stats(client):
    response = client.get("/api/admin/stats/1")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_seats"] == 60
    assert stats["booked_seats"] >= 2
    assert stats["occupancy_rate_percent"] > 0

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Event, Seat, Tier, Booking
from app.schemas import (
    EventSummary,
    SeatSchema,
    HoldRequest,
    HoldResponse,
    ReleaseRequest,
    BookingRequest,
    BookingResponse,
    AdminStatsResponse,
    TierOccupancy,
)
from app.services.seat_service import (
    hold_seats,
    release_seats,
    confirm_booking,
    release_expired_holds,
)

router = APIRouter()

@router.get("/events", response_model=List[EventSummary])
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    return events

@router.get("/events/{event_id}", response_model=EventSummary)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.get("/events/{event_id}/seats", response_model=List[SeatSchema])
def get_seats(event_id: int, db: Session = Depends(get_db)):
    release_expired_holds(db, event_id)
    seats = db.query(Seat).filter(Seat.event_id == event_id).order_by(Seat.row, Seat.number).all()
    return seats

@router.post("/events/{event_id}/hold", response_model=HoldResponse)
def hold_seat_selection(event_id: int, request: HoldRequest, db: Session = Depends(get_db)):
    token, expires_at, total_price = hold_seats(
        db, event_id, request.seat_ids, request.hold_duration_seconds or 600
    )
    return HoldResponse(
        hold_token=token,
        expires_at=expires_at,
        seat_ids=request.seat_ids,
        total_price=total_price,
    )

@router.post("/events/{event_id}/release")
def release_seat_selection(event_id: int, request: ReleaseRequest, db: Session = Depends(get_db)):
    count = release_seats(db, request.hold_token, request.seat_ids)
    return {"message": f"Successfully released {count} seats", "released_count": count}

@router.post("/bookings", response_model=BookingResponse)
def create_booking(request: BookingRequest, db: Session = Depends(get_db)):
    booking = confirm_booking(
        db, request.hold_token, request.customer_name, request.customer_email
    )
    return booking

@router.get("/bookings/{booking_ref}", response_model=BookingResponse)
def get_booking(booking_ref: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_reference == booking_ref).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reference not found")
    return booking

@router.get("/admin/stats/{event_id}", response_model=AdminStatsResponse)
def get_admin_stats(event_id: int, db: Session = Depends(get_db)):
    release_expired_holds(db, event_id)
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    seats = db.query(Seat).filter(Seat.event_id == event_id).all()
    total_seats = len(seats)
    booked_seats = sum(1 for s in seats if s.status == "BOOKED")
    held_seats = sum(1 for s in seats if s.status == "HELD")
    available_seats = sum(1 for s in seats if s.status == "AVAILABLE")
    
    occupancy_rate = round((booked_seats / total_seats * 100), 1) if total_seats > 0 else 0.0

    tier_stats = []
    total_revenue = 0.0
    for tier in event.tiers:
        tier_seats = [s for s in seats if s.tier_id == tier.id]
        t_total = len(tier_seats)
        t_booked = sum(1 for s in tier_seats if s.status == "BOOKED")
        t_held = sum(1 for s in tier_seats if s.status == "HELD")
        t_avail = sum(1 for s in tier_seats if s.status == "AVAILABLE")
        rev = t_booked * tier.price
        total_revenue += rev
        tier_stats.append(TierOccupancy(
            tier_name=tier.name,
            total=t_total,
            booked=t_booked,
            held=t_held,
            available=t_avail,
            revenue=round(rev, 2)
        ))

    return AdminStatsResponse(
        event_id=event.id,
        event_title=event.title,
        total_seats=total_seats,
        booked_seats=booked_seats,
        held_seats=held_seats,
        available_seats=available_seats,
        occupancy_rate_percent=occupancy_rate,
        total_revenue=round(total_revenue, 2),
        tier_stats=tier_stats
    )

@router.post("/admin/reset/{event_id}")
def reset_event_seats(event_id: int, db: Session = Depends(get_db)):
    seats = db.query(Seat).filter(Seat.event_id == event_id).all()
    for s in seats:
        s.status = "AVAILABLE"
        s.hold_token = None
        s.hold_expires_at = None
    db.query(Booking).delete()
    db.commit()
    return {"message": "Event seats and bookings successfully reset to initial available state"}

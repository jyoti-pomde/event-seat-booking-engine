import uuid
import secrets
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Event, Tier, Seat, Booking, BookingItem

def release_expired_holds(db: Session, event_id: Optional[int] = None):
    now = datetime.utcnow()
    query = db.query(Seat).filter(Seat.status == "HELD", Seat.hold_expires_at <= now)
    if event_id:
        query = query.filter(Seat.event_id == event_id)
    expired_seats = query.all()
    for seat in expired_seats:
        seat.status = "AVAILABLE"
        seat.hold_token = None
        seat.hold_expires_at = None
    if expired_seats:
        db.commit()

def hold_seats(db: Session, event_id: int, seat_ids: List[int], duration_seconds: int = 600) -> Tuple[str, datetime, float]:
    release_expired_holds(db, event_id)
    
    seats = db.query(Seat).filter(Seat.event_id == event_id, Seat.id.in_(seat_ids)).all()
    if len(seats) != len(seat_ids):
        raise HTTPException(status_code=400, detail="One or more requested seat IDs do not exist for this event.")
    
    total_price = 0.0
    for seat in seats:
        if seat.status == "BOOKED":
            raise HTTPException(status_code=409, detail=f"Seat {seat.row}{seat.number} is already booked.")
        if seat.status == "HELD":
            raise HTTPException(status_code=409, detail=f"Seat {seat.row}{seat.number} is currently on hold by another user.")
        total_price += seat.tier.price

    token = secrets.token_hex(16)
    expires_at = datetime.utcnow() + timedelta(seconds=duration_seconds)
    
    for seat in seats:
        seat.status = "HELD"
        seat.hold_token = token
        seat.hold_expires_at = expires_at
        
    db.commit()
    return token, expires_at, total_price

def release_seats(db: Session, hold_token: str, seat_ids: Optional[List[int]] = None):
    query = db.query(Seat).filter(Seat.hold_token == hold_token)
    if seat_ids:
        query = query.filter(Seat.id.in_(seat_ids))
    seats = query.all()
    for seat in seats:
        seat.status = "AVAILABLE"
        seat.hold_token = None
        seat.hold_expires_at = None
    db.commit()
    return len(seats)

def confirm_booking(db: Session, hold_token: str, customer_name: str, customer_email: str) -> Booking:
    release_expired_holds(db)
    
    seats = db.query(Seat).filter(Seat.hold_token == hold_token, Seat.status == "HELD").all()
    if not seats:
        raise HTTPException(status_code=400, detail="No active held seats found for the provided token or hold has expired.")
    
    total_amount = sum(s.tier.price for s in seats)
    ref_part = uuid.uuid4().hex[:8].upper()
    booking_ref = f"TKT-{ref_part}"
    
    seat_labels = ",".join([f"{s.row}{s.number}" for s in seats])
    qr_payload = f"EVENT_ID:{seats[0].event_id}|REF:{booking_ref}|SEATS:{seat_labels}|EMAIL:{customer_email}"
    
    booking = Booking(
        booking_reference=booking_ref,
        customer_name=customer_name,
        customer_email=customer_email,
        total_amount=total_amount,
        status="CONFIRMED",
        created_at=datetime.utcnow(),
        qr_data=qr_payload
    )
    db.add(booking)
    db.flush()
    
    for seat in seats:
        seat.status = "BOOKED"
        seat.hold_token = None
        seat.hold_expires_at = None
        
        item = BookingItem(
            booking_id=booking.id,
            seat_id=seat.id,
            seat_label=f"{seat.row}{seat.number}",
            tier_name=seat.tier.name,
            price=seat.tier.price
        )
        db.add(item)
        
    db.commit()
    db.refresh(booking)
    return booking

def seed_sample_event(db: Session):
    existing = db.query(Event).first()
    if existing:
        return existing
        
    event = Event(
        title="DevCon: Global Software Engineering Conference",
        description="Annual conference bringing together software engineers, system architects, and technology leaders for keynotes and technical workshops.",
        venue="Downtown Convention Center, Grand Auditorium",
        date_time=datetime.utcnow() + timedelta(days=30),
        total_seats=60
    )
    db.add(event)
    db.flush()
    
    vip_tier = Tier(event_id=event.id, name="VIP Front Row", price=199.00, color="#F59E0B")
    premium_tier = Tier(event_id=event.id, name="Premium Balcony", price=129.00, color="#8B5CF6")
    standard_tier = Tier(event_id=event.id, name="Standard Floor", price=79.00, color="#3B82F6")
    
    db.add_all([vip_tier, premium_tier, standard_tier])
    db.flush()
    
    seats = []
    for r in ["A", "B"]:
        for n in range(1, 11):
            seats.append(Seat(event_id=event.id, tier_id=vip_tier.id, row=r, number=n, status="AVAILABLE"))
            
    for r in ["C", "D"]:
        for n in range(1, 11):
            seats.append(Seat(event_id=event.id, tier_id=premium_tier.id, row=r, number=n, status="AVAILABLE"))
            
    for r in ["E", "F"]:
        for n in range(1, 11):
            seats.append(Seat(event_id=event.id, tier_id=standard_tier.id, row=r, number=n, status="AVAILABLE"))
            
    db.add_all(seats)
    db.commit()
    return event

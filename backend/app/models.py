from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    venue = Column(String(150), nullable=False)
    date_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    total_seats = Column(Integer, default=0)

    tiers = relationship("Tier", back_populates="event", cascade="all, delete-orphan")
    seats = relationship("Seat", back_populates="event", cascade="all, delete-orphan")

class Tier(Base):
    __tablename__ = "tiers"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String(50), nullable=False)  # e.g., VIP, Premium, Standard
    price = Column(Float, nullable=False)
    color = Column(String(20), default="#3B82F6")  # hex color for UI rendering

    event = relationship("Event", back_populates="tiers")
    seats = relationship("Seat", back_populates="tier")

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    tier_id = Column(Integer, ForeignKey("tiers.id"), nullable=False)
    row = Column(String(5), nullable=False)
    number = Column(Integer, nullable=False)
    status = Column(String(20), default="AVAILABLE")  # AVAILABLE, HELD, BOOKED
    hold_token = Column(String(64), nullable=True, index=True)
    hold_expires_at = Column(DateTime, nullable=True)

    event = relationship("Event", back_populates="seats")
    tier = relationship("Tier", back_populates="seats")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(32), unique=True, index=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(100), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), default="CONFIRMED")
    created_at = Column(DateTime, default=datetime.utcnow)
    qr_data = Column(String(500), nullable=True)

    items = relationship("BookingItem", back_populates="booking", cascade="all, delete-orphan")

class BookingItem(Base):
    __tablename__ = "booking_items"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    seat_id = Column(Integer, nullable=False)
    seat_label = Column(String(20), nullable=False)
    tier_name = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)

    booking = relationship("Booking", back_populates="items")

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class TierSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: float
    color: str

class SeatSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    tier_id: int
    row: str
    number: int
    status: str
    tier: Optional[TierSchema] = None

class EventSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    venue: str
    date_time: datetime
    total_seats: int
    tiers: List[TierSchema] = []

class HoldRequest(BaseModel):
    seat_ids: List[int] = Field(..., min_length=1)
    hold_duration_seconds: Optional[int] = 600

class HoldResponse(BaseModel):
    hold_token: str
    expires_at: datetime
    seat_ids: List[int]
    total_price: float

class ReleaseRequest(BaseModel):
    hold_token: str
    seat_ids: Optional[List[int]] = None

class BookingRequest(BaseModel):
    hold_token: str
    customer_name: str = Field(..., min_length=2)
    customer_email: EmailStr

class BookingItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    seat_id: int
    seat_label: str
    tier_name: str
    price: float

class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_reference: str
    customer_name: str
    customer_email: str
    total_amount: float
    status: str
    created_at: datetime
    qr_data: Optional[str] = None
    items: List[BookingItemSchema] = []

class TierOccupancy(BaseModel):
    tier_name: str
    total: int
    booked: int
    held: int
    available: int
    revenue: float

class AdminStatsResponse(BaseModel):
    event_id: int
    event_title: str
    total_seats: int
    booked_seats: int
    held_seats: int
    available_seats: int
    occupancy_rate_percent: float
    total_revenue: float
    tier_stats: List[TierOccupancy]

# formats/schemas.py
from typing import Literal, Optional
from pydantic import BaseModel
from datetime import datetime

class FlightBooking(BaseModel):
    """Schema for flight bookings"""
    type: Literal["flight"] = "flight"
    booking_reference: Optional[str] = None
    airline: Optional[str] = None
    departure: Optional[dict] = None
    arrival: Optional[dict] = None
    price_usd: Optional[float] = None
    passenger_name: Optional[str] = None

class HotelBooking(BaseModel):
    """Schema for hotel bookings"""
    type: Literal["hotel"] = "hotel"
    booking_reference: Optional[str] = None
    hotel_name: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    address: Optional[dict] = None
    nights: Optional[int] = None
    price_usd: Optional[float] = None
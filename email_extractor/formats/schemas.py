from typing import Literal, Optional, List, Any, Union
from pydantic import BaseModel, Field

# --- 1. The Base Model (Shared Fields) ---
class BookingBase(BaseModel):
    # Common fields for all booking types
    id: Optional[str] = Field(None, description="Gmail message ID (for duplicate detection)")
    booking_reference: Optional[str] = Field(None, description="PNR or Confirmation Code")
    price_usd: Optional[float] = Field(None, description="Total cost in USD")
    source_email_id: Optional[str] = Field(None, description="ID of the Gmail message")
    
    # AI / Meta fields
    warning: Optional[str] = Field(None, description="Safety net flags like 'MISSING_DATE'")
    
    # Allow extra fields (so we don't crash if we add new AI tags later)
    class Config:
        extra = "allow"

# --- 2. Specific Models ---

class FlightBooking(BookingBase):
    type: Literal["flight"] = "flight"
    airline: Optional[str] = None
    flight_number: Optional[str] = None
    departure_airport: Optional[str] = None
    arrival_airport: Optional[str] = None
    departure_date: Optional[str] = None # ISO Format string
    arrival_date: Optional[str] = None
    
    # AI Predicted fields
    departure_city_predicted: Optional[str] = None
    arrival_city_predicted: Optional[str] = None

class HotelBooking(BookingBase):
    type: Literal["hotel"] = "hotel"
    hotel_name: Optional[str] = None
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    address: Optional[str] = None
    
    # AI Predicted fields
    city_predicted: Optional[str] = None

class EventBooking(BookingBase):
    type: Literal["event"] = "event"
    venue: Optional[str] = None
    start_time: Optional[str] = None
    
    # AI Predicted fields
    venue_predicted: Optional[str] = None

class UnknownBooking(BookingBase):
    type: Literal["unknown"] = "unknown"

# --- 3. The Response Container ---

# This Union tells FastAPI: "The booking could be ANY of these types"
BookingUnion = Union[FlightBooking, HotelBooking, EventBooking, UnknownBooking]

class EmailResponse(BaseModel):
    total_scanned: int
    relevant_found: int
    bookings: List[BookingUnion]
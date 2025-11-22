from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Union
import logging

# --- NEW IMPORTS ---
from filters.email_filter import should_process_email
from extractors.booking_extractor import extract_booking_data
from services.gmail_service import fetch_recent_booking_emails

# Import schemas from formats folder
from formats.schemas import FlightBooking, HotelBooking, EventBooking, UnknownBooking, BookingUnion

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TrippExtractor")

app = FastAPI(title="Tripp Email Extractor")

# --- REQUEST MODELS ---
class ScanRequest(BaseModel):
    credentials_dict: dict

class SearchRequest(BaseModel):
    credentials_dict: dict
    query: str 

# --- HELPER (DRY Principle) ---
def _process_and_validate(emails: list) -> List[BookingUnion]:
    validated_bookings = []

    for email in emails:
        should_process, email_type = should_process_email(email['from'], email['subject'], email['body'])
        
        if should_process:
            logger.info(f"Processing {email['id']} as {email_type}")
            try:
                # 1. Extract
                raw_data = extract_booking_data(email['body'], email_type)
                
                # 2. Add Metadata (Frontend needs these)
                raw_data['id'] = email['id']  # Required for duplicate detection
                raw_data['source_email_id'] = email['id']
                raw_data['title'] = email['subject'] 

                # 3. Validation
                if email_type == 'flight':
                    booking = FlightBooking(**raw_data)
                elif email_type == 'hotel':
                    booking = HotelBooking(**raw_data)
                elif email_type == 'event':
                    booking = EventBooking(**raw_data)
                else:
                    booking = UnknownBooking(**raw_data)
                
                validated_bookings.append(booking)

            except Exception as e:
                logger.error(f"Validation failed for {email['id']}: {e}")
                validated_bookings.append(UnknownBooking(
                    type="unknown",
                    id=email['id'],
                    source_email_id=email['id'], 
                    warning=f"Validation Error: {str(e)}"
                ))
        else:
            logger.debug(f"Skipping {email['id']}")

    return validated_bookings

# --- ENDPOINTS ---

@app.post("/scan", response_model=List[BookingUnion])
async def scan_emails(request: ScanRequest):
    try:
        emails = fetch_recent_booking_emails(request.credentials_dict, max_results=10, custom_query=None)
        return _process_and_validate(emails)
    except Exception as e:
        logger.error(f"Error in /scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=List[BookingUnion])
async def search_emails(request: SearchRequest):
    try:
        emails = fetch_recent_booking_emails(request.credentials_dict, max_results=10, custom_query=request.query)
        return _process_and_validate(emails)
    except Exception as e:
        logger.error(f"Error in /search: {e}")
        raise HTTPException(status_code=500, detail=str(e))
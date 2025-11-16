# email_extractor/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

print("\n" + "="*50)
print("  SUCCESSFULLY LOADED THE NEW main.py (v4)  ")
print("="*50 + "\n")

# Import your existing Python logic
from filters.email_filter import should_process_email
from extractors.booking_extractor import extract_booking_data
from services.gmail_service import fetch_recent_booking_emails
import json

# --- Define Request Models for our new routes ---
class ScanRequest(BaseModel):
    credentials_dict: dict
    # We can add optional filters later
    # start_date: Optional[str] = None
    # end_date: Optional[str] = None

class SearchRequest(BaseModel):
    credentials_dict: dict
    query: str # Manual search query is required

app = FastAPI(title="Tripp Email Extractor")

# --- This is the "Automated Scan" endpoint ---
@app.post("/scan")
async def scan_emails(request: ScanRequest):
    """
    Fetches, filters, and extracts bookings using the default 30-day query.
    """
    try:
        # 1. Fetch emails using the default query
        # We pass custom_query=None so the fetcher uses its default
        emails = fetch_recent_booking_emails(
            request.credentials_dict, 
            max_results=10, 
            custom_query=None
        )
        
        extracted_bookings = []
        
        # 2. Filter and Extract data from each email
        for email in emails:
            should_process, reason_or_type = should_process_email(email['from'], email['subject'], email['body'])
            
            if should_process:
                print(f"Processing email {email['id']}, detected type: {reason_or_type}")
                try:
                    booking_data = extract_booking_data(email['body'], reason_or_type)
                    
                    # Add ID and Subject for the React review modal
                    # We merge the extracted data (like 'airline') with our own
                    booking_data['id'] = email['id']
                    booking_data['title'] = email['subject']
                    
                    extracted_bookings.append(booking_data)
                except Exception as e:
                    print(f"Extraction failed for email {email['id']}: {e}")
            else:
                print(f"Skipping email {email['id']}: {reason_or_type}")

        # 3. Send the final list of JSON bookings back to Node.js
        return extracted_bookings # FastAPI automatically handles jsonify

    except Exception as e:
        print(f"Error in /scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- This is the "Manual Search" endpoint ---
@app.post("/search")
async def search_emails(request: SearchRequest):
    """
    Fetches, filters, and extracts bookings using a user-provided query.
    """
    try:
        # 1. Fetch emails using the CUSTOM query
        emails = fetch_recent_booking_emails(
            request.credentials_dict, 
            max_results=10, 
            custom_query=request.query # Pass the user's query string
        )
        
        extracted_bookings = []
        
        # 2. Filter and Extract (same logic as /scan)
        for email in emails:
            should_process, reason_or_type = should_process_email(email['from'], email['subject'], email['body'])
            
            if should_process:
                print(f"Processing email {email['id']}, detected type: {reason_or_type}")
                try:
                    booking_data = extract_booking_data(email['body'], reason_or_type)
                    booking_data['id'] = email['id']
                    booking_data['title'] = email['subject']
                    extracted_bookings.append(booking_data)
                except Exception as e:
                    print(f"Extraction failed for email {email['id']}: {e}")
            else:
                print(f"Skipping email {email['id']}: {reason_or_type}")

        # 3. Send the final list back to Node.js
        return extracted_bookings

    except Exception as e:
        print(f"Error in /search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Health Check Endpoint ---
@app.get("/health")
def health_check():
    return {"status": "healthy"}


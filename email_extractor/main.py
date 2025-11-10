# email_extractor/main.py
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from filters.email_filter import should_process_email
from extractors.booking_extractor import extract_booking_data
from services.gmail_service import fetch_recent_booking_emails
import json

# Request model
class ExtractRequest(BaseModel):
    email_id: str
    user_token: str

# Create FastAPI app instance FIRST
app = FastAPI(title="Tripp Email Extractor")

# ✅ EXISTING ENDPOINT - Keep this
@app.post("/extract")
async def extract_email(request: ExtractRequest):
    # Mock email (replace with Gmail API call later)
    mock_email = {
        "from": "confirmation@united.com",
        "subject": "Your flight booking #UA123456",
        "body": "Confirmation for flight UA 123 from JFK to LAX on December 25, 2025. Total: $450.00"
    }
    
    should_process, reason = should_process_email(
        sender=mock_email["from"],
        subject=mock_email["subject"],
        body=mock_email["body"]
    )
    
    if not should_process:
        raise HTTPException(status_code=400, detail=f"Rejected: {reason}")
    
    extracted_data = extract_booking_data(mock_email["body"], reason)
    
    return extracted_data

# ✅ EXISTING ENDPOINT - Keep this
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ✅ NEW GMAIL ENDPOINTS - Add these AFTER app is created
@app.post("/fetch-gmail")
async def fetch_gmail(request: Request):
    """
    Fetch booking emails from Gmail
    Body: { "credentials": {...} }
    """
    try:
        body = await request.json()
        emails = fetch_recent_booking_emails(body["credentials"], max_results=10)
        return {"found": len(emails), "emails": emails}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gmail error: {str(e)}")

@app.post("/extract-gmail-batch")
async def extract_gmail_batch(request: Request):
    """
    Fetch AND extract booking data from Gmail
    Body: { "credentials": {...} }
    """
    try:
        body = await request.json()
        emails = fetch_recent_booking_emails(body["credentials"], max_results=10)
        
        results = []
        for email in emails:
            should_process, reason = should_process_email(
                sender=email["from"],
                subject=email["subject"],
                body=email["body"]
            )
            
            if should_process:
                extracted = extract_booking_data(email["body"], reason)
                results.append({
                    "email_id": email["id"],
                    "from": email["from"],
                    "subject": email["subject"],
                    "extracted": extracted
                })
        
        return {"found": len(emails), "bookings": results}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch extraction error: {str(e)}")
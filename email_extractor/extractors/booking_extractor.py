import re
import spacy
from typing import Dict, Any, Optional
import json 
from dateutil.parser import parse as parse_date

def _safe_parse_date(date_string):
    """
    Tries to parse a human-readable date string into a standard ISO format.
    e.g., "January 10, 2026" -> "2026-01-10T00:00:00"
    """
    if not date_string:
        return None
    try:
        dt = parse_date(date_string)
        return dt.isoformat() 
    except Exception:
        return date_string

# Load the spaCy model. Make sure you've run: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Spacy 'en_core_web_sm' model not found. Please run: python -m spacy download en_core_web_sm")
    nlp = None

def extract_booking_data(email_body: str, email_type: str) -> Dict[str, Any]:
    """
    Main router function.
    Finds common details first, then calls the specific extractor.
    """
    
    # --- NEW LOGGING (v3) ---
    # This proves the new file is loaded and shows what data we're getting
    print("\n" + "="*20 + f" EXTRACTOR (v3) RUNNING FOR TYPE: {email_type} " + "="*20)
    print(f"--- Received Email Body (first 500 chars): ---\n{email_body[:500]}\n" + "-"*50)
    # --------------------------

    results = {"type": email_type}
    
    # 1. Find Common: Booking Reference
    try:
        ref_match = re.search(
            r'\b(?:booking\s+reference|confirmation\s+code)\s*:?\s*#?\s*([A-Z0-9]{5,12})\b',
            email_body,
            re.IGNORECASE
        )
        if ref_match:
            results["booking_reference"] = ref_match.group(1).upper()
    except:
        pass
    
    # 2. Find Common: Price
    try:
        price_match = re.search(
            r'(?:total|price).{0,30}?\$?(\d{1,5}(?:\.\d{2})?)',
            email_body,
            re.IGNORECASE
        )
        if price_match:
            price = float(price_match.group(1))
            if 0.01 <= price <= 100000:
                results["price_usd"] = price
    except:
        pass
    
    # 3. Call Specific Extractor
    if email_type == "flight":
        results.update(_extract_flight(email_body))
    elif email_type == "hotel":
        results.update(_extract_hotel(email_body))
    elif email_type == "event":
        results.update(_extract_event(email_body))
    
    # --- NEW LOGGING ---
    # Show the final dictionary before returning
    print(f"--- Final Extracted Data ---")
    print(json.dumps(results, indent=2))
    print("="*60 + "\n")
    # -------------------
    
    return results

def _extract_flight(email_body: str) -> Dict[str, Any]:
    """Extracts flight-specific details"""
    details = {}
    
    # 1. Find Airport Codes
    try:
        depart_match = re.search(r'Depart:\s*([A-Z]{3})', email_body)
        arrive_match = re.search(r'Arrive:\s*([A-Z]{3})', email_body)
        if depart_match and arrive_match:
            details["departure_airport"] = depart_match.group(1)
            details["arrival_airport"] = arrive_match.group(1)
    except:
        pass
    
    # 2. Find Airline
    try:
        airline_match = re.search(r'Airline:\s*(.*?)\n', email_body, re.IGNORECASE)
        if airline_match:
            details["airline"] = airline_match.group(1).strip()
    except:
        pass
    
    # 3. Find Flight Date
    try:
        date_match = re.search(r'Departure Date:\s*(.*?)\n', email_body, re.IGNORECASE)
        if date_match:
            # --- THIS IS THE FIX ---
            details["departure_date"] = _safe_parse_date(date_match.group(1).strip())
            # ----------------------

        arrival_match = re.search(r'Arrival Date:\s*(.*?)\n', email_body, re.IGNORECASE)
        if arrival_match:
                # --- THIS IS THE FIX ---
            details["arrival_date"] = _safe_parse_date(arrival_match.group(1).strip())
            # ----------------------
    except:
        pass
    
    # --- NEW LOGGING ---
    print(f"--- _extract_flight results: {details} ---")
    # -------------------
    return details

def _extract_hotel(email_body: str) -> Dict[str, Any]:
    """Extracts hotel-specific details (UPGRADED)"""
    details = {}
    
    # 1. Find Hotel Name
    try:
        hotel_match = re.search(r'Hotel:\s*(.*?)\n', email_body, re.IGNORECASE)
        if hotel_match:
            details["hotel_name"] = hotel_match.group(1).strip()
    except:
        pass
    
    # 2. Find Nights
    try:
        nights_match = re.search(r'(\d{1,2})\s*nights?', email_body, re.IGNORECASE)
        if nights_match:
            details["nights"] = int(nights_match.group(1))
    except:
        pass

    # 3. Find Check-in Date
    try:
        check_in_match = re.search(r'Check-in:\s*(.*?)\n', email_body, re.IGNORECASE)
        if check_in_match:
            # --- THIS IS THE FIX ---
            details["check_in_date"] = _safe_parse_date(check_in_match.group(1).strip())
            # ----------------------
    except Exception:
        pass

    # 4. Find Check-out Date
    try:
        check_out_match = re.search(r'Check-out:\s*(.*?)\n', email_body, re.IGNORECASE)
        if check_out_match:
            # --- THIS IS THE FIX ---
            details["check_out_date"] = _safe_parse_date(check_out_match.group(1).strip())
            # ----------------------
    except Exception:
        pass

    # 5. Find Address
    try:
        address_match = re.search(r'Address:\s*(.*?)\n', email_body, re.IGNORECASE)
        if address_match:
            details["address"] = address_match.group(1).strip()
    except:
        pass
    
    # --- NEW LOGGING ---
    print(f"--- _extract_hotel results: {details} ---")
    # -------------------
    return details

def _extract_event(email_body: str) -> Dict[str, Any]:
    """Extracts event/ticket-specific details"""
    details = {}
    try:
        venue_match = re.search(r'Venue:\s*(.*?)\n', email_body, re.IGNORECASE)
        if venue_match:
            details["venue"] = venue_match.group(1).strip()
    except Exception:
        pass
        
    # --- NEW LOGGING ---
    print(f"--- _extract_event results: {details} ---")
    # -------------------
    return details
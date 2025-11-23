import re
import spacy
from typing import Dict, Any, Optional
import json 
from dateutil.parser import parse as parse_date
import logging

# --- SETUP LOGGING ---
logger = logging.getLogger("BookingExtractor")

# --- GLOBAL VAR FOR LAZY LOADING ---
_nlp_model = None

def get_nlp_model():
    """Lazy loads the SpaCy model only when needed."""
    global _nlp_model
    if _nlp_model is None:
        try:
            logger.info("⏳ Lazy-Loading AI Model (en_core_web_sm)...")
            _nlp_model = spacy.load("en_core_web_sm")
            logger.info("✅ AI Model Loaded.")
        except OSError:
            logger.error("❌ Spacy model not found. Run: python -m spacy download en_core_web_sm")
            _nlp_model = False # Set to False so we don't try loading again
    return _nlp_model if _nlp_model else None

def _safe_parse_date(date_string):
    if not date_string: return None
    try:
        dt = parse_date(date_string)
        return dt.isoformat() 
    except Exception:
        return date_string

# --- MAIN ROUTER ---

def extract_booking_data(email_body: str, email_type: str) -> Dict[str, Any]:
    logger.info(f"Hybrid Extractor running for: {email_type}")
    
    # 1. Get NLP model (Lazy Load)
    nlp = get_nlp_model()
    doc = nlp(email_body) if nlp else None

    results = {"type": email_type}
    
    # 2. Regex: Reference & Price
    try:
        ref_match = re.search(r'\b(?:booking\s+reference|confirmation\s+code)\s*:?\s*#?\s*([A-Z0-9]{5,12})\b', email_body, re.IGNORECASE)
        if ref_match: results["booking_reference"] = ref_match.group(1).upper()
        
        price_match = re.search(r'(?:total|price).{0,30}?\$?(\d{1,5}(?:\.\d{2})?)', email_body, re.IGNORECASE)
        if price_match: results["price_usd"] = float(price_match.group(1))
    except Exception: pass
    
    # 3. Specific Extractor
    if email_type == "flight":
        results.update(_extract_flight(email_body, doc))
    elif email_type == "hotel":
        results.update(_extract_hotel(email_body, doc))
    elif email_type == "event":
        results.update(_extract_event(email_body, doc))
    
    logger.debug(f"Extracted Data: {json.dumps(results, default=str)}")
    return results

# --- SPECIFIC EXTRACTORS ---

def _extract_flight(email_body: str, doc=None) -> Dict[str, Any]:
    details = {}
    warnings = []
    
    # Regex
    depart_match = re.search(r'Depart:\s*([A-Z]{3})', email_body)
    arrive_match = re.search(r'Arrive:\s*([A-Z]{3})', email_body)
    if depart_match: details["departure_airport"] = depart_match.group(1)
    if arrive_match: details["arrival_airport"] = arrive_match.group(1)

    # AI Fallback for Cities
    if doc and ("departure_airport" not in details or "arrival_airport" not in details):
        locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
        if len(locations) >= 2:
            if "departure_airport" not in details: details["departure_city_predicted"] = locations[0]
            if "arrival_airport" not in details: details["arrival_city_predicted"] = locations[1]

    # Regex Airline & Date
    airline_match = re.search(r'Airline:\s*(.*?)\n', email_body, re.IGNORECASE)
    if airline_match: details["airline"] = airline_match.group(1).strip()

    date_match = re.search(r'Departure Date:\s*(.*?)\n', email_body, re.IGNORECASE)
    if date_match: details["departure_date"] = _safe_parse_date(date_match.group(1).strip())

    # Safety Net
    if "departure_date" not in details:
        if doc:
            dates = [ent.text for ent in doc.ents if ent.label_ == "DATE"]
            if dates:
                details["departure_date_raw"] = dates[0]
                warnings.append("DATE_PREDICTED_UNVERIFIED")
            else:
                warnings.append("MISSING_DATE")
        else:
            warnings.append("MISSING_DATE")

    if warnings: details["warning"] = "; ".join(warnings)
    return details

def _extract_hotel(email_body: str, doc=None) -> Dict[str, Any]:
    details = {}
    warnings = []
    
    # Regex Dates
    check_in_match = re.search(r'Check-in:\s*(.*?)\n', email_body, re.IGNORECASE)
    if check_in_match: details["check_in_date"] = _safe_parse_date(check_in_match.group(1).strip())
    
    check_out_match = re.search(r'Check-out:\s*(.*?)\n', email_body, re.IGNORECASE)
    if check_out_match: details["check_out_date"] = _safe_parse_date(check_out_match.group(1).strip())

    # Calculate Nights (New Logic)
    if "check_in_date" in details and "check_out_date" in details:
        try:
            d1 = parse_date(details["check_in_date"])
            d2 = parse_date(details["check_out_date"])
            details["nights"] = (d2 - d1).days
        except: pass

    # Hotel Name
    hotel_regex = re.search(r'Hotel:\s*(.*?)\n', email_body, re.IGNORECASE)
    if hotel_regex:
        details["hotel_name"] = hotel_regex.group(1).strip()
    elif doc:
        potential_hotels = [ent.text for ent in doc.ents if ent.label_ in ["ORG", "FAC"] and any(w in ent.text.lower() for w in ['hotel', 'resort', 'inn', 'stay'])]
        if potential_hotels: details["hotel_name"] = potential_hotels[0]

    # Address
    address_regex = re.search(r'Address:\s*(.*?)\n', email_body, re.IGNORECASE)
    if address_regex:
        details["address"] = address_regex.group(1).strip()
    elif doc:
        cities = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
        if cities: details["city_predicted"] = cities[-1]

    # Safety Net (Fixed Logic)
    if "check_in_date" not in details:
        details["check_in_date"] = None
        warnings.append("MISSING_CHECK_IN")
    
    if "hotel_name" not in details:
        details["hotel_name"] = "Unknown Hotel"
        warnings.append("MISSING_NAME")

    if warnings: details["warning"] = "; ".join(warnings)
    return details

def _extract_event(email_body: str, doc=None) -> Dict[str, Any]:
    details = {}
    warnings = []

    venue_match = re.search(r'Venue:\s*(.*?)\n', email_body, re.IGNORECASE)
    if venue_match: 
        details["venue"] = venue_match.group(1).strip()
    elif doc:
        venues = [ent.text for ent in doc.ents if ent.label_ == "FAC"]
        if venues: details["venue_predicted"] = venues[0]
    
    event_date_match = re.search(r'Date:\s*(.*?)\n', email_body, re.IGNORECASE)
    if event_date_match:
        details["start_time"] = _safe_parse_date(event_date_match.group(1).strip())

    if "start_time" not in details:
        if doc:
            dates = [ent.text for ent in doc.ents if ent.label_ == "DATE"]
            if dates: details["start_time_raw"] = dates[0]
        
        if "start_time" not in details and "start_time_raw" not in details:
             warnings.append("MISSING_DATE")

    if warnings: details["warning"] = "; ".join(warnings)
    return details
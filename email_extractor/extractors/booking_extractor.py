import re
import spacy
from typing import Dict, Any, Optional

nlp = spacy.load("en_core_web_sm")

def extract_booking_data(email_body: str, email_type: str) -> Dict[str, Any]:
    results = {"type": email_type}
    
    # SURGICAL FIX: More specific pattern that looks for "Reference" explicitly
    try:
        ref_match = re.search(
            r'\b(?:booking\s+reference|confirmation\s+code|ticket\s+number|order\s+id)\s*:?\s*#?\s*([A-Z0-9]{5,12})\b',
            email_body,
            re.IGNORECASE
        )
        if ref_match:
            results["booking_reference"] = ref_match.group(1).upper()
    except:
        pass
    
    # Rest of the function unchanged...
    try:
        price_match = re.search(
            r'(?:total|price|amount).{0,30}?\$?(\d{1,5}(?:\.\d{2})?)',
            email_body,
            re.IGNORECASE
        )
        if price_match:
            price = float(price_match.group(1))
            if 0.01 <= price <= 100000:
                results["price_usd"] = price
    except:
        pass
    
    if email_type == "flight":
        results.update(_extract_flight(email_body))
    elif email_type == "hotel":
        results.update(_extract_hotel(email_body))
    
    return results

def _extract_flight(email_body: str) -> Dict[str, Any]:
    details = {}
    try:
        airports = re.findall(r'\b([A-Z]{3})\b', email_body)
        if len(airports) >= 2:
            details["departure_airport"] = airports[0]
            details["arrival_airport"] = airports[1]
    except:
        pass
    
    try:
        doc = nlp(email_body[:500])
        for ent in doc.ents:
            if ent.label_ == "ORG" and any(word in ent.text.lower() for word in ["air", "jet"]):
                details["airline"] = ent.text
                break
    except:
        pass
    
    try:
        doc = nlp(email_body)
        dates = [ent.text for ent in doc.ents if ent.label_ == "DATE"]
        if dates:
            details["departure_date"] = dates[0]
    except:
        pass
    
    return details

def _extract_hotel(email_body: str) -> Dict[str, Any]:
    details = {}
    try:
        doc = nlp(email_body[:500])
        for ent in doc.ents:
            if ent.label_ == "ORG" and any(x in ent.text.lower() for x in ["hotel", "inn", "marriott", "hilton"]):
                hotel_name = ent.text.split('\n')[0].strip().split('.')[0].strip()
                details["hotel_name"] = hotel_name
                break
    except:
        pass
    
    try:
        nights_match = re.search(r'(\d{1,2})\s*nights?', email_body, re.IGNORECASE)
        if nights_match:
            nights = int(nights_match.group(1))
            if 1 <= nights <= 365:
                details["nights"] = nights
    except:
        pass
    
    return details

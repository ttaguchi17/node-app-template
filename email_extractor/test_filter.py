# test_extractor.py
import json
from extractors.booking_extractor import extract_booking_data

# Test flight email
FLIGHT_EMAIL_BODY = """
Confirmation: Flight UA 1234
Date: December 25, 2025
Depart: JFK Terminal 7 at 2:30 PM
Arrive: LAX Terminal 2 at 6:45 PM
Passenger: John Doe
Total: $450.00 USD
Booking Reference: UA45B7N
"""

# Test hotel email
HOTEL_EMAIL_BODY = """
Hotel: Marriott Downtown Chicago
Check-in: January 15, 2026
Check-out: January 18, 2026
3 nights
Address: 350 W Mart Center Dr, Chicago, IL
Confirmation: MC7821
Total: $687.50 USD
"""

def test_extractor():
    print("="*50)
    print("TESTING EXTRACTION LOGIC")
    print("="*50)
    
    # Test flight
    print("\n✈️  Testing Flight Extraction")
    extracted = extract_booking_data(FLIGHT_EMAIL_BODY, "flight")
    print(f"Found {len(extracted)} fields:")
    print(json.dumps(extracted, indent=2))
    
    # Test hotel
    print("\n🏨 Testing Hotel Extraction")
    extracted = extract_booking_data(HOTEL_EMAIL_BODY, "hotel")
    print(f"Found {len(extracted)} fields:")
    print(json.dumps(extracted, indent=2))

if __name__ == "__main__":
    test_extractor()
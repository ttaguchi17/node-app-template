# filters/email_filter.py
import re
from typing import Optional

# Define your trusted senders (case-insensitive)
TRUSTED_SENDERS = {
    # Airlines
    r'.*@united\.com$',
    r'.*@delta\.com$',
    r'.*@americanairlines\.com$',
    r'.*@booking\.com$',
    r'.*@expedia\.com$',
    # Hotels
    r'.*@marriott\.com$',
    r'.*@hilton\.com$',
    r'noreply@airbnb\.com$',
    # Events
    r'.*@eventbrite\.com$',
    r'.*@ticketmaster\.com$',
}

# Define required keywords for each type
KEYWORD_PATTERNS = {
    "flight": [
        r'\b(booking|confirmation|ticket|itinerary)\b',
        r'\b(flight|airline|departure|arrival)\b',
        r'\b([A-Z]{3})\b',  # Airport codes
    ],
    "hotel": [
        r'\b(reservation|booking|confirmation)\b',
        r'\b(check.in|check.out|nights)\b',
        r'\b(hotel|room|suite)\b'
    ],
    "event": [
        r'\b(ticket|event|venue)\b',
        r'\b(show|concert|game)\b'
    ]
}

# Anti-spam patterns (if these match, REJECT)
SPAM_PATTERNS = [
    r'\b(promotion|discount|sale|offer|deal|unsubscribe)\b',
    r'\bclick here\b.*\b(unsubscribe|opt.out)\b',
    r'ADVERTISEMENT',
    r'^\[.*?\]'  # Subject lines like "[PROMO] Flight deals!"
]

def is_trusted_sender(sender_email: str) -> bool:
    """
    Check if sender is in our whitelist
    """
    return any(
        re.match(pattern, sender_email, re.IGNORECASE) 
        for pattern in TRUSTED_SENDERS
    )

def contains_required_keywords(email_text: str, email_type: str) -> bool:
    """
    Check if email has keywords for its type.
    Must match at least one keyword from EACH of the first 2 pattern groups.
    """
    patterns = KEYWORD_PATTERNS.get(email_type, [])
    if len(patterns) < 2:
        return False
    
    # Group 1: Must match at least one keyword
    group1_matches = any(
        re.search(pattern, email_text, re.IGNORECASE) 
        for pattern in [patterns[0]]
    )
    
    # Group 2: Must match at least one keyword  
    group2_matches = any(
        re.search(pattern, email_text, re.IGNORECASE) 
        for pattern in [patterns[1]]
    )
    
    return group1_matches and group2_matches

def is_spam_or_promotion(email_text: str, subject: str) -> bool:
    """Aggressively filter spam"""
    combined_text = f"{subject}\n{email_text}"
    return any(re.search(p, combined_text, re.IGNORECASE) 
               for p in SPAM_PATTERNS)

def should_process_email(sender: str, subject: str, body: str) -> tuple[bool, Optional[str]]:
    """
    Returns: (should_process, reason_if_rejected or detected_type)
    """
    combined_text = f"{subject}\n{body}"
    
    if not is_trusted_sender(sender):
        return False, f"Untrusted sender: {sender}"
    
    if is_spam_or_promotion(body, subject):
        return False, "Detected as promotional/spam"
    
    for email_type in KEYWORD_PATTERNS.keys():
        if contains_required_keywords(combined_text, email_type):
            return True, email_type
    
    return False, "No matching booking patterns found"
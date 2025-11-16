# services/gmail_service.py
import base64
import re
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from bs4 import BeautifulSoup # <-- NEW IMPORT

def get_email_body(payload):
    """
    Recursively search for 'text/plain' and 'text/html' parts.
    Prefers plain text, but falls back to HTML.
    """
    body = ""
    html_body = ""

    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                body_data = part['body'].get('data', '')
                if body_data:
                    # Found plain text, use it and stop.
                    return base64.urlsafe_b64decode(body_data).decode('utf-8')
            
            if part['mimeType'] == 'text/html':
                body_data = part['body'].get('data', '')
                if body_data:
                    html_body = base64.urlsafe_b64decode(body_data).decode('utf-8')
            
            # Recurse for multipart/alternative
            # Fix: Check for payload in part *before* recursing
            if 'payload' in part and 'parts' in part['payload']:
                # This part might have the text, so check it
                recursive_body = get_email_body(part['payload'])
                if recursive_body: 
                    return recursive_body

    elif 'body' in payload:
        body_data = payload['body'].get('data', '')
        if body_data and payload['mimeType'] == 'text/plain':
            return base64.urlsafe_b64decode(body_data).decode('utf-8')
        if body_data and payload['mimeType'] == 'text/html':
            html_body = base64.urlsafe_b64decode(body_data).decode('utf-8')

    # If we are here, we only found an HTML body (or nothing)
    if not body and html_body:
        # We need html.parser, make sure 'pip install beautifulsoup4' is run
        soup = BeautifulSoup(html_body, 'html.parser')
        return soup.get_text(separator='\n') # Convert HTML to plain text

    return body # Return plain text or empty string

def fetch_recent_booking_emails(credentials_dict, max_results=10, custom_query=None):
    """
    Fetch emails from Gmail using OAuth tokens.
    """
    try:
        creds = Credentials.from_authorized_user_info(credentials_dict)
        service = build('gmail', 'v1', credentials=creds)
        
        # --- THIS IS THE CORRECTED LOGIC ---
        if custom_query:
            query = custom_query
            print(f"Executing CUSTOM Gmail query: {query}")
        else:
            # Automated Scan query
            default_senders = [
                'from:united.com', 'from:delta.com', 'from:marriott.com',
                'from:booking.com', 'from:hilton.com', 'from:expedia.com',
                'from:airbnb.com', 'from:eventbrite.com', 'from:ticketmaster.com',
                'from:KantemirMuratov@gmail.com'
            ]
            sender_query = " OR ".join(default_senders)
            query = f"newer_than:30d ({sender_query})"
            print(f"Executing DEFAULT Gmail query: {query}")

        # --- THIS 'results' CALL IS NOW *OUTSIDE* THE IF/ELSE ---
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=max_results
        ).execute()
        
        emails = []
        # Loop through each email ID
        for msg in results.get('messages', []):
            # Get the full email content
            message = service.users().messages().get(
                userId='me',
                id=msg['id']
            ).execute()

            if 'payload' not in message:
                print(f"Skipping malformed email {msg['id']}: No payload found.")
                continue # Go to the next email

            payload = message['payload']
            headers = payload['headers']
            
            # Extract headers
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            
            email_match = re.search(r'<(.+?)>', sender)
            sender_email = email_match.group(1) if email_match else sender
            body = get_email_body(payload)

            emails.append({
                'id': msg['id'],
                'from': sender_email,
                'subject': subject,
                'body': body # <-- NO MORE [:2000] TRUNCATION
            })
        
        # Return the final list of clean emails
        return emails
        
    except Exception as e:
        print(f"Gmail API error: {str(e)}")
        raise e
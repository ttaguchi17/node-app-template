# services/gmail_service.py
import base64
import re
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# --- THIS IS THE MODIFICATION ---
# We've added 'custom_query=None'
def fetch_recent_booking_emails(credentials_dict, max_results=10, custom_query=None):
    """
    Fetch emails from Gmail using OAuth tokens.
    If custom_query is provided, it's used.
    Otherwise, a default automated scan query is used.
    """
    try:
        creds = Credentials.from_authorized_user_info(credentials_dict)
        service = build('gmail', 'v1', credentials=creds)
        
        # This is the new logic:
        if custom_query:
            query = custom_query
            print(f"Executing CUSTOM Gmail query: {query}")
        else:
            # Default "Automated Scan" query
            query = "newer_than:30d (from:united.com OR from:delta.com OR from:marriott.com OR from:booking.com OR from:hilton.com OR from:expedia.com OR from:airbnb.com OR from:eventbrite.com OR from:ticketmaster.com)"
            print(f"Executing DEFAULT Gmail query: {query}")
        
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=max_results
        ).execute()
        
        emails = []
        for msg in results.get('messages', []):
            # ... (The rest of your function is perfect and unchanged)
            message = service.users().messages().get(
                userId='me',
                id=msg['id']
            ).execute()
            
            headers = message['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            
            email_match = re.search(r'<(.+?)>', sender)
            sender_email = email_match.group(1) if email_match else sender
            
            body = ""
            if 'parts' in message['payload']:
                for part in message['payload']['parts']:
                    if part['mimeType'] == 'text/plain':
                        body_data = part['body'].get('data', '')
                        if body_data:
                            body = base64.urlsafe_b64decode(body_data).decode('utf-8')
                            break
            elif 'body' in message['payload']:
                body_data = message['payload']['body'].get('data', '')
                if body_data:
                    body = base64.urlsafe_b64decode(body_data).decode('utf-8')
            
            emails.append({
                'id': msg['id'],
                'from': sender_email,
                'subject': subject,
                'body': body[:2000] # Limit body size
            })
        
        return emails
        
    except Exception as e:
        print(f"Gmail API error: {str(e)}")
        raise
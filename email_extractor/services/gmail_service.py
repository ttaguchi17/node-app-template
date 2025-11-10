import base64
import re
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def fetch_recent_booking_emails(credentials_dict, max_results=10):
    """
    Fetch emails from Gmail using OAuth tokens
    Returns: List of {id, from, subject, body}
    """
    try:
        creds = Credentials.from_authorized_user_info(credentials_dict)
        service = build('gmail', 'v1', credentials=creds)
        
        # Search for travel emails from last 30 days
        query = "newer_than:30d (from:united.com OR from:delta.com OR from:marriott.com OR from:booking.com OR from:hilton.com)"
        
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=max_results
        ).execute()
        
        emails = []
        for msg in results.get('messages', []):
            message = service.users().messages().get(
                userId='me',
                id=msg['id']
            ).execute()
            
            # Extract headers
            headers = message['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            
            # Clean sender email
            email_match = re.search(r'<(.+?)>', sender)
            sender_email = email_match.group(1) if email_match else sender
            
            # Get email body
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
                'body': body[:2000]  # Limit body size
            })
        
        return emails
        
    except Exception as e:
        print(f"Gmail API error: {str(e)}")
        raise
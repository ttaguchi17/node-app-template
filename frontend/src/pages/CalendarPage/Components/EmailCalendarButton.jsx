import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function EmailCalendarButton({ events }) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  const sendEmail = () => {
    let icsContent = 'BEGIN:VCALENDAR\\nVERSION:2.0\\nPRODID:-//Travel App//Calendar//EN\\n';
    
    events.forEach(event => {
      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      icsContent += 'BEGIN:VEVENT\\n';
      icsContent += `UID:${event.id}@travelapp.com\\n`;
      icsContent += `DTSTART:${formatDate(event.startDate)}\\n`;
      icsContent += `DTEND:${formatDate(event.endDate)}\\n`;
      icsContent += `SUMMARY:${event.tripName} - ${event.eventName}\\n`;
      if (event.location) {
        icsContent += `LOCATION:${event.location}\\n`;
      }
      icsContent += 'END:VEVENT\\n';
    });
    
    icsContent += 'END:VCALENDAR';
    
    console.log('ICS Content:', icsContent);
    console.log('Sending email to:', emailAddress);
    
    // In a real application, you would send this ICS content to a backend API
    // that handles sending the email.
    
    setIsOpen(false);
    setEmailAddress('');
    alert(`Calendar has been 'sent' to ${emailAddress}. (Simulated)`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-[#7BA5FF] hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <Mail className="w-4 h-4 mr-2" />
          Email Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Email Your Calendar</DialogTitle>
          <DialogDescription>
            Enter the email address to send your travel calendar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="emailAddress">Email Address</Label>
            <Input
              id="emailAddress"
              placeholder="e.g., example@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={sendEmail}
            className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] hover:from-[#3a5ce7] hover:to-[#6b95ef]"
            disabled={!emailAddress}
          >
            Send Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
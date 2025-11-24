import { Download } from 'lucide-react';
import { Button } from '../ui/button';

export function ExportButton({ events }) {
  const exportToCalendar = () => {
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
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'travel-calendar.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={exportToCalendar}
      className="bg-white text-[#7BA5FF] hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
    >
      <Download className="w-4 h-4 mr-2" />
      Export Calendar
    </Button>
  );
}
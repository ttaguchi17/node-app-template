import { useState } from 'react';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { ViewToggle } from '../components/calendar/ViewToggle';
import { CalendarMonthView } from '../components/calendar/CalendarMonthView';
import { EventListView } from '../components/calendar/EventListView';

// Mock data for initial events
const mockEvents = [
  {
    id: '1',
    tripName: 'Turkey Trip',
    eventName: 'Flight to Istanbul',
    startDate: new Date(2025, 10, 11, 10, 0),
    endDate: new Date(2025, 10, 11, 14, 0),
    location: 'Istanbul Airport',
    type: 'flight',
    color: 'bg-blue-500',
  },
  {
    id: '2',
    tripName: 'Turkey Trip',
    eventName: 'Hotel Check-in',
    startDate: new Date(2025, 10, 11, 16, 0),
    endDate: new Date(2025, 10, 11, 17, 0),
    location: 'Sultanahmet Hotel',
    type: 'hotel',
    color: 'bg-blue-500',
  },
  {
    id: '3',
    tripName: 'Turkey Trip',
    eventName: 'Hagia Sophia Tour',
    startDate: new Date(2025, 10, 12, 9, 0),
    endDate: new Date(2025, 10, 12, 12, 0),
    location: 'Hagia Sophia',
    type: 'activity',
    color: 'bg-blue-500',
  },
  {
    id: '4',
    tripName: 'Japan Trip',
    eventName: 'Flight to Tokyo',
    startDate: new Date(2025, 11, 18, 8, 0),
    endDate: new Date(2025, 11, 18, 20, 0),
    location: 'Narita Airport',
    type: 'flight',
    color: 'bg-purple-500',
  },
  {
    id: '5',
    tripName: 'Japan Trip',
    eventName: 'Mt. Fuji Day Trip',
    startDate: new Date(2025, 11, 20, 7, 0),
    endDate: new Date(2025, 11, 20, 18, 0),
    location: 'Mt. Fuji',
    type: 'activity',
    color: 'bg-purple-500',
  },
];

export default function CalendarPage() {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState(mockEvents);

  // Month navigation functions
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Add new event function
  const handleAddEvent = (event) => {
    setEvents([...events, event]);
  };

  // View change function
  const handleViewChange = (newView) => {
    setView(newView);
  };

  return (
    <div className="p-8">
      {/* Header with action buttons */}
      <CalendarHeader events={events} onAddEvent={handleAddEvent} />

      {/* View toggle buttons */}
      <ViewToggle view={view} onViewChange={handleViewChange} />

      {/* Conditional rendering based on view */}
      {view === 'month' ? (
        <CalendarMonthView
          currentDate={currentDate}
          events={events}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      ) : (
        <EventListView events={events} />
      )}
    </div>
  );
}
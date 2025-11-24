import { useState, useMemo } from 'react';

// Mock data for initial events (moved from CalendarPage)
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

/**
 * Custom hook to manage the state and logic for the calendar application.
 * @returns {object} The calendar state and handlers.
 */
export function useCalendarLogic() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState(mockEvents);

  // Memoize the month string for display
  const currentMonthDisplay = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate]);

  // Month navigation functions
  const handlePrevMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1));
  };

  // Add new event function
  const handleAddEvent = (event) => {
    // Ensure event has a unique ID, especially for new objects
    const newEvent = { ...event, id: event.id || String(Date.now()) };
    setEvents(prevEvents => [...prevEvents, newEvent]);
  };

  // View change function
  const handleViewChange = (newView) => {
    setView(newView);
  };

  return {
    currentDate,
    currentMonthDisplay,
    view,
    events,
    handlePrevMonth,
    handleNextMonth,
    handleAddEvent,
    handleViewChange,
  };
}

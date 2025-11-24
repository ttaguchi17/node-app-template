export function CalendarGrid({ currentDate, events }) {
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const getTripRanges = () => {
    const tripMap = new Map();
    
    events.forEach(event => {
      if (!tripMap.has(event.tripName)) {
        tripMap.set(event.tripName, {
          startDate: event.startDate,
          endDate: event.endDate,
          color: event.color,
        });
      } else {
        const trip = tripMap.get(event.tripName);
        if (event.startDate < trip.startDate) {
          trip.startDate = event.startDate;
        }
        if (event.endDate > trip.endDate) {
          trip.endDate = event.endDate;
        }
      }
    });
    
    return Array.from(tripMap.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  };

  const trips = getTripRanges();
  const today = new Date();
  
  const getEventsForDay = (day) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return trips.filter(trip => {
      // Check if the day is between or equal to the start and end date
      return dayDate >= trip.startDate && dayDate <= trip.endDate;
    });
  };

  // Create an array for the grid, including leading empty spaces
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <div className="grid grid-cols-7 text-center font-medium text-gray-500 border-b border-gray-200 mb-2">
        {weekDays.map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="p-2 min-h-24" />;
          }

          const tripsForDay = getEventsForDay(day);
          
          const isToday = day === today.getDate() && 
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();

          return (
            <div
              key={day}
              className={`p-2 min-h-24 border rounded-lg transition-all duration-300 hover:shadow-lg cursor-pointer relative ${
                isToday ? 'border-[#4A6CF7] border-2' : 'border-gray-200'
              } ${tripsForDay.length > 0 ? 'bg-gradient-to-br shadow-md' : 'bg-gray-50'} ${
                tripsForDay.some(t => t.name === 'Turkey Trip') && tripsForDay.some(t => t.name === 'Japan Trip')
                  ? 'from-[#4A6CF7]/20 via-purple-100 to-purple-100'
                  : tripsForDay.some(t => t.name === 'Turkey Trip')
                  ? 'from-[#4A6CF7]/10 to-[#7BA5FF]/30'
                  : tripsForDay.some(t => t.name === 'Japan Trip')
                  ? 'from-purple-50 to-purple-100'
                  : ''
              }`}
            >
              <div className={`mb-1 flex items-center justify-between ${
                isToday ? 'text-[#4A6CF7]' : tripsForDay.length > 0 ? 'text-gray-700' : 'text-gray-500'
              }`}>
                <span className="text-sm">{day}</span>
                {isToday && (
                  <span className="w-2 h-2 bg-[#4A6CF7] rounded-full"></span>
                )}
              </div>
              
              <div className="space-y-1">
                {tripsForDay.map(trip => (
                  <div 
                    key={trip.name} 
                    className="truncate text-xs text-white px-2 py-0.5 rounded-md shadow-sm"
                    style={{ backgroundColor: trip.color }}
                  >
                    {trip.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
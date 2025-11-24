import { Card } from '../ui/card';
import { MonthNavigator } from './MonthNavigator';
import { CalendarGrid } from './CalendarGrid';
import { CalendarLegend } from './CalendarLegend';

export function CalendarMonthView({ currentDate, events, onPrevMonth, onNextMonth }) {
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

  const formatDateRange = (startDate, endDate) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = monthNames[startDate.getMonth()];
    const endMonth = monthNames[endDate.getMonth()];
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
  };

  const trips = getTripRanges().map(trip => ({
    name: trip.name,
    color: trip.color,
    dateRange: formatDateRange(trip.startDate, trip.endDate),
  }));

  return (
    <Card className="p-6 shadow-2xl border-0 bg-white">
      <MonthNavigator 
        currentDate={currentDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
      <CalendarGrid currentDate={currentDate} events={events} />
      <CalendarLegend trips={trips} />
    </Card>
  );
}
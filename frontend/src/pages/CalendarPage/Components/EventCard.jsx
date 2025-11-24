import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export function EventCard({ event }) {
  return (
    <Card className="p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border-0 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={`${event.color} text-white shadow-md`}>
              {event.tripName}
            </Badge>
            <Badge variant="outline" className="shadow-sm">
              {event.type}
            </Badge>
          </div>
          <h3 className="text-xl mb-3">{event.eventName}</h3>
          <div className="space-y-2 text-gray-600">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>
                {event.startDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {event.startDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {event.endDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
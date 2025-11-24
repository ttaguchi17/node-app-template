import { EventCard } from './EventCard';

export function EventListView({ events }) {
  return (
    <div className="space-y-4">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

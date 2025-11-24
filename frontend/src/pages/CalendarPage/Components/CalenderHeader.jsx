import { Calendar as CalendarIcon } from 'lucide-react';
import { ExportButton } from './ExportButton';
import { AddEventButton } from './AddEventButton';
import { EmailCalendarButton } from './EmailCalendarButton';

export function CalendarHeader({ events, onAddEvent }) {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-10 h-10" />
              <h1 className="text-5xl">My Calendar</h1>
            </div>
            <p className="text-white/90 text-lg">All your trips and events in one place</p>
          </div>
          <div className="flex gap-3">
            <ExportButton events={events} />
            <AddEventButton onAddEvent={onAddEvent} />
            <EmailCalendarButton events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
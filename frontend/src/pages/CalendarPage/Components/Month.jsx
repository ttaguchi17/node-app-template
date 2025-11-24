import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MonthNavigator({ currentDate, onPrevMonth, onNextMonth }) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex justify-between items-center mb-6">
      <button
        onClick={onPrevMonth}
        className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:shadow-md transform hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h2 className="text-2xl">
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </h2>
      <button
        onClick={onNextMonth}
        className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:shadow-md transform hover:scale-110"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
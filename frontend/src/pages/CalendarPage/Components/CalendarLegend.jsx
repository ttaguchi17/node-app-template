export function CalendarLegend({ trips }) {
  const getColorClass = (color) => {
    const colorMap = {
      'bg-blue-500': 'bg-[#4A6CF7]',
      'bg-purple-500': 'bg-purple-500',
      'bg-green-500': 'bg-green-500',
      'bg-orange-500': 'bg-orange-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div className="mt-6 pt-6 border-t">
      <h3 className="text-sm mb-3 text-gray-600">Upcoming Trips</h3>
      <div className="flex gap-4 flex-wrap">
        {trips.map((trip, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-4 h-4 ${getColorClass(trip.color)} rounded shadow-sm`} />
            <span className="text-sm">{trip.name} ({trip.dateRange})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useState } from 'react';

export function BudgetBar({ budget, personSpending }) {
  const [hoveredPerson, setHoveredPerson] = useState(null);

  const totalSpent = personSpending.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
      {personSpending.map((person, index) => {
        const percentage = (person.amount / budget) * 100;
        const leftOffset = personSpending
          .slice(0, index)
          .reduce((sum, p) => sum + (p.amount / budget) * 100, 0);

        const isHovered = hoveredPerson === person.id;
        const opacity = hoveredPerson === null || isHovered ? 1 : 0.3;

        return (
          <div
            key={person.id}
            className="absolute h-full transition-all duration-200 cursor-pointer"
            style={{
              left: `${leftOffset}%`,
              width: `${percentage}%`,
              backgroundColor: person.color,
              opacity,
            }}
            onMouseEnter={() => setHoveredPerson(person.id)}
            onMouseLeave={() => setHoveredPerson(null)}
          >
            {isHovered && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap z-10 shadow-lg">
                <div className="text-center">
                  <p className="font-medium">{person.name}</p>
                  <p className="mt-1">${person.amount.toFixed(2)}</p>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
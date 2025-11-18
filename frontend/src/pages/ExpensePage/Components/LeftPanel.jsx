import { Home, Calendar, DollarSign, Users, Map, Settings, Plane } from 'lucide-react';

export function LeftPanel({ activeItem = 'expenses' }) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'trips', icon: Map, label: 'My Trips' },
    { id: 'expenses', icon: DollarSign, label: 'Budget & Expenses' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'members', icon: Users, label: 'Members' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-screen flex flex-col p-6 bg-gradient-to-b from-[#5B51D8] to-[#4A3FB8]">
      {/* Logo */}
      <div className="mb-12 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <Plane className="w-6 h-6 text-[#5B51D8]" />
        </div>
        <h2 className="text-white">TRAVEL APP</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeItem;

          return (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
import { Button } from '../ui/button';

export function ViewToggle({ view, onViewChange }) {
  return (
    <div className="flex gap-2 mb-6">
      <Button
        onClick={() => onViewChange('month')}
        variant={view === 'month' ? 'default' : 'outline'}
        className={view === 'month' ? 'bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF]' : ''}
      >
        Month View
      </Button>
      <Button
        onClick={() => onViewChange('list')}
        variant={view === 'list' ? 'default' : 'outline'}
        className={view === 'list' ? 'bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF]' : ''}
      >
        List View
      </Button>
    </div>
  );
}
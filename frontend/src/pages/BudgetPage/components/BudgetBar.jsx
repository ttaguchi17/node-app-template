import { ProgressBar } from 'react-bootstrap';

export function BudgetBar({ budget, personSpending }) {
  // Calculate segments
  const segments = personSpending.map(p => ({
    label: p.name,
    value: p.amount,
    color: p.hexColor || '#0d6efd', // Fallback color
    percent: (p.amount / budget) * 100
  }));

  return (
    <div className="my-3">
      <ProgressBar className="height-25" style={{ height: '20px' }}>
        {segments.map((seg, idx) => (
            <ProgressBar 
                key={idx} 
                now={seg.percent} 
                label={seg.percent > 10 ? `$${seg.value.toFixed(0)}` : ''} 
                style={{ backgroundColor: seg.color }}
            />
        ))}
      </ProgressBar>
      <div className="d-flex flex-wrap gap-3 mt-2">
        {segments.map((seg, idx) => (
            <div key={idx} className="d-flex align-items-center small text-muted">
                <span 
                    className="d-inline-block rounded-circle me-1" 
                    style={{ width: 10, height: 10, backgroundColor: seg.color }}
                ></span>
                {seg.label}: ${seg.value.toFixed(2)}
            </div>
        ))}
      </div>
    </div>
  );
}
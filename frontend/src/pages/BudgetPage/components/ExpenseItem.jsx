import { Trash2 } from 'lucide-react';
import { Button, Badge } from 'react-bootstrap';

export function ExpenseItem({ expense, onDelete, currentUserId }) {
  // Check permission: only payer or organizer can delete
  const canDelete = currentUserId && (expense.paidBy === currentUserId);
  
  return (
    <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
      <div className="d-flex flex-column flex-grow-1">
        <div className="fw-bold">{expense.description}</div>
        <small className="text-muted">
          Paid by {expense.paidByName || 'User'} • {expense.date}
        </small>
        {/* Show splits if available */}
        {expense.splits && expense.splits.length > 0 && (
            <div className="mt-1">
                {expense.splits.map((s, idx) => (
                    <Badge key={idx} bg="light" text="dark" className="me-1 border">
                        {s.personName}: ${s.amount.toFixed(2)}
                    </Badge>
                ))}
            </div>
        )}
      </div>
      
      <div className="d-flex align-items-center gap-3">
        <span className="fw-bold fs-5">${expense.amount.toFixed(2)}</span>
        {canDelete && (
            <Button 
                variant="link" 
                className="text-danger p-1" 
                onClick={() => onDelete(expense.id)}
                title="Delete expense"
            >
                <Trash2 size={18} />
            </Button>
        )}
      </div>
    </div>
  );
}
import { Modal, Button, ProgressBar, Alert } from 'react-bootstrap';
import { Edit } from 'lucide-react';

export function PersonExpenseDialog({
  open,
  onOpenChange,
  person,
  expenses,
  totalSpent,
  onEditBudget,
}) {
  if (!person) return null;

  const budgetProgress = person.budget > 0 ? (totalSpent / person.budget) * 100 : 0;
  const isOverBudget = totalSpent > person.budget;
  const remaining = person.budget - totalSpent;

  return (
    <Modal show={open} onHide={() => onOpenChange(false)} size="lg" centered>
      <Modal.Header closeButton>
        <div className="d-flex align-items-center gap-2 w-100">
            <Modal.Title>{person.name}'s Expenses</Modal.Title>
            <Button variant="link" size="sm" onClick={onEditBudget}>
                <Edit size={16} />
            </Button>
        </div>
      </Modal.Header>
      
      <Modal.Body>
        <div className="mb-4">
            <div className="d-flex justify-content-between small mb-1">
                <span>Spent: ${totalSpent.toFixed(2)}</span>
                <span>Budget: ${person.budget.toFixed(2)}</span>
            </div>
            <ProgressBar 
                now={budgetProgress} 
                variant={isOverBudget ? "danger" : budgetProgress > 90 ? "warning" : "primary"} 
                style={{ height: '10px' }}
            />
            <div className={`small mt-1 ${isOverBudget ? 'text-danger' : 'text-success'}`}>
                {isOverBudget 
                    ? `Over budget by $${Math.abs(remaining).toFixed(2)}` 
                    : `$${remaining.toFixed(2)} remaining`}
            </div>
        </div>

        {expenses.length === 0 ? (
            <p className="text-center text-muted my-5">No expenses for this person.</p>
        ) : (
            <div className="list-group">
                {expenses.map((exp, idx) => (
                    <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-bold">{exp.description}</div>
                            <small className="text-muted">{exp.event}</small>
                        </div>
                        <div className="text-end">
                            <div className="fw-bold">${exp.yourShare.toFixed(2)}</div>
                            <small className="text-muted">{exp.date}</small>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
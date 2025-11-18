import { Trash2, Edit } from 'lucide-react';
import { Button } from './ui/button';
import PropTypes from 'prop-types'; // Import PropTypes

/**
 * A component to display a single expense item with details and action buttons.
 */
export function ExpenseItem({ expense, onDelete, onEdit }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#F9F9FB] border border-gray-100 rounded-lg hover:border-gray-200 transition-all">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-foreground">{expense.description}</p>
            <p className="text-muted-foreground text-sm">
              Paid by {expense.paidBy} • {expense.date}
            </p>
            {expense.splits && expense.splits.length > 0 && (
              <p className="text-muted-foreground text-sm mt-1">
                Split: {expense.splits.map(s => `${s.personName} ($${s.amount.toFixed(2)})`).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <p className="text-foreground">${expense.amount.toFixed(2)}</p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white"
            onClick={() => onEdit?.(expense.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#E53935] hover:text-[#E53935] hover:bg-red-50"
            onClick={() => onDelete?.(expense.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// PropTypes for type-checking in JSX
ExpenseItem.propTypes = {
    expense: PropTypes.shape({
        id: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        paidBy: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        category: PropTypes.string,
        splits: PropTypes.arrayOf(
            PropTypes.shape({
                personId: PropTypes.string.isRequired,
                personName: PropTypes.string.isRequired,
                amount: PropTypes.number.isRequired,
            })
        ),
    }).isRequired,
    onDelete: PropTypes.func,
    onEdit: PropTypes.func,
};
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Edit } from 'lucide-react';

export function PersonExpenseDialog({
  open,
  onOpenChange,
  person,
  expenses,
  totalSpent,
  onEditBudget,
  onIncreaseBudget,
}) {
  if (!person) return null;

  const budgetProgress = (totalSpent / person.budget) * 100;
  const isAtLimit = budgetProgress >= 100;
  const isNearLimit = budgetProgress >= 90 && budgetProgress < 100;
  const remaining = person.budget - totalSpent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className={`${person.color} text-white`}>
                {person.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p>{person.name}'s Expenses</p>
              <p className="text-muted-foreground text-sm">
                Budget: ${person.budget.toFixed(2)}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onEditBudget}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Budget Progress Bar */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Spent</span>
            <span className="text-sm">
              ${totalSpent.toFixed(2)} / ${person.budget.toFixed(2)}
            </span>
          </div>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute h-full transition-all rounded-full ${
                isAtLimit ? 'bg-[#E53935]' : isNearLimit ? 'bg-orange-500' : 'bg-[#5B7FFF]'
              }`}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {remaining >= 0 
              ? `$${remaining.toFixed(2)} remaining` 
              : `$${Math.abs(remaining).toFixed(2)} over budget`}
          </p>
        </div>

        {/* Budget Warnings */}
        {isAtLimit && (
          <Alert className="border-[#E53935] bg-red-50">
            <AlertTriangle className="h-4 w-4 text-[#E53935]" />
            <AlertDescription className="ml-2">
              <p className="text-[#E53935]">
                You've {totalSpent > person.budget ? 'exceeded' : 'reached'} your budget limit!
              </p>
              <Button
                variant="link"
                onClick={onIncreaseBudget}
                className="p-0 h-auto text-[#E53935] underline mt-1"
              >
                Increase your budget
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isNearLimit && !isAtLimit && (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="ml-2 text-orange-700">
              You're close to your budget limit ({budgetProgress.toFixed(0)}%)
            </AlertDescription>
          </Alert>
        )}

        {/* Expenses List */}
        <div className="space-y-2 mt-4">
          <h4 className="text-sm">Expense Breakdown</h4>
          {expenses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No expenses yet
            </p>
          ) : (
            expenses.map((expense, index) => (
              <div key={expense.id}>
                {index > 0 && <Separator className="my-2" />}
                <div className="p-3 bg-[#F9F9FB] rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-foreground">{expense.description}</p>
                      <p className="text-foreground">${expense.yourShare.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">{expense.event}</p>
                      <p className="text-muted-foreground text-sm">
                        {expense.date} • of ${expense.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
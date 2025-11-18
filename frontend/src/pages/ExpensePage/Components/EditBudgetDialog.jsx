import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';

export function EditBudgetDialog({ open, onOpenChange, person, onSave }) {
  const [budgetValue, setBudgetValue] = useState(person?.budget.toString() || '0');

  const handleSave = () => {
    if (person) {
      const newBudget = parseFloat(budgetValue);
      if (!isNaN(newBudget) && newBudget >= 0) {
        onSave(person.id, newBudget);
        onOpenChange(false);
      }
    }
  };

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className={`${person.color} text-white`}>
                {person.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p>Edit {person.name}'s Budget</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="budget">Personal Budget</Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#5B7FFF] hover:bg-[#4A6FEE] text-white"
          >
            Save Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
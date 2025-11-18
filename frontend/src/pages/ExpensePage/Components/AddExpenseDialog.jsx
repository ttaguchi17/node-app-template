import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { X } from 'lucide-react';

const CATEGORIES = [
  { id: 'accommodation', name: 'Accommodation', color: '#5B7FFF' },
  { id: 'transportation', name: 'Transportation', color: '#FF6B9D' },
  { id: 'food', name: 'Food', color: '#4CAF50' },
  { id: 'entertainment', name: 'Entertainment', color: '#FFA726' },
  { id: 'activities', name: 'Activities', color: '#AB47BC' },
  { id: 'shopping', name: 'Shopping', color: '#26C6DA' },
  { id: 'other', name: 'Other', color: '#78909C' },
];

export function AddExpenseDialog({
  open,
  onOpenChange,
  onAddExpense,
  people,
  events,
  currentUserId,
  editingExpense,
  onUpdateExpense
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState('');
  const [event, setEvent] = useState('other');
  const [category, setCategory] = useState('other');
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [splits, setSplits] = useState({});
  const [splitEvenly, setSplitEvenly] = useState(true);
  const [manuallyEditedSplits, setManuallyEditedSplits] = useState(new Set());

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setPaidBy(currentUserId || '');
    setDate(new Date().toISOString().split('T')[0]);
    setEvent('other');
    setCategory('other');
    setSelectedPeople(currentUserId ? [currentUserId] : []);
    setSplits({});
    setSplitEvenly(true);
    setManuallyEditedSplits(new Set());
  };

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        setDescription(editingExpense.description);
        setAmount(editingExpense.amount.toString());
        setPaidBy(editingExpense.paidById);
        setDate(editingExpense.date);
        setEvent(editingExpense.event);
        setCategory(editingExpense.category || 'other');
        setSelectedPeople(editingExpense.splits.map(s => s.personId));

        const initialSplits = {};
        editingExpense.splits.forEach(split => {
          initialSplits[split.personId] = split.amount.toString();
        });

        setSplits(initialSplits);
        setSplitEvenly(false);
        setManuallyEditedSplits(new Set(editingExpense.splits.map(s => s.personId)));
      } else {
        resetForm();
      }
    }
  }, [open, currentUserId, editingExpense]);

  useEffect(() => {
    if (splitEvenly && amount && selectedPeople.length > 0) {
      const totalAmount = parseFloat(amount);
      if (!isNaN(totalAmount)) {
        const perPerson = (totalAmount / selectedPeople.length).toFixed(2);
        const newSplits = {};
        selectedPeople.forEach(id => {
          newSplits[id] = perPerson;
        });
        setSplits(newSplits);
      }
    }
  }, [amount, selectedPeople, splitEvenly]);

  const handleAddPerson = (personId) => {
    if (!selectedPeople.includes(personId)) {
      const newSelected = [...selectedPeople, personId];
      setSelectedPeople(newSelected);

      if (splitEvenly && amount) {
        const totalAmount = parseFloat(amount);
        if (!isNaN(totalAmount)) {
          const perPerson = (totalAmount / newSelected.length).toFixed(2);
          const newSplits = {};
          newSelected.forEach(pid => {
            newSplits[pid] = perPerson;
          });
          setSplits(newSplits);
        }
      } else {
        setSplits({ ...splits, [personId]: '0.00' });
      }
    }
  };

  const handleRemovePerson = (personId) => {
    const updated = selectedPeople.filter(id => id !== personId);
    setSelectedPeople(updated);

    const newSplits = { ...splits };
    delete newSplits[personId];
    setSplits(newSplits);

    if (splitEvenly && amount && updated.length > 0) {
      const totalAmount = parseFloat(amount);
      const perPerson = (totalAmount / updated.length).toFixed(2);
      const recalculated = {};
      updated.forEach(pid => {
        recalculated[pid] = perPerson;
      });
      setSplits(recalculated);
    }
  };

  const handleSplitAmountChange = (personId, value) => {
    const newSplits = { ...splits, [personId]: value };
    setSplits(newSplits);

    const newManual = new Set(manuallyEditedSplits);
    newManual.add(personId);
    setManuallyEditedSplits(newManual);

    if (!splitEvenly && amount && selectedPeople.length > 1) {
      const totalAmount = parseFloat(amount);

      let manualTotal = 0;
      const autoPeople = [];

      selectedPeople.forEach(pid => {
        if (newManual.has(pid)) {
          manualTotal += parseFloat(newSplits[pid]) || 0;
        } else {
          autoPeople.push(pid);
        }
      });

      if (autoPeople.length > 0) {
        const remaining = totalAmount - manualTotal;
        const perPerson = (remaining / autoPeople.length).toFixed(2);
        autoPeople.forEach(pid => {
          newSplits[pid] = perPerson;
        });
        setSplits({ ...newSplits });
      }
    }
  };

  const getTotalSplit = () => {
    return Object.values(splits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description || !amount || !paidBy || !date || selectedPeople.length === 0) return;

    const totalAmount = parseFloat(amount);
    const totalSplit = getTotalSplit();

    if (Math.abs(totalAmount - totalSplit) > 0.01) {
      alert('Split amounts must equal total expense.');
      return;
    }

    const expenseSplits = selectedPeople.map(id => ({
      personId: id,
      amount: parseFloat(splits[id] || '0')
    }));

    if (editingExpense && onUpdateExpense) {
      onUpdateExpense(editingExpense.id, {
        description,
        amount: totalAmount,
        paidBy,
        event,
        category,
        date,
        splits: expenseSplits,
      });
    } else {
      onAddExpense({
        description,
        amount: totalAmount,
        paidBy,
        event,
        category,
        date,
        splits: expenseSplits,
      });
    }

    resetForm();
    onOpenChange(false);
  };

  const availablePeople = people.filter(p => !selectedPeople.includes(p.id));
  const totalSplit = getTotalSplit();
  const totalAmount = parseFloat(amount) || 0;
  const splitDifference = totalAmount - totalSplit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Paid By */}
          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid By</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger id="paidBy">
                <SelectValue placeholder="Choose person" />
              </SelectTrigger>
              <SelectContent>
                {people.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event */}
          <div className="space-y-2">
            <Label>Event</Label>
            <Select value={event} onValueChange={setEvent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="other">Other</SelectItem>
                {events.map(evt => (
                  <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split With */}
          <div className="space-y-2">
            <Label>Share Expense With</Label>

            <Select onValueChange={handleAddPerson} value="">
              <SelectTrigger>
                <SelectValue placeholder="Add person..." />
              </SelectTrigger>
              <SelectContent>
                {availablePeople.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPeople.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">Split Details</p>
                  {amount && (
                    <p className={Math.abs(splitDifference) > 0.01 ? 'text-destructive' : 'text-muted-foreground'}>
                      Total: ${totalSplit.toFixed(2)} / ${totalAmount.toFixed(2)}
                    </p>
                  )}
                </div>

                {selectedPeople.map(personId => {
                  const person = people.find(p => p.id === personId);
                  if (!person) return null;

                  const isAuto = !splitEvenly && !manuallyEditedSplits.has(personId);

                  return (
                    <div key={personId} className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{person.name}</p>
                      </div>
                      <div className="w-32 relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={splits[personId] || ''}
                          onChange={(e) => handleSplitAmountChange(personId, e.target.value)}
                          disabled={splitEvenly}
                          className={`text-right ${isAuto ? 'bg-blue-50 border-blue-200' : ''}`}
                        />
                        {isAuto && (
                          <span className="absolute -top-1 -right-1 text-xs text-blue-600 bg-blue-100 px-1 rounded">
                            auto
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePerson(personId)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Checkbox
                    id="splitEvenly"
                    checked={splitEvenly}
                    onCheckedChange={(checked) => {
                      setSplitEvenly(checked);
                      setManuallyEditedSplits(new Set());
                    }}
                  />
                  <Label htmlFor="splitEvenly">Split evenly</Label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={selectedPeople.length === 0 || Math.abs(splitDifference) > 0.01}
              className="bg-[#5B7FFF] hover:bg-[#4A6FEE] text-white"
            >
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useMemo } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { ExpenseItem } from './components/ExpenseItem';
import { AddExpenseDialog } from './components/AddExpenseDialog';
import { BudgetBar } from './components/BudgetBar';
import { PersonExpenseDialog } from './components/PersonExpenseDialog';
import { EditBudgetDialog } from './components/EditBudgetDialog';
import { DebtSettlement } from './components/DebtSettlement';
import { CategoryChart } from './components/CategoryChart';
import { PageHeader } from './components/PageHeader';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { Plus } from 'lucide-react';

export default function App() {
  const currentUserId = 'sarah';
  const [selectedTripId, setSelectedTripId] = useState('trip-1');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [editBudgetPersonId, setEditBudgetPersonId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [settlementHistory, setSettlementHistory] = useState([]);

  const [trips, setTrips] = useState([
    {
      id: 'trip-1',
      name: 'Iceland Adventure 2025',
      people: [
        { id: 'sarah', name: 'Sarah', initials: 'SM', color: 'bg-blue-500', hexColor: '#3b82f6', budget: 800 },
        { id: 'mike', name: 'Mike', initials: 'MJ', color: 'bg-green-500', hexColor: '#22c55e', budget: 750 },
        { id: 'jessica', name: 'Jessica', initials: 'JL', color: 'bg-purple-500', hexColor: '#a855f7', budget: 700 },
        { id: 'alex', name: 'Alex', initials: 'AK', color: 'bg-orange-500', hexColor: '#f97316', budget: 750 },
      ],
      events: [
        { id: 'event-1', name: 'Reykjavik Stay' },
        { id: 'event-2', name: 'Golden Circle Tour' },
        { id: 'event-3', name: 'Blue Lagoon Visit' },
      ],
    },
    {
      id: 'trip-2',
      name: 'Tokyo Spring Trip',
      people: [
        { id: 'sarah', name: 'Sarah', initials: 'SM', color: 'bg-blue-500', hexColor: '#3b82f6', budget: 2250 },
        { id: 'mike', name: 'Mike', initials: 'MJ', color: 'bg-green-500', hexColor: '#22c55e', budget: 2250 },
      ],
      events: [
        { id: 'event-4', name: 'Tokyo Accommodation' },
        { id: 'event-5', name: 'Day Trip to Kyoto' },
      ],
    },
  ]);

  const [expenses, setExpenses] = useState([
    {
      id: '1',
      description: 'Hotel Booking',
      amount: 450.0,
      paidBy: 'Sarah',
      paidById: 'sarah',
      date: '2025-11-01',
      event: 'event-1',
      category: 'Accommodation',
      splits: [
        { personId: 'sarah', amount: 112.5 },
        { personId: 'mike', amount: 112.5 },
        { personId: 'jessica', amount: 112.5 },
        { personId: 'alex', amount: 112.5 },
      ],
    },
    {
      id: '2',
      description: 'Group Dinner',
      amount: 120.5,
      paidBy: 'Mike',
      paidById: 'mike',
      date: '2025-11-02',
      event: 'event-1',
      category: 'Food',
      splits: [
        { personId: 'sarah', amount: 30.13 },
        { personId: 'mike', amount: 30.13 },
        { personId: 'jessica', amount: 30.12 },
        { personId: 'alex', amount: 30.12 },
      ],
    },
    {
      id: '3',
      description: 'Gas for Road Trip',
      amount: 85.0,
      paidBy: 'Jessica',
      paidById: 'jessica',
      date: '2025-11-03',
      event: 'event-2',
      category: 'Transportation',
      splits: [
        { personId: 'sarah', amount: 21.25 },
        { personId: 'mike', amount: 21.25 },
        { personId: 'jessica', amount: 21.25 },
        { personId: 'alex', amount: 21.25 },
      ],
    },
    {
      id: '4',
      description: 'Groceries',
      amount: 65.75,
      paidBy: 'Alex',
      paidById: 'alex',
      date: '2025-11-03',
      event: 'other',
      category: 'Food',
      splits: [
        { personId: 'sarah', amount: 16.44 },
        { personId: 'mike', amount: 16.44 },
        { personId: 'jessica', amount: 16.44 },
        { personId: 'alex', amount: 16.43 },
      ],
    },
  ]);

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) || trips[0];

  const tripBudget = useMemo(() => {
    return selectedTrip.people.reduce((sum, person) => sum + person.budget, 0);
  }, [selectedTrip.people]);

  const personSpending = useMemo(() => {
    return selectedTrip.people.map((person) => {
      const totalSpent = expenses.reduce((sum, expense) => {
        const split = expense.splits.find((s) => s.personId === person.id);
        return sum + (split?.amount || 0);
      }, 0);

      return {
        id: person.id,
        name: person.name,
        amount: totalSpent,
        color: person.hexColor,
      };
    });
  }, [selectedTrip.people, expenses]);

  const settlements = useMemo(() => {
    const balances = {};

    selectedTrip.people.forEach((person) => {
      balances[person.id] = 0;
    });

    expenses.forEach((expense) => {
      if (balances[expense.paidById] !== undefined) {
        balances[expense.paidById] += expense.amount;
      }
    });

    expenses.forEach((expense) => {
      expense.splits.forEach((split) => {
        if (balances[split.personId] !== undefined) {
          balances[split.personId] -= split.amount;
        }
      });
    });

    settlementHistory
      .filter((s) => s.tripId === selectedTripId && s.status === 'completed')
      .forEach((settlement) => {
        if (balances[settlement.from] !== undefined) {
          balances[settlement.from] += settlement.amount;
        }
        if (balances[settlement.to] !== undefined) {
          balances[settlement.to] -= settlement.amount;
        }
      });

    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([personId, balance]) => {
      if (balance > 0.01) creditors.push({ id: personId, amount: balance });
      else if (balance < -0.01) debtors.push({ id: personId, amount: -balance });
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let i = 0,
      j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      const debtorPerson = selectedTrip.people.find((p) => p.id === debtor.id);
      const creditorPerson = selectedTrip.people.find((p) => p.id === creditor.id);

      transactions.push({
        from: debtor.id,
        fromName: debtorPerson.name,
        fromColor: debtorPerson.color,
        fromInitials: debtorPerson.initials,
        to: creditor.id,
        toName: creditorPerson.name,
        toColor: creditorPerson.color,
        toInitials: creditorPerson.initials,
        amount,
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return transactions.filter((t) => t.amount > 0.01);
  }, [selectedTrip.people, expenses, settlementHistory, selectedTripId]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const budgetProgress = (totalSpent / tripBudget) * 100;

  const handleAddExpense = (newExpense) => {
    const paidByPerson = selectedTrip.people.find((p) => p.id === newExpense.paidBy);

    const expense = {
      id: `expense-${Date.now()}`,
      description: newExpense.description,
      amount: newExpense.amount,
      paidBy: paidByPerson?.name || newExpense.paidBy,
      paidById: newExpense.paidBy,
      date: newExpense.date,
      event: newExpense.event,
      category: newExpense.category,
      splits: newExpense.splits,
    };

    setExpenses([...expenses, expense]);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
  };

  const handleEditExpense = (id) => {
    setEditingExpenseId(id);
    setIsAddExpenseOpen(true);
  };

  const handleUpdateExpense = (id, updatedExpense) => {
    const paidByPerson = selectedTrip.people.find((p) => p.id === updatedExpense.paidBy);

    setExpenses(
      expenses.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              description: updatedExpense.description,
              amount: updatedExpense.amount,
              paidBy: paidByPerson?.name || updatedExpense.paidBy,
              paidById: updatedExpense.paidBy,
              date: updatedExpense.date,
              event: updatedExpense.event,
              category: updatedExpense.category,
              splits: updatedExpense.splits,
            }
          : exp
      )
    );
    setEditingExpenseId(null);
  };

  const handleRecordSettlement = (settlement) => {
    const newSettlement = {
      id: `settlement-${Date.now()}`,
      from: settlement.from,
      fromName: settlement.fromName,
      to: settlement.to,
      toName: settlement.toName,
      amount: settlement.amount,
      date: new Date().toISOString(),
      tripId: selectedTripId,
      status: 'pending',
    };
    setSettlementHistory([...settlementHistory, newSettlement]);
    toast.success(`Settlement recorded! Waiting for ${settlement.toName} to confirm.`);
  };

  const handleConfirmSettlement = (settlementId) => {
    setSettlementHistory(
      settlementHistory.map((s) =>
        s.id === settlementId ? { ...s, status: 'completed' } : s
      )
    );
    const settlement = settlementHistory.find((s) => s.id === settlementId);
    if (settlement) {
      toast.success(
        `Settlement confirmed! ${settlement.fromName} has settled $${settlement.amount.toFixed(
          2
        )} with you.`
      );
    }
  };

  const handleDeclineSettlement = (settlementId) => {
    setSettlementHistory(settlementHistory.filter((s) => s.id !== settlementId));
    const settlement = settlementHistory.find((s) => s.id === settlementId);
    if (settlement) {
      toast.error(
        `Settlement declined. ${settlement.fromName} has been notified.`
      );
    }
  };

  const handleSaveBudget = (personId, newBudget) => {
    setTrips(
      trips.map((trip) => {
        if (trip.id === selectedTripId) {
          return {
            ...trip,
            people: trip.people.map((person) =>
              person.id === personId ? { ...person, budget: newBudget } : person
            ),
          };
        }
        return trip;
      })
    );
  };

  const handleIncreaseBudget = () => {
    if (selectedPersonId) {
      const person = selectedTrip.people.find((p) => p.id === selectedPersonId);
      if (person) {
        const spending =
          personSpending.find((p) => p.id === selectedPersonId)?.amount || 0;
        const suggestedBudget = Math.ceil(spending / 100) * 100;
        handleSaveBudget(selectedPersonId, suggestedBudget);
      }
    }
  };

  const groupedExpenses = expenses.reduce((acc, expense) => {
    const key = expense.event;
    if (!acc[key]) acc[key] = [];
    acc[key].push(expense);
    return acc;
  }, {});

  const sortedEventIds = Object.keys(groupedExpenses).sort((a, b) => {
    if (a === 'other') return 1;
    if (b === 'other') return -1;
    return 0;
  });

  const getEventName = (eventId) => {
    if (eventId === 'other') return 'Other';
    const event = selectedTrip.events.find((e) => e.id === eventId);
    return event?.name || 'Other';
  };

  const getEventTotal = (eventId) => {
    const eventExpenses = groupedExpenses[eventId] || [];
    return eventExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const selectedPerson = selectedTrip.people.find(
    (p) => p.id === selectedPersonId
  );

  const personExpenses = selectedPersonId
    ? expenses
        .filter((exp) =>
          exp.splits.some((s) => s.personId === selectedPersonId)
        )
        .map((exp) => {
          const split = exp.splits.find((s) => s.personId === selectedPersonId);
          return {
            id: exp.id,
            description: exp.description,
            totalAmount: exp.amount,
            yourShare: split?.amount || 0,
            date: new Date(exp.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            event: getEventName(exp.event),
          };
        })
    : [];

  const selectedPersonTotalSpent =
    personSpending.find((p) => p.id === selectedPersonId)?.amount || 0;

  const editBudgetPerson = selectedTrip.people.find(
    (p) => p.id === editBudgetPersonId
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const categoryData = useMemo(() => {
    const categories = [
      { id: 'accommodation', name: 'Accommodation', color: '#5B7FFF' },
      { id: 'transportation', name: 'Transportation', color: '#FF6B9D' },
      { id: 'food', name: 'Food', color: '#4CAF50' },
      { id: 'entertainment', name: 'Entertainment', color: '#FFA726' },
      { id: 'activities', name: 'Activities', color: '#AB47BC' },
      { id: 'shopping', name: 'Shopping', color: '#26C6DA' },
      { id: 'other', name: 'Other', color: '#78909C' },
    ];

    const categoryTotals = categories.map((cat) => {
      const total = expenses
        .filter(
          (exp) => exp.category?.toLowerCase() === cat.id.toLowerCase()
        )
        .reduce((sum, exp) => sum + exp.amount, 0);
      return {
        name: cat.name,
        value: total,
        color: cat.color,
        percentage: 0,
      };
    });

    const totalExpenses = categoryTotals.reduce(
      (sum, cat) => sum + cat.value,
      0
    );

    return categoryTotals.map((cat) => ({
      ...cat,
      percentage: totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0,
    }));
  }, [expenses]);

  return (
    <div className="size-full flex bg-[#F5F5F7]">
      <LeftPanel activeItem="expenses" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <PageHeader />

          <div className="mb-6">
            <label className="block text-muted-foreground mb-2">
              Select Trip
            </label>
            <Select value={selectedTripId} onValueChange={setSelectedTripId}>
              <SelectTrigger className="w-full max-w-md bg-white shadow-sm border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-muted-foreground">Total Trip Budget</h3>
                <p className="text-foreground mt-1">
                  ${tripBudget.toFixed(2)}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Sum of individual budgets
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-muted-foreground">Total Spent</h3>
                <p
                  className={`mt-1 ${
                    budgetProgress > 100 ? 'text-[#E53935]' : 'text-foreground'
                  }`}
                >
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
            </div>

            <BudgetBar budget={tripBudget} personSpending={personSpending} />

            <p className="text-muted-foreground text-sm mt-4">
              ${(tripBudget - totalSpent).toFixed(2)} remaining
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="mb-4">People on this Trip</h3>
              <div className="flex gap-4 flex-wrap">
                {selectedTrip.people.map((person) => {
                  const spending = personSpending.find(
                    (p) => p.id === person.id
                  );
                  const budgetPercent =
                    (spending?.amount || 0) / person.budget * 100;
                  const isOverBudget = budgetPercent > 100;

                  return (
                    <button
                      key={person.id}
                      onClick={() => setSelectedPersonId(person.id)}
                      className="flex items-center gap-3 hover:bg-[#F5F5F7] p-3 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                    >
                      <Avatar>
                        <AvatarFallback
                          className={`${person.color} text-white`}
                        >
                          {person.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <span className="text-foreground">{person.name}</span>
                        <p
                          className={`text-sm ${
                            isOverBudget
                              ? 'text-[#E53935]'
                              : 'text-muted-foreground'
                          }`}
                        >
                          ${spending?.amount.toFixed(2) || '0.00'} / $
                          {person.budget.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-1">
              <CategoryChart data={categoryData} />
            </div>
          </div>

          <div className="mb-6">
            <DebtSettlement
              settlements={settlements}
              onRecordSettlement={handleRecordSettlement}
              pendingSettlements={settlementHistory.filter(
                (s) => s.tripId === selectedTripId && s.status === 'pending'
              )}
              completedSettlements={settlementHistory.filter(
                (s) => s.tripId === selectedTripId && s.status === 'completed'
              )}
              onConfirmSettlement={handleConfirmSettlement}
              onDeclineSettlement={handleDeclineSettlement}
              currentUserId={currentUserId}
              people={selectedTrip.people}
            />
          </div>

          <div className="mb-6">
            <Button
              onClick={() => setIsAddExpenseOpen(true)}
              className="gap-2 bg-[#5B7FFF] hover:bg-[#4A6FEE] text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>

          <div className="space-y-4">
            {Object.keys(groupedExpenses).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-muted-foreground">
                  No expenses yet. Add your first expense to get started!
                </p>
              </div>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={sortedEventIds}
                className="space-y-4"
              >
                {sortedEventIds.map((eventId) => {
                  const eventExpenses = groupedExpenses[eventId];
                  const eventTotal = getEventTotal(eventId);
                  const eventName = getEventName(eventId);

                  return (
                    <AccordionItem
                      key={eventId}
                      value={eventId}
                      className="bg-white rounded-xl shadow-sm border border-gray-200"
                    >
                      <AccordionTrigger className="px-6 hover:no-underline hover:bg-[#F5F5F7] rounded-t-xl transition-colors">
                        <div className="flex items-center justify-between w-full pr-4">
                          <h4 className="text-foreground">{eventName}</h4>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground text-sm">
                              {eventExpenses.length} expense
                              {eventExpenses.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-foreground">
                              ${eventTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="space-y-2 pt-2">
                          {eventExpenses.map((expense) => {
                            const splitsWithNames = expense.splits.map(
                              (split) => ({
                                ...split,
                                personName:
                                  selectedTrip.people.find(
                                    (p) => p.id === split.personId
                                  )?.name || split.personId,
                              })
                            );

                            return (
                              <ExpenseItem
                                key={expense.id}
                                expense={{
                                  ...expense,
                                  splits: splitsWithNames,
                                  date: formatDate(expense.date),
                                }}
                                onDelete={handleDeleteExpense}
                                onEdit={handleEditExpense}
                              />
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </div>

      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={(open) => {
          setIsAddExpenseOpen(open);
          if (!open) setEditingExpenseId(null);
        }}
        onAddExpense={handleAddExpense}
        people={selectedTrip.people}
        events={selectedTrip.events}
        currentUserId={currentUserId}
        editingExpense={
          editingExpenseId
            ? expenses.find((e) => e.id === editingExpenseId) || null
            : null
        }
        onUpdateExpense={handleUpdateExpense}
      />

      <PersonExpenseDialog
        open={selectedPersonId !== null}
        onOpenChange={(open) => !open && setSelectedPersonId(null)}
        person={selectedPerson || null}
        expenses={personExpenses}
        totalSpent={selectedPersonTotalSpent}
        onEditBudget={() => {
          setEditBudgetPersonId(selectedPersonId);
        }}
        onIncreaseBudget={handleIncreaseBudget}
      />

      <EditBudgetDialog
        open={editBudgetPersonId !== null}
        onOpenChange={(open) => !open && setEditBudgetPersonId(null)}
        person={editBudgetPerson || null}
        onSave={handleSaveBudget}
      />

      <Toaster />
    </div>
  );
}
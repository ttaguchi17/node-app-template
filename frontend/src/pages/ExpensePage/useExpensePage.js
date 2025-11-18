import { useState, useMemo } from 'react';
import { toast } from "sonner";

/**
 * Extracted logic from App.tsx turned into a reusable JavaScript hook
 */
export function useTripBudgetManager() {
  const currentUserId = "sarah";

  // Trip Navigation
  const [selectedTripId, setSelectedTripId] = useState("trip-1");

  // Dialog states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [editBudgetPersonId, setEditBudgetPersonId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Settlement history
  const [settlementHistory, setSettlementHistory] = useState([]);

  // Trips & People
  const [trips, setTrips] = useState([
    {
      id: "trip-1",
      name: "Iceland Adventure 2025",
      people: [
        { id: "sarah", name: "Sarah", initials: "SM", color: "bg-blue-500", hexColor: "#3b82f6", budget: 800 },
        { id: "mike", name: "Mike", initials: "MJ", color: "bg-green-500", hexColor: "#22c55e", budget: 750 },
        { id: "jessica", name: "Jessica", initials: "JL", color: "bg-purple-500", hexColor: "#a855f7", budget: 700 },
        { id: "alex", name: "Alex", initials: "AK", color: "bg-orange-500", hexColor: "#f97316", budget: 750 },
      ],
      events: [
        { id: "event-1", name: "Reykjavik Stay" },
        { id: "event-2", name: "Golden Circle Tour" },
        { id: "event-3", name: "Blue Lagoon Visit" },
      ]
    }
  ]);

  // Expenses
  const [expenses, setExpenses] = useState([]);

  // Current trip selected
  const selectedTrip =
    trips.find((t) => t.id === selectedTripId) || trips[0];

  /** ---------------------------------------
   *  BUDGET LOGIC
   * --------------------------------------- */

  const tripBudget = useMemo(() => {
    return selectedTrip.people.reduce((sum, p) => sum + p.budget, 0);
  }, [selectedTrip.people]);

  const personSpending = useMemo(() => {
    return selectedTrip.people.map((person) => {
      const total = expenses
        .filter((exp) =>
          exp.splits.some((s) => s.personId === person.id)
        )
        .reduce((sum, exp) => {
          const split = exp.splits.find((s) => s.personId === person.id);
          return sum + (split?.amount || 0);
        }, 0);

      return {
        id: person.id,
        name: person.name,
        amount: total,
        color: person.hexColor
      };
    });
  }, [selectedTrip.people, expenses]);

  /** ---------------------------------------
   *  ADDING / EDITING EXPENSES
   * --------------------------------------- */

  const addExpense = (newExpense) => {
    const paidByPerson = selectedTrip.people.find(
      (p) => p.id === newExpense.paidBy
    );

    const newEntry = {
      id: `expense-${Date.now()}`,
      description: newExpense.description,
      amount: newExpense.amount,
      paidBy: paidByPerson?.name || newExpense.paidBy,
      paidById: newExpense.paidBy,
      date: newExpense.date,
      event: newExpense.event,
      category: newExpense.category,
      splits: newExpense.splits
    };

    setExpenses((prev) => [...prev, newEntry]);
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const updateExpense = (id, updated) => {
    const paidByPerson = selectedTrip.people.find(
      (p) => p.id === updated.paidBy
    );

    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              description: updated.description,
              amount: updated.amount,
              paidBy: paidByPerson?.name || updated.paidBy,
              paidById: updated.paidBy,
              date: updated.date,
              event: updated.event,
              category: updated.category,
              splits: updated.splits
            }
          : exp
      )
    );

    setEditingExpenseId(null);
  };

  /** ---------------------------------------
   *  SETTLEMENT LOGIC
   * --------------------------------------- */

  const recordSettlement = (settlement) => {
    const entry = {
      id: `settlement-${Date.now()}`,
      ...settlement,
      date: new Date().toISOString(),
      tripId: selectedTripId,
      status: "pending"
    };

    setSettlementHistory((prev) => [...prev, entry]);
    toast.success(
      `Settlement recorded! Waiting for ${settlement.toName} to confirm.`
    );
  };

  const confirmSettlement = (id) => {
    setSettlementHistory((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "completed" } : s))
    );

    const s = settlementHistory.find((s) => s.id === id);
    if (s) {
      toast.success(
        `${s.fromName} settled $${s.amount.toFixed(2)} with you.`
      );
    }
  };

  const declineSettlement = (id) => {
    const s = settlementHistory.find((s) => s.id === id);

    setSettlementHistory((prev) => prev.filter((x) => x.id !== id));
    if (s) {
      toast.error(`Settlement declined. ${s.fromName} has been notified.`);
    }
  };

  /** ---------------------------------------
   *  BUDGET EDITING
   * --------------------------------------- */

  const saveBudget = (personId, newBudget) => {
    setTrips((prevTrips) =>
      prevTrips.map((trip) =>
        trip.id === selectedTripId
          ? {
              ...trip,
              people: trip.people.map((p) =>
                p.id === personId ? { ...p, budget: newBudget } : p
              )
            }
          : trip
      )
    );
  };

  const increaseBudget = () => {
    if (!selectedPersonId) return;

    const person = selectedTrip.people.find((p) => p.id === selectedPersonId);
    if (!person) return;

    const spending =
      personSpending.find((p) => p.id === selectedPersonId)?.amount || 0;

    const suggested = Math.ceil(spending / 100) * 100;
    saveBudget(selectedPersonId, suggested);
  };

  /** ---------------------------------------
   *  EXPOSED API
   * --------------------------------------- */

  return {
    // State
    trips,
    expenses,
    selectedTrip,
    personSpending,
    settlementHistory,

    // UI state
    selectedTripId,
    selectedPersonId,
    isAddExpenseOpen,
    editBudgetPersonId,
    editingExpenseId,

    // Setters
    setSelectedTripId,
    setSelectedPersonId,
    setIsAddExpenseOpen,
    setEditBudgetPersonId,
    setEditingExpenseId,

    // Actions
    addExpense,
    deleteExpense,
    updateExpense,
    saveBudget,
    increaseBudget,
    recordSettlement,
    confirmSettlement,
    declineSettlement
  };
}
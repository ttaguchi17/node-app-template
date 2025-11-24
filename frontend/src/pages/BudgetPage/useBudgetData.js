import { useState, useEffect, useMemo } from 'react';
import { apiGet, apiPost, apiDelete } from '../../utils/api';
import { toast } from 'sonner';

export function useBudgetData(tripId) {
  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [tripPeople, setTripPeople] = useState([]);
  const [tripEvents, setTripEvents] = useState([]);
  const [tripName, setTripName] = useState('');
  const [pendingCosts, setPendingCosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settlementHistory, setSettlementHistory] = useState([]);

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));

        const [trip, members, eventsResponse, expenseData] = await Promise.all([
          apiGet(`/api/trips/${tripId}`),
          apiGet(`/api/trips/${tripId}/members`),
          apiGet(`/api/trips/${tripId}/events`),
          apiGet(`/api/trips/${tripId}/budget`)
        ]);

        setTripName(trip.name || 'Trip Budget');

        const colors = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0', '#6610f2', '#d63384'];
        const people = members.map((m, idx) => ({
          id: m.user_id,
          name: m.name || m.email,
          initials: (m.name || m.email).substring(0, 2).toUpperCase(),
          color: 'bg-primary',
          hexColor: colors[idx % colors.length],
          budget: parseFloat(m.budget_goal || 1000)
        }));

        setTripPeople(people);
        
        // Extract events array from response object
        const eventsArray = eventsResponse?.events || eventsResponse || [];
        setTripEvents(Array.isArray(eventsArray) ? eventsArray : []);
       
        // Map expenses to include Names
        const enrichedExpenses = (expenseData.expenses || []).map(exp => ({
          ...exp,
          paidByName: people.find(p => p.id === exp.paidBy)?.name || 'Unknown',
          splits: exp.splits.map(s => ({
            ...s,
            personName: people.find(p => p.id === s.personId)?.name || 'Unknown'
          }))
        }));
       
        setExpenses(enrichedExpenses);
        setSettlementHistory(expenseData.settlements || []);

        // Calculate pending costs from events without linked expenses
        const linkedEventIds = new Set(enrichedExpenses.map(e => e.event_id).filter(Boolean));
        const pending = eventsArray
          .filter(event => !linkedEventIds.has(event.event_id) && event.cost > 0)
          .reduce((sum, event) => sum + parseFloat(event.cost || 0), 0);
        setPendingCosts(pending);

      } catch (err) {
        console.error("Failed to load budget:", err);
        toast.error("Could not load budget details.");
      } finally {
        setLoading(false);
      }
    };

    if (tripId) loadData();
  }, [tripId]);

  // Calculations
  const tripBudget = useMemo(() => {
    return tripPeople.reduce((sum, person) => sum + person.budget, 0);
  }, [tripPeople]);

  const personSpending = useMemo(() => {
    return tripPeople.map((person) => {
      const totalSpent = expenses.reduce((sum, expense) => {
        if (!expense.splits) return sum;
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
  }, [tripPeople, expenses]);

  const settlements = useMemo(() => {
    const balances = {};
    tripPeople.forEach((person) => { balances[person.id] = 0; });

    expenses.forEach((expense) => {
      if (balances[expense.paidBy] !== undefined) {
        balances[expense.paidBy] += expense.amount;
      }
      if (expense.splits) {
        expense.splits.forEach((split) => {
          if (balances[split.personId] !== undefined) balances[split.personId] -= split.amount;
        });
      }
    });

    settlementHistory.filter((s) => s.status === 'completed').forEach((settlement) => {
      if (balances[settlement.from] !== undefined) balances[settlement.from] += settlement.amount;
      if (balances[settlement.to] !== undefined) balances[settlement.to] -= settlement.amount;
    });

    const creditors = [];
    const debtors = [];
    Object.entries(balances).forEach(([personId, balance]) => {
      if (balance > 0.01) creditors.push({ id: parseInt(personId), amount: balance });
      else if (balance < -0.01) debtors.push({ id: parseInt(personId), amount: -balance });
    });

    const transactions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);
      const debtorPerson = tripPeople.find((p) => p.id === debtor.id);
      const creditorPerson = tripPeople.find((p) => p.id === creditor.id);

      if (debtorPerson && creditorPerson) {
        transactions.push({
          from: debtor.id,
          fromName: debtorPerson.name,
          to: creditor.id,
          toName: creditorPerson.name,
          amount,
        });
      }
      debtor.amount -= amount;
      creditor.amount -= amount;
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }
    return transactions;
  }, [tripPeople, expenses, settlementHistory]);

  const totalSpent = useMemo(() => 
    expenses.reduce((sum, expense) => sum + expense.amount, 0), 
    [expenses]
  );

  const budgetProgress = useMemo(() => 
    tripBudget > 0 ? (totalSpent / tripBudget) * 100 : 0,
    [tripBudget, totalSpent]
  );

  const categoryData = useMemo(() => {
    return [
      { id: 'accommodation', name: 'Accommodation', color: '#5B7FFF' },
      { id: 'transportation', name: 'Transportation', color: '#FF6B9D' },
      { id: 'food', name: 'Food', color: '#4CAF50' },
      { id: 'entertainment', name: 'Entertainment', color: '#FFA726' },
      { id: 'activities', name: 'Activities', color: '#AB47BC' },
      { id: 'shopping', name: 'Shopping', color: '#26C6DA' },
      { id: 'other', name: 'Other', color: '#78909C' },
    ].map(cat => ({
      ...cat,
      value: expenses.filter(e => (e.category || 'other').toLowerCase() === cat.id)
                     .reduce((sum, e) => sum + e.amount, 0)
    }));
  }, [expenses]);

  const groupedExpenses = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const key = expense.event_id || 'other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(expense);
      return acc;
    }, {});
  }, [expenses]);

  const sortedEventIds = useMemo(() => 
    Object.keys(groupedExpenses).sort(),
    [groupedExpenses]
  );

  // Actions
  const addExpense = async (newExpense) => {
    try {
      const savedExpense = await apiPost(`/api/trips/${tripId}/budget`, newExpense);
      savedExpense.paidByName = tripPeople.find(p => p.id === savedExpense.paidBy)?.name;
      savedExpense.splits = savedExpense.splits.map(s => ({
        ...s, personName: tripPeople.find(p => p.id === s.personId)?.name
      }));
      setExpenses([...expenses, savedExpense]);
      toast.success("Expense added!");
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Failed to save expense.");
      return false;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await apiDelete(`/api/trips/${tripId}/budget/${id}`);
      setExpenses(expenses.filter((exp) => exp.id !== id));
      toast.success("Expense deleted.");
      return true;
    } catch (err) {
      toast.error("Failed to delete.");
      return false;
    }
  };

  const updateBudget = async (userId, newBudget) => {
    try {
      const response = await fetch(`http://localhost:3000/api/trips/${tripId}/members/${userId}/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ budget_goal: newBudget })
      });
     
      if (!response.ok) throw new Error('Failed to update budget');
     
      setTripPeople(tripPeople.map(p =>
        p.id === userId ? { ...p, budget: newBudget } : p
      ));
     
      toast.success("Budget updated!");
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Failed to update budget.");
      return false;
    }
  };

  const recordSettlement = (settlement) => {
    const newSettlement = {
      ...settlement,
      id: Date.now(),
      status: 'completed',
      date_paid: new Date().toISOString()
    };
   
    setSettlementHistory([...settlementHistory, newSettlement]);
    toast.success(`Payment of $${settlement.amount.toFixed(2)} recorded!`);
  };

  const getEventName = (eventId) => {
    if (!eventId || eventId === 'other') return 'Other';
    const event = tripEvents.find((e) => e.event_id === eventId);
    return event?.title || 'Other';
  };

  const getEventTotal = (eventId) => 
    (groupedExpenses[eventId] || []).reduce((sum, exp) => sum + exp.amount, 0);

  return {
    // Data
    expenses,
    tripPeople,
    tripEvents,
    tripName,
    currentUser,
    pendingCosts,
    settlementHistory,
    // Calculations
    tripBudget,
    personSpending,
    settlements,
    totalSpent,
    budgetProgress,
    categoryData,
    groupedExpenses,
    sortedEventIds,
    // Helpers
    getEventName,
    getEventTotal,
    // Actions
    addExpense,
    deleteExpense,
    updateBudget,
    recordSettlement,
    // State
    loading
  };
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';

// Custom Hook
import { useBudgetData } from './useBudgetData';

// Component Imports
import { BudgetSummary } from './components/BudgetSummary';
import { MemberBudgets } from './components/MemberBudgets';
import { ExpensesList } from './components/ExpensesList';
import { AddExpenseDialog } from './components/AddExpenseDialog';
import { EditBudgetDialog } from './components/EditBudgetDialog';
import { DebtSettlement } from './components/DebtSettlement';
import { CategoryChart } from './components/CategoryChart';

// Bootstrap & Icons
import { Button, Card, Row, Col } from 'react-bootstrap';
import { Toaster } from 'sonner';
import { Plus, ArrowLeft } from 'lucide-react';

export default function BudgetPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  // UI State only (all data state is in the hook)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editBudgetPersonId, setEditBudgetPersonId] = useState(null);

  // Use custom hook for all data and logic
  const {
    expenses,
    tripPeople,
    tripEvents,
    tripName,
    currentUser,
    pendingCosts,
    tripBudget,
    personSpending,
    settlements,
    totalSpent,
    budgetProgress,
    categoryData,
    groupedExpenses,
    sortedEventIds,
    getEventName,
    getEventTotal,
    addExpense,
    deleteExpense,
    updateBudget,
    recordSettlement,
    loading
  } = useBudgetData(tripId);

  if (loading) {
    return <div className="p-5 text-center">Loading budget...</div>;
  }

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Button
              variant="outline-secondary"
              size="sm"
              className="mb-2"
              onClick={() => navigate('/budget')}
            >
              <ArrowLeft size={16} className="me-1" /> Back to All Trips
            </Button>
            <h1 className="h3 mb-0 text-gray-800">{tripName} - Budget</h1>
            <p className="text-muted mb-0">Manage expenses and track spending</p>
          </div>
        </div>

        {/* Budget Summary Component */}
        <BudgetSummary
          tripBudget={tripBudget}
          totalSpent={totalSpent}
          pendingCosts={pendingCosts}
          tripPeople={tripPeople}
        />

        {/* Member Budgets Component */}
        <MemberBudgets
          tripPeople={tripPeople}
          personSpending={personSpending}
          onEditBudget={setEditBudgetPersonId}
        />

        {/* Add Expense Button */}
        <div className="mb-4">
          <Button 
            variant="primary" 
            onClick={() => setIsAddExpenseOpen(true)} 
            className="d-flex align-items-center gap-2"
          >
            <Plus size={18} /> Add New Expense
          </Button>
        </div>

        <Row>
          {/* Expenses List Component */}
          <Col lg={8}>
            <ExpensesList
              groupedExpenses={groupedExpenses}
              sortedEventIds={sortedEventIds}
              getEventName={getEventName}
              getEventTotal={getEventTotal}
              onDeleteExpense={deleteExpense}
              currentUserId={currentUser?.user_id}
            />
          </Col>

          {/* Right Column - Category Chart and Settlements */}
          <Col lg={4}>
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Spending by Category</h6>
              </Card.Header>
              <Card.Body>
                <CategoryChart data={categoryData} />
              </Card.Body>
            </Card>

            <DebtSettlement
              settlements={settlements}
              currentUserId={currentUser?.user_id}
              people={tripPeople}
              onRecordSettlement={recordSettlement}
            />
          </Col>
        </Row>
      </div>

      {/* Modals */}
      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        onAddExpense={addExpense}
        people={tripPeople}
        events={tripEvents}
        currentUserId={currentUser?.user_id}
        editingExpense={null}
        onUpdateExpense={() => {}}
      />

      <EditBudgetDialog
        open={!!editBudgetPersonId}
        onOpenChange={(open) => !open && setEditBudgetPersonId(null)}
        person={tripPeople.find(p => p.id === editBudgetPersonId)}
        onSave={updateBudget}
      />

      <Toaster position="top-right" />
    </Layout>
  );
}
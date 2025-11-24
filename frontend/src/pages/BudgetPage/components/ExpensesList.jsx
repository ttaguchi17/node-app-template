import { Card, Accordion, Badge, ListGroup } from 'react-bootstrap';
import { Trash2 } from 'lucide-react';
import { ExpenseItem } from './ExpenseItem';

export function ExpensesList({ 
  groupedExpenses, 
  sortedEventIds, 
  getEventName, 
  getEventTotal, 
  onDeleteExpense,
  currentUserId 
}) {
  if (!sortedEventIds || sortedEventIds.length === 0) {
    return (
      <Card className="shadow mb-4">
        <Card.Header className="py-3">
          <h6 className="m-0 font-weight-bold text-primary">Expenses</h6>
        </Card.Header>
        <Card.Body className="text-center text-muted py-5">
          <p>No expenses recorded yet</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3">
        <h6 className="m-0 font-weight-bold text-primary">Expenses</h6>
      </Card.Header>
      <Card.Body>
        <Accordion>
          {sortedEventIds.map((eventId) => {
            const expenses = groupedExpenses[eventId];
            const eventName = getEventName(eventId);
            const eventTotal = getEventTotal(eventId);
            
            return (
              <Accordion.Item key={eventId} eventKey={eventId}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between w-100 me-3">
                    <span className="fw-bold">{eventName}</span>
                    <Badge bg="secondary">${eventTotal.toFixed(2)}</Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="p-0">
                  <ListGroup variant="flush">
                    {expenses.map((expense) => (
                      <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        onDelete={onDeleteExpense}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </ListGroup>
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Card.Body>
    </Card>
  );
}

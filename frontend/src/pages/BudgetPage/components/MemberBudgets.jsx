import { Card, Row, Col, ProgressBar, Button } from 'react-bootstrap';

export function MemberBudgets({ 
  tripPeople, 
  personSpending, 
  onEditBudget 
}) {
  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3">
        <h6 className="m-0 font-weight-bold text-primary">Member Budgets</h6>
      </Card.Header>
      <Card.Body>
        <Row xs={1} md={2} lg={3} className="g-3">
          {tripPeople.map((person) => {
            const spent = personSpending.find(p => p.id === person.id)?.amount || 0;
            const progress = person.budget > 0 ? (spent / person.budget) * 100 : 0;
            const variant = progress > 100 ? 'danger' : progress > 75 ? 'warning' : 'success';
           
            return (
              <Col key={person.id}>
                <Card className="h-100 border-0" style={{ backgroundColor: '#f8f9fc' }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                        <div className="fw-bold text-truncate-custom" title={person.name}>{person.name}</div>
                        <small className="text-muted">{person.initials}</small>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-primary"
                        onClick={() => onEditBudget(person.id)}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between text-sm mb-1">
                        <span>Spent: <strong>${spent.toFixed(2)}</strong></span>
                        <span className="text-muted">Budget: ${person.budget.toFixed(2)}</span>
                      </div>
                      <ProgressBar
                        now={Math.min(progress, 100)}
                        variant={variant}
                        style={{ height: '6px' }}
                      />
                    </div>
                    <small className={`${progress > 100 ? 'text-danger' : 'text-muted'}`}>
                      {progress > 100
                        ? `$${(spent - person.budget).toFixed(2)} over budget`
                        : `$${(person.budget - spent).toFixed(2)} remaining`
                      }
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card.Body>
    </Card>
  );
}

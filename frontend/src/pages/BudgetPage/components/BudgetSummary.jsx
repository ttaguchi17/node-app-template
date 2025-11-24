import { Card, Row, Col, ProgressBar } from 'react-bootstrap';

export function BudgetSummary({ 
  tripBudget, 
  totalSpent, 
  pendingCosts, 
  tripPeople 
}) {
  const projectedTotal = totalSpent + pendingCosts;
  const variant = projectedTotal > tripBudget ? 'danger' : projectedTotal > tripBudget * 0.75 ? 'warning' : 'success';

  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3">
        <h6 className="m-0 font-weight-bold text-primary">Budget Overview</h6>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={3}>
            <div className="text-center">
              <h5 className="text-muted mb-2">Total Budget</h5>
              <h2 className="fw-bold text-primary">${tripBudget.toFixed(2)}</h2>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <h5 className="text-muted mb-2">Spent</h5>
              <h2 className="fw-bold text-success">${totalSpent.toFixed(2)}</h2>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <h5 className="text-muted mb-2">Estimated Costs</h5>
              <h2 className="fw-bold text-warning">${pendingCosts.toFixed(2)}</h2>
              <small className="text-muted">From unpaid events</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <h5 className="text-muted mb-2">Projected Total</h5>
              <h2 className={`fw-bold ${projectedTotal > tripBudget ? 'text-danger' : 'text-info'}`}>
                ${projectedTotal.toFixed(2)}
              </h2>
            </div>
          </Col>
        </Row>
        
        {/* Stacked Progress Bar */}
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-2">
            <small className="text-muted">Budget Progress</small>
            <small className="fw-bold">
              {(projectedTotal / tripBudget * 100).toFixed(0)}% projected
            </small>
          </div>
          <div className="position-relative" style={{ height: '20px', backgroundColor: '#e9ecef', borderRadius: '0.5rem', overflow: 'hidden' }}>
            {/* Spent portion (solid) */}
            <div 
              style={{ 
                position: 'absolute',
                left: 0,
                height: '100%',
                width: `${Math.min((totalSpent / tripBudget * 100), 100)}%`,
                backgroundColor: projectedTotal > tripBudget ? '#dc3545' : projectedTotal > tripBudget * 0.75 ? '#ffc107' : '#198754',
                transition: 'width 0.3s ease'
              }}
            />
            {/* Pending portion (striped) */}
            {pendingCosts > 0 && (
              <div 
                style={{ 
                  position: 'absolute',
                  left: `${Math.min((totalSpent / tripBudget * 100), 100)}%`,
                  height: '100%',
                  width: `${Math.min((pendingCosts / tripBudget * 100), 100 - (totalSpent / tripBudget * 100))}%`,
                  backgroundColor: projectedTotal > tripBudget ? '#dc3545' : projectedTotal > tripBudget * 0.75 ? '#ffc107' : '#198754',
                  opacity: 0.5,
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,.4) 4px, rgba(255,255,255,.4) 8px)',
                  transition: 'width 0.3s ease'
                }}
              />
            )}
          </div>
          <div className="d-flex justify-content-between mt-1">
            <small><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#198754', marginRight: '4px', borderRadius: '2px' }}></span>Spent: ${totalSpent.toFixed(2)}</small>
            {pendingCosts > 0 && (
              <small><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#198754', opacity: 0.5, marginRight: '4px', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,.4) 2px, rgba(255,255,255,.4) 4px)', borderRadius: '2px' }}></span>Estimated: ${pendingCosts.toFixed(2)}</small>
            )}
            <small className="text-muted">Budget: ${tripBudget.toFixed(2)}</small>
          </div>
        </div>
        
        {/* Budget Composition by Person */}
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-2">
            <small className="fw-bold text-muted">Budget Composition by Member</small>
          </div>
          <div className="position-relative" style={{ height: '24px', backgroundColor: '#e9ecef', borderRadius: '0.5rem', overflow: 'hidden' }}>
            {tripPeople.map((person, index) => {
              const prevPercentage = tripPeople
                .slice(0, index)
                .reduce((sum, p) => sum + (p.budget / tripBudget * 100), 0);
              const percentage = (person.budget / tripBudget) * 100;
              
              return (
                <div
                  key={person.id}
                  style={{
                    position: 'absolute',
                    left: `${prevPercentage}%`,
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: person.hexColor,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  title={`${person.name}: $${person.budget.toFixed(2)}`}
                >
                  {percentage > 15 && `$${person.budget.toFixed(0)}`}
                </div>
              );
            })}
          </div>
          <div className="d-flex flex-wrap gap-2 mt-2">
            {tripPeople.map((person) => (
              <small key={person.id}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: person.hexColor, marginRight: '4px', borderRadius: '2px' }}></span>
                {person.name}: ${person.budget.toFixed(2)}
              </small>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

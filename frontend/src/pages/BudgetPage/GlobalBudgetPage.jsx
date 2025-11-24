import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, ProgressBar, Row, Col, Badge, Alert } from 'react-bootstrap';
import { apiGet } from '../../utils/api';
import Layout from '../../components/Layout.jsx';
import { ArrowRight, TrendingUp, DollarSign, PieChart, AlertCircle, CheckCircle } from 'lucide-react';

export default function GlobalBudgetPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const data = await apiGet('/api/trips/budget/all');
        setTrips(data);
      } catch (error) {
        console.error("Failed to load budget summaries", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummaries();
  }, []);

  // Calculate financial insights with forecasted spending
  const insights = useMemo(() => {
    if (trips.length === 0) return null;
    
    const totalBudget = trips.reduce((sum, t) => sum + (t.budget_goal || 0), 0);
    const totalSpent = trips.reduce((sum, t) => sum + (t.total_spent || 0), 0);
    const totalPending = trips.reduce((sum, t) => sum + (t.total_pending || 0), 0);
    const projectedTotal = totalSpent + totalPending;
    
    const overBudgetTrips = trips.filter(t => (t.total_spent + t.total_pending) > t.budget_goal).length;
    const onTrackTrips = trips.filter(t => (t.total_spent + t.total_pending) <= t.budget_goal * 0.75).length;
    const warningTrips = trips.filter(t => {
      const projected = t.total_spent + t.total_pending;
      return projected > t.budget_goal * 0.75 && projected <= t.budget_goal;
    }).length;
    
    return {
      totalBudget,
      totalSpent,
      totalPending,
      projectedTotal,
      remaining: totalBudget - projectedTotal,
      overBudgetTrips,
      onTrackTrips,
      warningTrips,
      overallProgress: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      projectedProgress: totalBudget > 0 ? (projectedTotal / totalBudget) * 100 : 0
    };
  }, [trips]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid">
        {/* Page Header */}
        <div className="d-flex justify-content-end align-items-center mb-4">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {trips.length === 0 ? (
          <Card className="shadow">
            <Card.Body className="text-center py-5">
              <DollarSign size={64} className="text-muted mb-3" />
              <h4>No Budget Data Available</h4>
              <p className="text-muted">Join or create a trip to start tracking expenses.</p>
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <>
            {/* Financial Insights Summary Cards */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="shadow-sm border-left-primary h-100" style={{ borderLeft: '4px solid var(--bs-primary)' }}>
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col>
                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                          Total Budget
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          ${insights.totalBudget.toFixed(2)}
                        </div>
                        <small className="text-muted">
                          Across {trips.length} trip{trips.length > 1 ? 's' : ''}
                        </small>
                      </Col>
                      <Col xs="auto">
                        <DollarSign size={32} className="text-primary opacity-25" />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="shadow-sm border-left-success h-100" style={{ borderLeft: '4px solid var(--bs-success)' }}>
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col>
                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                          Total Spent
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          ${insights.totalSpent.toFixed(2)}
                        </div>
                        <small className="text-muted">
                          Actual expenses
                        </small>
                      </Col>
                      <Col xs="auto">
                        <TrendingUp size={32} className="text-success opacity-25" />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="shadow-sm border-left-warning h-100" style={{ borderLeft: '4px solid var(--bs-warning)' }}>
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col>
                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                          Estimated Costs
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          ${insights.totalPending.toFixed(2)}
                        </div>
                        <small className="text-muted">
                          Unpaid events
                        </small>
                      </Col>
                      <Col xs="auto">
                        <AlertCircle size={32} className="text-warning opacity-25" />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="shadow-sm border-left-info h-100" style={{ borderLeft: '4px solid var(--bs-info)' }}>
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col>
                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                          Remaining
                        </div>
                        <div className={`h5 mb-0 font-weight-bold ${insights.remaining < 0 ? 'text-danger' : 'text-gray-800'}`}>
                          ${Math.abs(insights.remaining).toFixed(2)}
                          {insights.remaining < 0 && <small className="ms-1">(over)</small>}
                        </div>
                        <small className="text-muted">
                          After estimates
                        </small>
                      </Col>
                      <Col xs="auto">
                        <PieChart size={32} className="text-info opacity-25" />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Status Alerts */}
            <Row className="mb-4">
              {insights.overBudgetTrips > 0 && (
                <Col md={4}>
                  <Alert variant="danger" className="mb-0 d-flex align-items-center">
                    <AlertCircle size={20} className="me-2" />
                    <div>
                      <strong>{insights.overBudgetTrips}</strong> trip{insights.overBudgetTrips > 1 ? 's' : ''} over budget
                    </div>
                  </Alert>
                </Col>
              )}
              {insights.warningTrips > 0 && (
                <Col md={4}>
                  <Alert variant="warning" className="mb-0 d-flex align-items-center">
                    <AlertCircle size={20} className="me-2" />
                    <div>
                      <strong>{insights.warningTrips}</strong> trip{insights.warningTrips > 1 ? 's' : ''} need attention
                    </div>
                  </Alert>
                </Col>
              )}
              {insights.onTrackTrips > 0 && (
                <Col md={4}>
                  <Alert variant="success" className="mb-0 d-flex align-items-center">
                    <CheckCircle size={20} className="me-2" />
                    <div>
                      <strong>{insights.onTrackTrips}</strong> trip{insights.onTrackTrips > 1 ? 's' : ''} on track
                    </div>
                  </Alert>
                </Col>
              )}
            </Row>

            {/* Trip Cards */}
            <Card className="shadow mb-4">
              <Card.Header className="py-3">
                <h6 className="m-0 font-weight-bold text-primary">Trip Budgets</h6>
              </Card.Header>
              <Card.Body>
                <Row xs={1} md={2} lg={3} className="g-4">
                  {trips.map((trip) => {
                    const spentProgress = trip.budget_goal > 0 ? (trip.total_spent / trip.budget_goal) * 100 : 0;
                    const pendingProgress = trip.budget_goal > 0 ? (trip.total_pending / trip.budget_goal) * 100 : 0;
                    const projectedTotal = trip.total_spent + trip.total_pending;
                    const projectedProgress = trip.budget_goal > 0 ? (projectedTotal / trip.budget_goal) * 100 : 0;
                    
                    const variant = projectedProgress > 100 ? "danger" : projectedProgress > 75 ? "warning" : "success";
                    const statusIcon = projectedProgress > 100 ? <AlertCircle size={20} /> : 
                                      projectedProgress > 75 ? <AlertCircle size={20} /> : 
                                      <CheckCircle size={20} />;

                    return (
                      <Col key={trip.trip_id}>
                        <Card className="h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
                              }}>
                          <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="flex-grow-1">
                                <h5 className="fw-bold mb-1">{trip.name}</h5>
                                <small className="text-muted">
                                  {trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  }) : 'Date TBD'}
                                </small>
                              </div>
                              <Badge bg={variant} className="d-flex align-items-center gap-1">
                                {statusIcon}
                                {projectedProgress.toFixed(0)}%
                              </Badge>
                            </div>

                            <div className="mt-auto">
                              <div className="d-flex justify-content-between mb-2">
                                <div>
                                  <small className="text-muted">Spent</small>
                                  <div className="fw-bold">${trip.total_spent.toFixed(2)}</div>
                                  {trip.total_pending > 0 && (
                                    <small className="text-muted">+ ${trip.total_pending.toFixed(2)} pending</small>
                                  )}
                                </div>
                                <div className="text-end">
                                  <small className="text-muted">Budget</small>
                                  <div className="fw-bold">${trip.budget_goal.toFixed(2)}</div>
                                  <small className="text-muted">
                                    ${(trip.budget_goal - projectedTotal).toFixed(2)} left
                                  </small>
                                </div>
                              </div>
                              
                              {/* Stacked Progress Bar: Spent (solid) + Pending (striped) */}
                              <div className="position-relative mb-3" style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '0.25rem', overflow: 'hidden' }}>
                                {/* Spent portion (solid) */}
                                <div 
                                  style={{ 
                                    position: 'absolute',
                                    left: 0,
                                    height: '100%',
                                    width: `${Math.min(spentProgress, 100)}%`,
                                    backgroundColor: variant === 'danger' ? '#dc3545' : variant === 'warning' ? '#ffc107' : '#198754',
                                    transition: 'width 0.3s ease'
                                  }}
                                />
                                {/* Pending portion (striped pattern) */}
                                {trip.total_pending > 0 && (
                                  <div 
                                    style={{ 
                                      position: 'absolute',
                                      left: `${Math.min(spentProgress, 100)}%`,
                                      height: '100%',
                                      width: `${Math.min(pendingProgress, 100 - spentProgress)}%`,
                                      backgroundColor: variant === 'danger' ? '#dc3545' : variant === 'warning' ? '#ffc107' : '#198754',
                                      opacity: 0.5,
                                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,.3) 5px, rgba(255,255,255,.3) 10px)',
                                      transition: 'width 0.3s ease'
                                    }}
                                  />
                                )}
                              </div>
                              
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="w-100 d-flex align-items-center justify-content-center gap-2"
                                onClick={() => navigate(`/trips/${trip.trip_id}/budget`)}
                              >
                                View Details <ArrowRight size={16} />
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
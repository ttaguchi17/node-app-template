// src/components/TripBudgetBox.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { apiGet } from '../../../utils/api';

export default function TripBudgetBox({ trip }) {
  const navigate = useNavigate();
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBudgetSummary = async () => {
      if (!trip?.trip_id) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch from the global budget endpoint and find this trip
        const allTrips = await apiGet('/api/trips/budget/all');
        const tripBudget = allTrips.find(t => t.trip_id === trip.trip_id);
        setBudgetData(tripBudget);
      } catch (error) {
        console.error('Failed to fetch budget summary', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBudgetSummary();
  }, [trip?.trip_id]);
  
  const handleViewBudget = () => {
    if (trip?.trip_id) {
      navigate(`/trips/${trip.trip_id}/budget`);
    }
  };

  if (loading) {
    return (
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Budget</h6>
          <DollarSign size={20} className="text-primary" />
        </Card.Header>
        <Card.Body className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!budgetData) {
    return (
      <Card className="shadow mb-4">
        <Card.Header className="py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Budget</h6>
          <DollarSign size={20} className="text-primary" />
        </Card.Header>
        <Card.Body>
          <div className="text-center py-3">
            <p className="text-muted mb-3">Track expenses and manage your trip budget</p>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleViewBudget}
              disabled={!trip?.trip_id}
            >
              View Budget Details
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const { budget_goal, total_spent, total_pending } = budgetData;
  const projectedTotal = total_spent + total_pending;
  const spentProgress = budget_goal > 0 ? (total_spent / budget_goal) * 100 : 0;
  const pendingProgress = budget_goal > 0 ? (total_pending / budget_goal) * 100 : 0;
  const projectedProgress = budget_goal > 0 ? (projectedTotal / budget_goal) * 100 : 0;
  const variant = projectedProgress > 100 ? 'danger' : projectedProgress > 75 ? 'warning' : 'success';

  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3 d-flex justify-content-between align-items-center">
        <h6 className="m-0 font-weight-bold text-primary">Budget</h6>
        <DollarSign size={20} className="text-primary" />
      </Card.Header>
      <Card.Body>
        {/* Budget Stats */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <small className="text-muted">Spent</small>
              <div className="fw-bold text-success">${total_spent.toFixed(2)}</div>
            </div>
            {total_pending > 0 && (
              <div className="text-center">
                <small className="text-muted">Pending</small>
                <div className="fw-bold text-warning">${total_pending.toFixed(2)}</div>
              </div>
            )}
            <div className="text-end">
              <small className="text-muted">Budget</small>
              <div className="fw-bold text-primary">${budget_goal.toFixed(2)}</div>
            </div>
          </div>
          
          {/* Stacked Progress Bar */}
          <div className="position-relative mb-2" style={{ height: '10px', backgroundColor: '#e9ecef', borderRadius: '0.25rem', overflow: 'hidden' }}>
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
            {/* Pending portion (striped) */}
            {total_pending > 0 && (
              <div 
                style={{ 
                  position: 'absolute',
                  left: `${Math.min(spentProgress, 100)}%`,
                  height: '100%',
                  width: `${Math.min(pendingProgress, 100 - spentProgress)}%`,
                  backgroundColor: variant === 'danger' ? '#dc3545' : variant === 'warning' ? '#ffc107' : '#198754',
                  opacity: 0.5,
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,.4) 4px, rgba(255,255,255,.4) 8px)',
                  transition: 'width 0.3s ease'
                }}
              />
            )}
          </div>
          
          <div className="d-flex justify-content-between align-items-center">
            <small className={`fw-bold ${variant === 'danger' ? 'text-danger' : variant === 'warning' ? 'text-warning' : 'text-success'}`}>
              {projectedProgress > 100 && <AlertCircle size={12} className="me-1" />}
              {projectedProgress.toFixed(0)}% projected
            </small>
            <small className="text-muted">
              ${(budget_goal - projectedTotal).toFixed(2)} remaining
            </small>
          </div>
        </div>
        
        <Button 
          variant="primary" 
          size="sm" 
          className="w-100"
          onClick={handleViewBudget}
        >
          View Budget Details
        </Button>
      </Card.Body>
    </Card>
  );
}
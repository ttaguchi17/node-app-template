import { useState } from 'react';
import { Button, Badge, Card, Collapse } from 'react-bootstrap';
import { ArrowRight, ChevronDown, ChevronUp, Check, X } from 'lucide-react';

export function DebtSettlement({
  settlements = [],
  onRecordSettlement = () => {},
  pendingSettlements = [],
  completedSettlements = [],
  onConfirmSettlement = () => {},
  onDeclineSettlement,
  currentUserId,
  people = []
}) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);

  const totalTransactions = settlements.length + pendingSettlements.length;
  const allSettled = totalTransactions === 0;

  const getPerson = (personId) => people.find(p => p.id === personId);

  return (
    <Card className="shadow-sm border-0 mb-4">
      {/* Settlement Summary Header */}
      <Card.Header className="bg-white border-bottom-0 d-flex justify-content-between align-items-center" 
                   onClick={() => setIsSummaryOpen(!isSummaryOpen)} style={{ cursor: 'pointer' }}>
        <div>
          <h5 className="mb-0">Settlement Summary</h5>
          <small className="text-muted">
            {allSettled ? 'All settled!' : `${totalTransactions} transaction(s) pending`}
          </small>
        </div>
        <Button variant="link" className="text-dark p-0">
            {isSummaryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </Card.Header>

      <Collapse in={isSummaryOpen}>
        <div>
          <Card.Body>
            {allSettled && (
              <div className="alert alert-success d-flex align-items-center gap-2">
                <Check size={18} /> Everyone is even!
              </div>
            )}

            {(settlements.length > 0 || pendingSettlements.length > 0) && (
              <div className="d-flex flex-column gap-3">
                
                {/* Pending Settlements (Need Approval) */}
                {pendingSettlements.map((settlement) => {
                  const fromPerson = getPerson(settlement.from);
                  const toPerson = getPerson(settlement.to);
                  const isReceiver = settlement.to === currentUserId;

                  return (
                    <div key={settlement.id} className="d-flex align-items-center justify-content-between p-3 bg-warning bg-opacity-10 rounded border border-warning">
                      <div className="d-flex align-items-center gap-2">
                        <strong>{fromPerson?.name}</strong>
                        <ArrowRight size={16} className="text-muted" />
                        <strong>{toPerson?.name}</strong>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold">${settlement.amount.toFixed(2)}</span>
                        {isReceiver ? (
                            <div className="btn-group">
                                <Button size="sm" variant="success" onClick={() => onConfirmSettlement(settlement.id)}>
                                    <Check size={16} />
                                </Button>
                                {onDeclineSettlement && (
                                    <Button size="sm" variant="outline-danger" onClick={() => onDeclineSettlement(settlement.id)}>
                                        <X size={16} />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Badge bg="warning" text="dark">Pending</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Suggested Settlements */}
                {settlements.map((settlement, index) => {
                  const canRecord = settlement.from === currentUserId;
                  return (
                    <div key={`settlement-${index}`} className="d-flex align-items-center justify-content-between p-3 border rounded">
                        <div className="d-flex align-items-center gap-2">
                            <span>{getPerson(settlement.from)?.name}</span>
                            <ArrowRight size={16} className="text-muted" />
                            <span>{getPerson(settlement.to)?.name}</span>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <span className="fw-bold">${settlement.amount.toFixed(2)}</span>
                            <Button size="sm" variant="outline-primary" onClick={() => onRecordSettlement(settlement)} disabled={!canRecord}>
                                Pay
                            </Button>
                        </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </div>
      </Collapse>

      {/* Completed History */}
      {completedSettlements.length > 0 && (
        <>
            <hr className="m-0" />
            <div className="p-3 d-flex justify-content-between align-items-center" onClick={() => setIsRecordsOpen(!isRecordsOpen)} style={{cursor: 'pointer'}}>
                <span className="text-muted small">History ({completedSettlements.length})</span>
                {isRecordsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <Collapse in={isRecordsOpen}>
                <div className="p-3 pt-0">
                    {completedSettlements.map((s) => (
                        <div key={s.id} className="d-flex justify-content-between small text-muted mb-2 p-2 bg-light rounded">
                            <span>{getPerson(s.from)?.name} → {getPerson(s.to)?.name}</span>
                            <span>${s.amount.toFixed(2)} (Paid)</span>
                        </div>
                    ))}
                </div>
            </Collapse>
        </>
      )}
    </Card>
  );
}
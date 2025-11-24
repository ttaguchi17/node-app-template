import { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { X } from 'lucide-react';

const CATEGORIES = [
  { id: 'accommodation', name: 'Accommodation', color: '#5B7FFF' },
  { id: 'transportation', name: 'Transportation', color: '#FF6B9D' },
  { id: 'food', name: 'Food', color: '#4CAF50' },
  { id: 'entertainment', name: 'Entertainment', color: '#FFA726' },
  { id: 'activities', name: 'Activities', color: '#AB47BC' },
  { id: 'shopping', name: 'Shopping', color: '#26C6DA' },
  { id: 'other', name: 'Other', color: '#78909C' },
];

export function AddExpenseDialog({
  open,
  onOpenChange,
  onAddExpense,
  people = [],
  events = [],
  currentUserId,
  editingExpense,
  onUpdateExpense
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState('');
  const [event, setEvent] = useState('other');
  const [category, setCategory] = useState('other');
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [splits, setSplits] = useState({});
  const [splitEvenly, setSplitEvenly] = useState(true);
  const [manuallyEditedSplits, setManuallyEditedSplits] = useState(new Set());

  // Reset form when opening/closing
  const resetForm = () => {
    setDescription('');
    setAmount('');
    setPaidBy(currentUserId || (people[0] ? people[0].id : ''));
    setDate(new Date().toISOString().split('T')[0]);
    setEvent('other');
    setCategory('other');
    setSelectedPeople(currentUserId ? [parseInt(currentUserId)] : []);
    setSplits({});
    setSplitEvenly(true);
    setManuallyEditedSplits(new Set());
  };

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        // Load existing data
        setDescription(editingExpense.description);
        setAmount(editingExpense.amount.toString());
        setPaidBy(editingExpense.paidBy); // Note: check if this is ID or Name in your object
        setDate(editingExpense.date);
        setEvent(editingExpense.event || 'other');
        setCategory(editingExpense.category || 'other');
        
        const existingSplits = editingExpense.splits || [];
        setSelectedPeople(existingSplits.map(s => s.personId));
        
        const initialSplits = {};
        existingSplits.forEach(split => {
          initialSplits[split.personId] = split.amount.toString();
        });
        setSplits(initialSplits);
        setSplitEvenly(false); 
      } else {
        resetForm();
      }
    }
  }, [open, editingExpense]);

  // Auto-calculate splits when amount/people change
  useEffect(() => {
    if (splitEvenly && amount && selectedPeople.length > 0) {
      const totalAmount = parseFloat(amount);
      if (!isNaN(totalAmount)) {
        const perPerson = (totalAmount / selectedPeople.length).toFixed(2);
        const newSplits = {};
        selectedPeople.forEach(id => {
          newSplits[id] = perPerson;
        });
        setSplits(newSplits);
      }
    }
  }, [amount, selectedPeople, splitEvenly]);

  const handleAddPerson = (e) => {
    const personId = parseInt(e.target.value);
    if (personId && !selectedPeople.includes(personId)) {
      const newSelected = [...selectedPeople, personId];
      setSelectedPeople(newSelected);
      // Logic to reset/recalc splits handled by useEffect above if splitEvenly is true
    }
  };

  const handleRemovePerson = (personId) => {
    const updated = selectedPeople.filter(id => id !== personId);
    setSelectedPeople(updated);
    const newSplits = { ...splits };
    delete newSplits[personId];
    setSplits(newSplits);
  };

  const handleSplitAmountChange = (personId, value) => {
    setSplits({ ...splits, [personId]: value });
    setSplitEvenly(false); // Manual edit disables auto-split
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !amount || !paidBy || !date || selectedPeople.length === 0) return;

    const totalAmount = parseFloat(amount);
    const expenseSplits = selectedPeople.map(id => ({
      personId: id,
      amount: parseFloat(splits[id] || '0')
    }));

    const payload = {
      description,
      amount: totalAmount,
      paidBy: parseInt(paidBy),
      event: event === 'other' ? null : parseInt(event),
      category,
      date,
      splits: expenseSplits,
    };

    if (editingExpense && onUpdateExpense) {
      onUpdateExpense(editingExpense.id, payload);
    } else {
      onAddExpense(payload);
    }
    onOpenChange(false);
  };

  const availablePeople = people.filter(p => !selectedPeople.includes(p.id));

  return (
    <Modal show={open} onHide={() => onOpenChange(false)} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={12}>
                <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control 
                        type="text" 
                        placeholder="e.g. Dinner at Mario's"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                    />
                </Form.Group>
            </Col>

            <Col md={6}>
                <Form.Group>
                    <Form.Label>Amount ($)</Form.Label>
                    <Form.Control 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                    />
                </Form.Group>
            </Col>

            <Col md={6}>
                <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control 
                        type="date" 
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                    />
                </Form.Group>
            </Col>

            <Col md={6}>
                <Form.Group>
                    <Form.Label>Paid By</Form.Label>
                    <Form.Select value={paidBy} onChange={e => setPaidBy(e.target.value)} required>
                        <option value="">Select Payer...</option>
                        {people.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </Col>

            <Col md={6}>
                <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Select value={category} onChange={e => setCategory(e.target.value)}>
                        {CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </Col>

            <Col md={12}>
                <Form.Group>
                    <Form.Label>Link to Event (Optional)</Form.Label>
                    <Form.Select value={event} onChange={e => setEvent(e.target.value)}>
                        <option value="other">None (General Trip Expense)</option>
                        {(Array.isArray(events) ? events : []).map(e => (
                            <option key={e.event_id || e.id} value={e.event_id || e.id}>
                                {e.title || e.name}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </Col>

            <Col md={12}>
                <hr />
                <Form.Label className="d-block mb-2">Split With:</Form.Label>
                
                {/* Add Person Dropdown */}
                <InputGroup className="mb-3">
                    <Form.Select onChange={handleAddPerson} value="">
                        <option value="">Add person to split...</option>
                        {availablePeople.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </Form.Select>
                </InputGroup>

                {/* Split List */}
                {selectedPeople.length > 0 && (
                    <div className="bg-light p-3 rounded border">
                        <Form.Check 
                            type="checkbox"
                            label="Split Evenly"
                            checked={splitEvenly}
                            onChange={e => setSplitEvenly(e.target.checked)}
                            className="mb-3 fw-bold"
                        />
                        
                        {selectedPeople.map(personId => {
                            const person = people.find(p => p.id === personId);
                            if (!person) return null;
                            return (
                                <Row key={personId} className="align-items-center mb-2">
                                    <Col xs={5}>{person.name}</Col>
                                    <Col xs={5}>
                                        <InputGroup size="sm">
                                            <InputGroup.Text>$</InputGroup.Text>
                                            <Form.Control 
                                                type="number" 
                                                step="0.01"
                                                value={splits[personId] || ''}
                                                onChange={e => handleSplitAmountChange(personId, e.target.value)}
                                                disabled={splitEvenly}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col xs={2}>
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleRemovePerson(personId)}>
                                            <X size={18} />
                                        </Button>
                                    </Col>
                                </Row>
                            );
                        })}
                    </div>
                )}
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-4 gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={selectedPeople.length === 0}>
                {editingExpense ? 'Update' : 'Save Expense'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
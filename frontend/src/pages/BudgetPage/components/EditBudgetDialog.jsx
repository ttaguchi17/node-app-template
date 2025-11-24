import { useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';

export function EditBudgetDialog({ open, onOpenChange, person, onSave }) {
  const [budgetValue, setBudgetValue] = useState(person?.budget?.toString() || '0');

  const handleSave = () => {
    if (person) {
      const newBudget = parseFloat(budgetValue);
      if (!isNaN(newBudget) && newBudget >= 0) {
        onSave(person.id, newBudget);
        onOpenChange(false);
      }
    }
  };

  if (!person) return null;

  return (
    <Modal show={open} onHide={() => onOpenChange(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit {person.name}'s Budget</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
            <Form.Label>Budget Limit</Form.Label>
            <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                />
            </InputGroup>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save Budget</Button>
      </Modal.Footer>
    </Modal>
  );
}
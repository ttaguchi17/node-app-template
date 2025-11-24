const express = require('express');
// mergeParams allows us to access :tripId from the parent router
const router = express.Router({ mergeParams: true });
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

// backend/routes/budget.js (Partial Update - Replace the GET router)

// GET /api/trips/:tripId/budget
router.get('/', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  console.log(`\n[GET Budget] Fetching data for Trip ${tripId}...`); // <--- NEW LOG

  try {
    // Check Access
    const [member] = await pool.execute('SELECT 1 FROM trip_membership WHERE trip_id = ? AND user_id = ?', [tripId, req.user.user_id]);
    if (!member.length) {
        console.log('[GET Budget] Access Denied');
        return res.status(403).json({ message: 'Access denied' });
    }

    // 1. Get Expenses
    const [expenses] = await pool.execute(
      `SELECT expense_id AS id, trip_id, event_id, paid_by_user_id AS paidBy, description, amount, date_incurred AS date, category 
       FROM expenses WHERE trip_id = ? ORDER BY date_incurred DESC`, 
      [tripId]
    );
    console.log(`[GET Budget] Found ${expenses.length} expenses.`); // <--- NEW LOG

    // 2. Get Splits
    const [splits] = await pool.execute(
      `SELECT s.split_id AS id, s.expense_id, s.owed_by_user_id AS personId, s.amount_owed AS amount 
       FROM expense_splits s JOIN expenses e ON s.expense_id = e.expense_id WHERE e.trip_id = ?`,
      [tripId]
    );

    // 3. Get Budgets
    const [budgets] = await pool.execute(
      `SELECT user_id, budget_goal as budget_amount FROM trip_membership WHERE trip_id = ?`, 
      [tripId]
    );

    // 4. Get Settlements
    const [settlements] = await pool.execute(
      `SELECT settlement_id AS id, from_user_id AS "from", to_user_id AS "to", amount, status, date(date_paid) as date 
 FROM settlements WHERE trip_id = ?`,
      [tripId]
    );

    // Combine Data
    const results = {
      expenses: expenses.map(exp => ({
        ...exp,
        amount: parseFloat(exp.amount),
        // Ensure we attach the splits to the correct expense
        splits: splits.filter(s => s.expense_id === exp.id).map(s => ({ ...s, amount: parseFloat(s.amount) }))
      })),
      budgets: budgets.map(b => ({ userId: b.user_id, amount: parseFloat(b.budget_amount) })),
      settlements: settlements.map(s => ({ ...s, amount: parseFloat(s.amount) }))
    };

    console.log(`[GET Budget] Sending payload with ${results.expenses.length} expenses.`);
    res.json(results);

  } catch (err) {
    console.error('[GET Budget] ERROR:', err);
    res.status(500).json({ message: 'Server error fetching budget' });
  }
});

// POST /api/trips/:tripId/budget (Add Expense)
router.post('/', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { description, amount, paidBy, date, category, event, splits } = req.body;

  // --- 1. DEBUG LOGGING ---
  console.log(`\n[POST Budget] Adding expense for Trip ${tripId}`);
  console.log('Payload:', JSON.stringify(req.body, null, 2));

  // --- 2. VALIDATION ---
  if (!description || !amount || !date) {
    console.error('[POST Budget] Missing required fields');
    return res.status(400).json({ message: 'Description, Amount, and Date are required.' });
  }

  // Validate Payer
  const paidById = parseInt(paidBy);
  if (isNaN(paidById)) {
    console.error(`[POST Budget] Invalid Payer ID: ${paidBy}`);
    return res.status(400).json({ message: 'Invalid Payer ID. Please select a person.' });
  }

  // Validate Event ID (Optional)
  // If event is "other" or null, set to NULL. Otherwise parse int.
  const event_id = (event && event !== 'other') ? parseInt(event) : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // --- 3. INSERT EXPENSE ---
    console.log('[POST Budget] Running SQL Insert...');
    const [resExp] = await conn.execute(
      `INSERT INTO expenses 
       (trip_id, event_id, paid_by_user_id, description, amount, date_incurred, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tripId, event_id, paidById, description, amount, date, category || 'other']
    );
    const newId = resExp.insertId;
    console.log(`[POST Budget] Expense Created: ID ${newId}`);

    // --- 4. INSERT SPLITS ---
    if (splits && Array.isArray(splits) && splits.length > 0) {
      const splitVals = [];
      const placeholders = [];
      
      splits.forEach(s => {
        // Ensure we aren't inserting NaNs
        const pId = parseInt(s.personId);
        const amt = parseFloat(s.amount);
        if (!isNaN(pId) && !isNaN(amt)) {
            placeholders.push('(?, ?, ?)');
            splitVals.push(newId, pId, amt);
        }
      });

      if (splitVals.length > 0) {
        const sql = `INSERT INTO expense_splits (expense_id, owed_by_user_id, amount_owed) VALUES ${placeholders.join(', ')}`;
        await conn.execute(sql, splitVals);
      }
    }

    await conn.commit();
    
    // Return success
    res.status(201).json({ 
        id: newId, 
        trip_id: tripId, 
        paidBy: paidById, 
        description, 
        amount, 
        date, 
        category,
        splits 
    });

  } catch (err) {
    await conn.rollback();
    // --- 5. ERROR LOGGING ---
    console.error('----------------------------');
    console.error('[POST Budget] SQL ERROR:');
    console.error(err.message);
    console.error('----------------------------');
    
    res.status(500).json({ message: 'Database error saving expense', error: err.message });
  } finally {
    conn.release();
  }
});

/**
 * DELETE /api/trips/:tripId/budget/:expenseId
 */
router.delete('/:expenseId', authenticateToken, async (req, res) => {
    const { tripId, expenseId } = req.params;
    const userId = req.user.user_id;

    try {
        // Check permission (Only the payer or organizer can delete)
        const [check] = await pool.execute(
            `SELECT e.paid_by_user_id, tm.role 
             FROM expenses e
             JOIN trip_membership tm ON e.trip_id = tm.trip_id AND tm.user_id = ?
             WHERE e.expense_id = ?`,
            [userId, expenseId]
        );

        if (check.length === 0) return res.status(404).json({message: "Expense not found"});
        
        const { paid_by_user_id, role } = check[0];
        if (paid_by_user_id !== userId && !['owner', 'organizer'].includes(role)) {
            return res.status(403).json({message: "Only the payer or organizer can delete this."});
        }

        // Delete (Splits will auto-delete if you have CASCADE set up, otherwise we delete them manually)
        await pool.execute('DELETE FROM expense_splits WHERE expense_id = ?', [expenseId]);
        await pool.execute('DELETE FROM expenses WHERE expense_id = ?', [expenseId]);

        res.json({ message: "Expense deleted" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting expense" });
    }
});

module.exports = router;
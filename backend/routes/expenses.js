import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Create expense
router.post('/', (req, res) => {
  try {
    const { projectId, clientId, amount, category, description, date, receiptUrl } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({ error: 'Amount, category, and date are required' });
    }

    const userId = 1;

    const stmt = db.prepare(`
      INSERT INTO expenses (user_id, project_id, client_id, amount, category, description, date, receipt_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      projectId || null,
      clientId || null,
      amount,
      category,
      description || '',
      date,
      receiptUrl || '',
      new Date().toISOString()
    );

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get all expenses
router.get('/', (req, res) => {
  try {
    const userId = 1;
    const { projectId, clientId, startDate, endDate, category } = req.query;

    let query = `
      SELECT e.*, p.name as project_name, c.name as client_name
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE e.user_id = ?
    `;
    const params = [userId];

    if (projectId) {
      query += ' AND e.project_id = ?';
      params.push(projectId);
    }

    if (clientId) {
      query += ' AND e.client_id = ?';
      params.push(clientId);
    }

    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }

    if (category) {
      query += ' AND e.category = ?';
      params.push(category);
    }

    query += ' ORDER BY e.date DESC';

    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense by ID
router.get('/:id', (req, res) => {
  try {
    const expense = db.prepare(`
      SELECT e.*, p.name as project_name, c.name as client_name
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Update expense
router.patch('/:id', (req, res) => {
  try {
    const { amount, category, description, date, receiptUrl, projectId, clientId } = req.body;

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (amount !== undefined) db.prepare('UPDATE expenses SET amount = ? WHERE id = ?').run(amount, req.params.id);
    if (category !== undefined) db.prepare('UPDATE expenses SET category = ? WHERE id = ?').run(category, req.params.id);
    if (description !== undefined) db.prepare('UPDATE expenses SET description = ? WHERE id = ?').run(description, req.params.id);
    if (date !== undefined) db.prepare('UPDATE expenses SET date = ? WHERE id = ?').run(date, req.params.id);
    if (receiptUrl !== undefined) db.prepare('UPDATE expenses SET receipt_url = ? WHERE id = ?').run(receiptUrl, req.params.id);
    if (projectId !== undefined) db.prepare('UPDATE expenses SET project_id = ? WHERE id = ?').run(projectId, req.params.id);
    if (clientId !== undefined) db.prepare('UPDATE expenses SET client_id = ? WHERE id = ?').run(clientId, req.params.id);

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get expense summary
router.get('/summary/stats', (req, res) => {
  try {
    const userId = 1;
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [userId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    const expenses = db.prepare(query).all(...params);
    
    const totalAmount = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Group by category
    const byCategory = {};
    expenses.forEach(expense => {
      const cat = expense.category || 'Other';
      if (!byCategory[cat]) {
        byCategory[cat] = { category: cat, amount: 0, count: 0 };
      }
      byCategory[cat].amount += parseFloat(expense.amount) || 0;
      byCategory[cat].count += 1;
    });

    // Group by project
    const byProject = {};
    expenses.forEach(expense => {
      const projectId = expense.project_id;
      if (projectId) {
        if (!byProject[projectId]) {
          byProject[projectId] = { projectId, amount: 0, count: 0 };
        }
        byProject[projectId].amount += parseFloat(expense.amount) || 0;
        byProject[projectId].count += 1;
      }
    });

    res.json({
      totalAmount,
      expenseCount: expenses.length,
      byCategory: Object.values(byCategory),
      byProject: Object.values(byProject)
    });
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
});

export default router;


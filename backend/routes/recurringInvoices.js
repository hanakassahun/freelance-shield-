import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Create recurring invoice
router.post('/', (req, res) => {
  try {
    const { clientId, amount, currency, frequency, startDate, description, endDate, autoGenerate } = req.body;

    if (!clientId || !amount || !frequency || !startDate) {
      return res.status(400).json({ error: 'Client ID, amount, frequency, and start date are required' });
    }

    const userId = 1;

    const stmt = db.prepare(`
      INSERT INTO recurring_invoices (user_id, client_id, amount, currency, frequency, start_date, end_date, description, auto_generate, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      clientId,
      amount,
      currency || 'USD',
      frequency,
      startDate,
      endDate || null,
      description || '',
      autoGenerate !== undefined ? autoGenerate : true,
      'active',
      new Date().toISOString()
    );

    const recurring = db.prepare('SELECT * FROM recurring_invoices WHERE id = ?').get(result.lastInsertRowid);
    res.json(recurring);
  } catch (error) {
    console.error('Error creating recurring invoice:', error);
    res.status(500).json({ error: 'Failed to create recurring invoice' });
  }
});

// Get all recurring invoices
router.get('/', (req, res) => {
  try {
    const userId = 1;
    const recurring = db.prepare(`
      SELECT r.*, c.name as client_name
      FROM recurring_invoices r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);

    res.json(recurring);
  } catch (error) {
    console.error('Error fetching recurring invoices:', error);
    res.status(500).json({ error: 'Failed to fetch recurring invoices' });
  }
});

// Get recurring invoice by ID
router.get('/:id', (req, res) => {
  try {
    const recurring = db.prepare(`
      SELECT r.*, c.name as client_name
      FROM recurring_invoices r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.id = ?
    `).get(req.params.id);

    if (!recurring) {
      return res.status(404).json({ error: 'Recurring invoice not found' });
    }

    res.json(recurring);
  } catch (error) {
    console.error('Error fetching recurring invoice:', error);
    res.status(500).json({ error: 'Failed to fetch recurring invoice' });
  }
});

// Update recurring invoice
router.patch('/:id', (req, res) => {
  try {
    const { amount, currency, frequency, startDate, endDate, description, autoGenerate, status } = req.body;

    const recurring = db.prepare('SELECT * FROM recurring_invoices WHERE id = ?').get(req.params.id);
    if (!recurring) {
      return res.status(404).json({ error: 'Recurring invoice not found' });
    }

    if (amount !== undefined) db.prepare('UPDATE recurring_invoices SET amount = ? WHERE id = ?').run(amount, req.params.id);
    if (currency !== undefined) db.prepare('UPDATE recurring_invoices SET currency = ? WHERE id = ?').run(currency, req.params.id);
    if (frequency !== undefined) db.prepare('UPDATE recurring_invoices SET frequency = ? WHERE id = ?').run(frequency, req.params.id);
    if (startDate !== undefined) db.prepare('UPDATE recurring_invoices SET start_date = ? WHERE id = ?').run(startDate, req.params.id);
    if (endDate !== undefined) db.prepare('UPDATE recurring_invoices SET end_date = ? WHERE id = ?').run(endDate, req.params.id);
    if (description !== undefined) db.prepare('UPDATE recurring_invoices SET description = ? WHERE id = ?').run(description, req.params.id);
    if (autoGenerate !== undefined) db.prepare('UPDATE recurring_invoices SET auto_generate = ? WHERE id = ?').run(autoGenerate, req.params.id);
    if (status !== undefined) db.prepare('UPDATE recurring_invoices SET status = ? WHERE id = ?').run(status, req.params.id);

    const updated = db.prepare('SELECT * FROM recurring_invoices WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating recurring invoice:', error);
    res.status(500).json({ error: 'Failed to update recurring invoice' });
  }
});

// Generate invoice from recurring
router.post('/:id/generate', (req, res) => {
  try {
    const recurring = db.prepare('SELECT * FROM recurring_invoices WHERE id = ?').get(req.params.id);
    if (!recurring) {
      return res.status(404).json({ error: 'Recurring invoice not found' });
    }

    if (recurring.status !== 'active') {
      return res.status(400).json({ error: 'Recurring invoice is not active' });
    }

    // Calculate next due date based on frequency
    const lastDate = new Date(recurring.start_date);
    const now = new Date();
    let nextDueDate = new Date(lastDate);

    while (nextDueDate <= now) {
      if (recurring.frequency === 'weekly') {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      } else if (recurring.frequency === 'biweekly') {
        nextDueDate.setDate(nextDueDate.getDate() + 14);
      } else if (recurring.frequency === 'monthly') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else if (recurring.frequency === 'quarterly') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
      } else if (recurring.frequency === 'yearly') {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      }
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    const userId = 1;
    const stmt = db.prepare(`
      INSERT INTO invoices (user_id, client_id, invoice_number, amount, currency, due_date, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      userId,
      recurring.client_id,
      invoiceNumber,
      recurring.amount,
      recurring.currency,
      nextDueDate.toISOString().split('T')[0],
      recurring.description || `Recurring invoice - ${recurring.frequency}`
    );

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);
    res.json(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Delete recurring invoice
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM recurring_invoices WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring invoice:', error);
    res.status(500).json({ error: 'Failed to delete recurring invoice' });
  }
});

export default router;


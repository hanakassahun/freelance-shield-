import express from 'express';
import { getDb, models, isOrmEnabled } from '../db/index.js';

const router = express.Router();
const db = getDb();
const { Invoice, Client } = models;

// Generate invoice number
function generateInvoiceNumber() {
  const timestamp = Date.now();
  return `INV-${timestamp}`;
}

// Generate reminder text
function generateReminder(invoice, tone = 'polite') {
  const dueDate = new Date(invoice.due_date || invoice.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const daysOverdue = Math.floor((new Date() - new Date(invoice.due_date || invoice.dueDate)) / (1000 * 60 * 60 * 24));

  if (tone === 'polite') {
    return `Hi ${invoice.client_name || 'there'},

Just checking in on invoice #${invoice.invoice_number} for $${invoice.amount.toFixed(2)}, which was due on ${dueDate}.

Please let me know if you need any additional information or if there are any issues.

Thanks!`;
  } else if (tone === 'firm') {
    return `Hi ${invoice.client_name || 'there'},

Invoice #${invoice.invoice_number} for $${invoice.amount.toFixed(2)} is now ${daysOverdue > 0 ? `${daysOverdue} day(s) overdue` : 'due'}. 

Please arrange payment as soon as possible. If there are any issues, please contact me immediately.

Thank you.`;
  } else {
    return `Hi ${invoice.client_name || 'there'},

This is a reminder that invoice #${invoice.invoice_number} for $${invoice.amount.toFixed(2)} is due on ${dueDate}.

Best regards`;
  }
}

// Create invoice
router.post('/', async (req, res) => {
  try {
    const { clientId, amount, dueDate, description, currency } = req.body;

    if (!clientId || !amount || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userId = 1; // MVP: default user
    const invoiceNumber = generateInvoiceNumber();

    if (isOrmEnabled()) {
      const created = await Invoice.create({
        userId,
        clientId,
        invoiceNumber,
        amount,
        currency: currency || 'USD',
        dueDate,
        description: description || '',
        status: 'pending',
        escalationStage: 0
      });

      const invoice = await Invoice.findByPk(created.id, {
        include: { model: Client, attributes: ['name'] }
      });

      return res.json({
        ...invoice.toJSON(),
        client_name: invoice.Client?.name || null
      });
    }

    const stmt = db.prepare(`
      INSERT INTO invoices (user_id, client_id, invoice_number, amount, currency, due_date, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      userId,
      clientId,
      invoiceNumber,
      amount,
      currency || 'USD',
      dueDate,
      description || ''
    );

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);
    res.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const userId = 1; // MVP: default user

    if (isOrmEnabled()) {
      const invoices = await Invoice.findAll({
        where: { userId },
        include: { model: Client, attributes: ['name'] },
        order: [['dueDate', 'DESC']]
      });

      return res.json(invoices.map(invoice => ({
        ...invoice.toJSON(),
        client_name: invoice.Client?.name || null
      })));
    }

    const invoices = db.prepare(`
      SELECT i.*, c.name as client_name 
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = ?
      ORDER BY i.due_date DESC
    `).all(userId);

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    if (isOrmEnabled()) {
      const invoice = await Invoice.findByPk(req.params.id, {
        include: { model: Client, attributes: ['name'] }
      });
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      return res.json({
        ...invoice.toJSON(),
        client_name: invoice.Client?.name || null
      });
    }

    const invoice = db.prepare(`
      SELECT i.*, c.name as client_name 
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (isOrmEnabled()) {
      const updateData = { status };
      if (status === 'paid') {
        updateData.paidDate = new Date().toISOString().split('T')[0];
      }
      await Invoice.update(updateData, { where: { id: req.params.id } });
      const invoice = await Invoice.findByPk(req.params.id, {
        include: { model: Client, attributes: ['name'] }
      });
      return res.json({
        ...invoice.toJSON(),
        client_name: invoice.Client?.name || null
      });
    }

    if (status === 'paid') {
      db.prepare('UPDATE invoices SET status = ?, paid_date = ? WHERE id = ?').run(
        status,
        new Date().toISOString().split('T')[0],
        req.params.id
      );
    } else {
      db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, req.params.id);
    }

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Advance escalation stage and get reminder text
router.get('/:id/reminder', async (req, res) => {
  try {
    const tone = req.query.tone || 'polite';

    if (isOrmEnabled()) {
      const invoice = await Invoice.findByPk(req.params.id, {
        include: { model: Client, attributes: ['name'] }
      });
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const nextStage = Math.min((invoice.escalationStage || 0) + 1, 2);
      await Invoice.update({ escalationStage: nextStage }, { where: { id: req.params.id } });

      const payload = {
        ...invoice.toJSON(),
        client_name: invoice.Client?.name || null,
        escalationStage: nextStage
      };
      const reminder = generateReminder(payload, tone);
      return res.json({ reminder, tone, escalationStage: nextStage });
    }

    const invoice = db.prepare(`
      SELECT i.*, c.name as client_name 
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const reminder = generateReminder(invoice, tone);
    res.json({ reminder, tone });
  } catch (error) {
    console.error('Error generating reminder:', error);
    res.status(500).json({ error: 'Failed to generate reminder' });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    if (isOrmEnabled()) {
      await Invoice.destroy({ where: { id: req.params.id } });
      return res.json({ success: true });
    }

    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

export default router;


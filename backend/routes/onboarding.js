import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Create onboarding checklist
router.post('/', (req, res) => {
  try {
    const { clientId, projectId, name } = req.body;

    if (!clientId || !name) {
      return res.status(400).json({ error: 'Client ID and name are required' });
    }

    const userId = 1;

    const stmt = db.prepare(`
      INSERT INTO onboarding_checklists (user_id, client_id, project_id, name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      clientId,
      projectId || null,
      name,
      'in_progress',
      new Date().toISOString()
    );

    const checklist = db.prepare('SELECT * FROM onboarding_checklists WHERE id = ?').get(result.lastInsertRowid);
    res.json(checklist);
  } catch (error) {
    console.error('Error creating onboarding checklist:', error);
    res.status(500).json({ error: 'Failed to create onboarding checklist' });
  }
});

// Get all onboarding checklists
router.get('/', (req, res) => {
  try {
    const userId = 1;
    const { clientId, projectId, status } = req.query;

    let query = `
      SELECT o.*, c.name as client_name, p.name as project_name
      FROM onboarding_checklists o
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE o.user_id = ?
    `;
    const params = [userId];

    if (clientId) {
      query += ' AND o.client_id = ?';
      params.push(clientId);
    }

    if (projectId) {
      query += ' AND o.project_id = ?';
      params.push(projectId);
    }

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const checklists = db.prepare(query).all(...params);

    // Attach checklist items
    const checklistsWithItems = checklists.map(checklist => {
      const items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY order_index').all(checklist.id);
      return { ...checklist, items };
    });

    res.json(checklistsWithItems);
  } catch (error) {
    console.error('Error fetching onboarding checklists:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding checklists' });
  }
});

// Get onboarding checklist by ID
router.get('/:id', (req, res) => {
  try {
    const checklist = db.prepare(`
      SELECT o.*, c.name as client_name, p.name as project_name
      FROM onboarding_checklists o
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!checklist) {
      return res.status(404).json({ error: 'Onboarding checklist not found' });
    }

    const items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY order_index').all(req.params.id);
    res.json({ ...checklist, items });
  } catch (error) {
    console.error('Error fetching onboarding checklist:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding checklist' });
  }
});

// Update onboarding checklist
router.patch('/:id', (req, res) => {
  try {
    const { name, status } = req.body;

    const checklist = db.prepare('SELECT * FROM onboarding_checklists WHERE id = ?').get(req.params.id);
    if (!checklist) {
      return res.status(404).json({ error: 'Onboarding checklist not found' });
    }

    if (name !== undefined) db.prepare('UPDATE onboarding_checklists SET name = ? WHERE id = ?').run(name, req.params.id);
    if (status !== undefined) db.prepare('UPDATE onboarding_checklists SET status = ? WHERE id = ?').run(status, req.params.id);

    const updated = db.prepare('SELECT * FROM onboarding_checklists WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating onboarding checklist:', error);
    res.status(500).json({ error: 'Failed to update onboarding checklist' });
  }
});

// Add checklist item
router.post('/:id/items', (req, res) => {
  try {
    const { title, description, orderIndex } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO checklist_items (checklist_id, title, description, completed, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.params.id,
      title,
      description || '',
      false,
      orderIndex || 0,
      new Date().toISOString()
    );

    const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(result.lastInsertRowid);
    res.json(item);
  } catch (error) {
    console.error('Error creating checklist item:', error);
    res.status(500).json({ error: 'Failed to create checklist item' });
  }
});

// Update checklist item
router.patch('/items/:itemId', (req, res) => {
  try {
    const { title, description, completed, orderIndex } = req.body;

    const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    if (title !== undefined) db.prepare('UPDATE checklist_items SET title = ? WHERE id = ?').run(title, req.params.itemId);
    if (description !== undefined) db.prepare('UPDATE checklist_items SET description = ? WHERE id = ?').run(description, req.params.itemId);
    if (completed !== undefined) db.prepare('UPDATE checklist_items SET completed = ? WHERE id = ?').run(completed, req.params.itemId);
    if (orderIndex !== undefined) db.prepare('UPDATE checklist_items SET order_index = ? WHERE id = ?').run(orderIndex, req.params.itemId);

    const updated = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.itemId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating checklist item:', error);
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

// Delete checklist item
router.delete('/items/:itemId', (req, res) => {
  try {
    db.prepare('DELETE FROM checklist_items WHERE id = ?').run(req.params.itemId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    res.status(500).json({ error: 'Failed to delete checklist item' });
  }
});

// Delete onboarding checklist
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM checklist_items WHERE checklist_id = ?').run(req.params.id);
    db.prepare('DELETE FROM onboarding_checklists WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting onboarding checklist:', error);
    res.status(500).json({ error: 'Failed to delete onboarding checklist' });
  }
});

export default router;


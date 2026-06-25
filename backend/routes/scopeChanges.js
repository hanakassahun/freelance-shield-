import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Create scope change
router.post('/', (req, res) => {
  try {
    const { projectId, description, additionalCost, status, approvedDate } = req.body;

    if (!projectId || !description) {
      return res.status(400).json({ error: 'Project ID and description are required' });
    }

    const userId = 1;

    const stmt = db.prepare(`
      INSERT INTO scope_changes (user_id, project_id, description, additional_cost, status, approved_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      projectId,
      description,
      additionalCost || 0,
      status || 'pending',
      approvedDate || null,
      new Date().toISOString()
    );

    const change = db.prepare('SELECT * FROM scope_changes WHERE id = ?').get(result.lastInsertRowid);
    res.json(change);
  } catch (error) {
    console.error('Error creating scope change:', error);
    res.status(500).json({ error: 'Failed to create scope change' });
  }
});

// Get all scope changes
router.get('/', (req, res) => {
  try {
    const userId = 1;
    const { projectId, status } = req.query;

    let query = `
      SELECT s.*, p.name as project_name, c.name as client_name
      FROM scope_changes s
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE s.user_id = ?
    `;
    const params = [userId];

    if (projectId) {
      query += ' AND s.project_id = ?';
      params.push(projectId);
    }

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.created_at DESC';

    const changes = db.prepare(query).all(...params);
    res.json(changes);
  } catch (error) {
    console.error('Error fetching scope changes:', error);
    res.status(500).json({ error: 'Failed to fetch scope changes' });
  }
});

// Get scope change by ID
router.get('/:id', (req, res) => {
  try {
    const change = db.prepare(`
      SELECT s.*, p.name as project_name, c.name as client_name
      FROM scope_changes s
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!change) {
      return res.status(404).json({ error: 'Scope change not found' });
    }

    res.json(change);
  } catch (error) {
    console.error('Error fetching scope change:', error);
    res.status(500).json({ error: 'Failed to fetch scope change' });
  }
});

// Update scope change
router.patch('/:id', (req, res) => {
  try {
    const { description, additionalCost, status, approvedDate } = req.body;

    const change = db.prepare('SELECT * FROM scope_changes WHERE id = ?').get(req.params.id);
    if (!change) {
      return res.status(404).json({ error: 'Scope change not found' });
    }

    if (description !== undefined) db.prepare('UPDATE scope_changes SET description = ? WHERE id = ?').run(description, req.params.id);
    if (additionalCost !== undefined) db.prepare('UPDATE scope_changes SET additional_cost = ? WHERE id = ?').run(additionalCost, req.params.id);
    if (status !== undefined) db.prepare('UPDATE scope_changes SET status = ? WHERE id = ?').run(status, req.params.id);
    if (approvedDate !== undefined) db.prepare('UPDATE scope_changes SET approved_date = ? WHERE id = ?').run(approvedDate, req.params.id);

    const updated = db.prepare('SELECT * FROM scope_changes WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating scope change:', error);
    res.status(500).json({ error: 'Failed to update scope change' });
  }
});

// Delete scope change
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM scope_changes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scope change:', error);
    res.status(500).json({ error: 'Failed to delete scope change' });
  }
});

export default router;


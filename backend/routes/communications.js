import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Create communication
router.post('/', (req, res) => {
  try {
    const { clientId, projectId, type, subject, content, direction, date } = req.body;

    if (!clientId || !type || !content) {
      return res.status(400).json({ error: 'Client ID, type, and content are required' });
    }

    const userId = 1;

    const stmt = db.prepare(`
      INSERT INTO communications (user_id, client_id, project_id, type, subject, content, direction, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      clientId,
      projectId || null,
      type,
      subject || '',
      content,
      direction || 'incoming',
      date || new Date().toISOString(),
      new Date().toISOString()
    );

    const communication = db.prepare('SELECT * FROM communications WHERE id = ?').get(result.lastInsertRowid);
    res.json(communication);
  } catch (error) {
    console.error('Error creating communication:', error);
    res.status(500).json({ error: 'Failed to create communication' });
  }
});

// Get all communications
router.get('/', (req, res) => {
  try {
    const userId = 1;
    const { clientId, projectId, type, startDate, endDate } = req.query;

    let query = `
      SELECT c.*, cl.name as client_name, p.name as project_name
      FROM communications c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.user_id = ?
    `;
    const params = [userId];

    if (clientId) {
      query += ' AND c.client_id = ?';
      params.push(clientId);
    }

    if (projectId) {
      query += ' AND c.project_id = ?';
      params.push(projectId);
    }

    if (type) {
      query += ' AND c.type = ?';
      params.push(type);
    }

    if (startDate) {
      query += ' AND c.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND c.date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY c.date DESC, c.created_at DESC';

    const communications = db.prepare(query).all(...params);
    res.json(communications);
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Search communications
router.get('/search', (req, res) => {
  try {
    const userId = 1;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const communications = db.prepare(`
      SELECT c.*, cl.name as client_name, p.name as project_name
      FROM communications c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.user_id = ? AND (c.content LIKE ? OR c.subject LIKE ?)
      ORDER BY c.date DESC
    `).all(userId, `%${q}%`, `%${q}%`);

    res.json(communications);
  } catch (error) {
    console.error('Error searching communications:', error);
    res.status(500).json({ error: 'Failed to search communications' });
  }
});

// Get communication by ID
router.get('/:id', (req, res) => {
  try {
    const communication = db.prepare(`
      SELECT c.*, cl.name as client_name, p.name as project_name
      FROM communications c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!communication) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    res.json(communication);
  } catch (error) {
    console.error('Error fetching communication:', error);
    res.status(500).json({ error: 'Failed to fetch communication' });
  }
});

// Update communication
router.patch('/:id', (req, res) => {
  try {
    const { subject, content, type, direction, date, projectId } = req.body;

    const communication = db.prepare('SELECT * FROM communications WHERE id = ?').get(req.params.id);
    if (!communication) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    if (subject !== undefined) db.prepare('UPDATE communications SET subject = ? WHERE id = ?').run(subject, req.params.id);
    if (content !== undefined) db.prepare('UPDATE communications SET content = ? WHERE id = ?').run(content, req.params.id);
    if (type !== undefined) db.prepare('UPDATE communications SET type = ? WHERE id = ?').run(type, req.params.id);
    if (direction !== undefined) db.prepare('UPDATE communications SET direction = ? WHERE id = ?').run(direction, req.params.id);
    if (date !== undefined) db.prepare('UPDATE communications SET date = ? WHERE id = ?').run(date, req.params.id);
    if (projectId !== undefined) db.prepare('UPDATE communications SET project_id = ? WHERE id = ?').run(projectId, req.params.id);

    const updated = db.prepare('SELECT * FROM communications WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating communication:', error);
    res.status(500).json({ error: 'Failed to update communication' });
  }
});

// Delete communication
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM communications WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting communication:', error);
    res.status(500).json({ error: 'Failed to delete communication' });
  }
});

export default router;


import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Create time entry
router.post('/', (req, res) => {
  try {
    const { projectId, date, hours, description, billable } = req.body;

    if (!projectId || !date || !hours) {
      return res.status(400).json({ error: 'Project ID, date, and hours are required' });
    }

    const userId = 1;

    const stmt = db.prepare(`
      INSERT INTO time_entries (user_id, project_id, date, hours, description, billable, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      projectId,
      date,
      hours,
      description || '',
      billable !== undefined ? billable : true,
      new Date().toISOString()
    );

    const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(result.lastInsertRowid);
    res.json(entry);
  } catch (error) {
    console.error('Error creating time entry:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

// Get all time entries
router.get('/', (req, res) => {
  try {
    const userId = 1;
    const { projectId, startDate, endDate } = req.query;

    let query = `
      SELECT t.*, p.name as project_name, c.name as client_name
      FROM time_entries t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (projectId) {
      query += ' AND t.project_id = ?';
      params.push(projectId);
    }

    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const entries = db.prepare(query).all(...params);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// Get time entry by ID
router.get('/:id', (req, res) => {
  try {
    const entry = db.prepare(`
      SELECT t.*, p.name as project_name, c.name as client_name
      FROM time_entries t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching time entry:', error);
    res.status(500).json({ error: 'Failed to fetch time entry' });
  }
});

// Update time entry
router.patch('/:id', (req, res) => {
  try {
    const { date, hours, description, billable } = req.body;

    const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    if (date !== undefined) db.prepare('UPDATE time_entries SET date = ? WHERE id = ?').run(date, req.params.id);
    if (hours !== undefined) db.prepare('UPDATE time_entries SET hours = ? WHERE id = ?').run(hours, req.params.id);
    if (description !== undefined) db.prepare('UPDATE time_entries SET description = ? WHERE id = ?').run(description, req.params.id);
    if (billable !== undefined) db.prepare('UPDATE time_entries SET billable = ? WHERE id = ?').run(billable, req.params.id);

    const updated = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating time entry:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// Delete time entry
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM time_entries WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

// Get time summary
router.get('/summary/stats', (req, res) => {
  try {
    const userId = 1;
    const { projectId, startDate, endDate } = req.query;

    let query = 'SELECT * FROM time_entries WHERE user_id = ?';
    const params = [userId];

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    const entries = db.prepare(query).all(...params);
    
    const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);
    const billableHours = entries.filter(e => e.billable).reduce((sum, e) => sum + (e.hours || 0), 0);
    const nonBillableHours = totalHours - billableHours;

    // Group by project
    const byProject = {};
    entries.forEach(entry => {
      const projectId = entry.project_id;
      if (!byProject[projectId]) {
        byProject[projectId] = { projectId, hours: 0, billableHours: 0 };
      }
      byProject[projectId].hours += entry.hours || 0;
      if (entry.billable) {
        byProject[projectId].billableHours += entry.hours || 0;
      }
    });

    res.json({
      totalHours,
      billableHours,
      nonBillableHours,
      entryCount: entries.length,
      byProject: Object.values(byProject)
    });
  } catch (error) {
    console.error('Error fetching time summary:', error);
    res.status(500).json({ error: 'Failed to fetch time summary' });
  }
});

export default router;


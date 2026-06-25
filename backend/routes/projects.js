import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Create project
router.post('/', (req, res) => {
  try {
    const { clientId, name, description, startDate, endDate, budget, status, projectType } = req.body;

    if (!clientId || !name) {
      return res.status(400).json({ error: 'Client ID and name are required' });
    }

    const userId = 1; // MVP: default user

    const stmt = db.prepare(`
      INSERT INTO projects (user_id, client_id, name, description, start_date, end_date, budget, status, project_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      clientId,
      name,
      description || '',
      startDate || null,
      endDate || null,
      budget || 0,
      status || 'planning',
      projectType || 'other',
      new Date().toISOString()
    );

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get all projects
router.get('/', (req, res) => {
  try {
    const userId = 1;
    const projects = db.prepare(`
      SELECT p.*, c.name as client_name 
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(userId);

    // Attach milestones and time entries
    const projectsWithDetails = projects.map(project => {
      const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date').all(project.id);
      const timeEntries = db.prepare('SELECT * FROM time_entries WHERE project_id = ?').all(project.id);
      const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      
      return {
        ...project,
        milestones,
        totalHours,
        timeEntryCount: timeEntries.length
      };
    });

    res.json(projectsWithDetails);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', (req, res) => {
  try {
    const project = db.prepare(`
      SELECT p.*, c.name as client_name 
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date').all(req.params.id);
    const timeEntries = db.prepare('SELECT * FROM time_entries WHERE project_id = ? ORDER BY date DESC').all(req.params.id);
    const scopeChanges = db.prepare('SELECT * FROM scope_changes WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({
      ...project,
      milestones,
      timeEntries,
      scopeChanges
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
router.patch('/:id', (req, res) => {
  try {
    const { name, description, startDate, endDate, budget, status, projectType } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (startDate !== undefined) updates.start_date = startDate;
    if (endDate !== undefined) updates.end_date = endDate;
    if (budget !== undefined) updates.budget = budget;
    if (status !== undefined) updates.status = status;
    if (projectType !== undefined) updates.project_type = projectType;

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      const sqlKey = key === 'startDate' ? 'start_date' : key === 'endDate' ? 'end_date' : key === 'projectType' ? 'project_type' : key;
      db.prepare(`UPDATE projects SET ${sqlKey} = ? WHERE id = ?`).run(updates[key], req.params.id);
    });

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM milestones WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM time_entries WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM scope_changes WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Create milestone
router.post('/:id/milestones', (req, res) => {
  try {
    const { name, description, dueDate, status } = req.body;

    if (!name || !dueDate) {
      return res.status(400).json({ error: 'Name and due date are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO milestones (project_id, name, description, due_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.params.id,
      name,
      description || '',
      dueDate,
      status || 'pending',
      new Date().toISOString()
    );

    const milestone = db.prepare('SELECT * FROM milestones WHERE id = ?').get(result.lastInsertRowid);
    res.json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// Update milestone
router.patch('/milestones/:milestoneId', (req, res) => {
  try {
    const { name, description, dueDate, status } = req.body;

    const milestone = db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (name !== undefined) db.prepare('UPDATE milestones SET name = ? WHERE id = ?').run(name, req.params.milestoneId);
    if (description !== undefined) db.prepare('UPDATE milestones SET description = ? WHERE id = ?').run(description, req.params.milestoneId);
    if (dueDate !== undefined) db.prepare('UPDATE milestones SET due_date = ? WHERE id = ?').run(dueDate, req.params.milestoneId);
    if (status !== undefined) db.prepare('UPDATE milestones SET status = ? WHERE id = ?').run(status, req.params.milestoneId);

    const updated = db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.milestoneId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// Delete milestone
router.delete('/milestones/:milestoneId', (req, res) => {
  try {
    db.prepare('DELETE FROM milestones WHERE id = ?').run(req.params.milestoneId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

export default router;


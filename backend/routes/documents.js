import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Create document
router.post('/', (req, res) => {
  try {
    const { clientId, projectId, name, type, fileUrl, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const userId = 1;

    const stmt = db.prepare(`
      INSERT INTO documents (user_id, client_id, project_id, name, type, file_url, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      clientId || null,
      projectId || null,
      name,
      type,
      fileUrl || '',
      description || '',
      new Date().toISOString()
    );

    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
    res.json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Get all documents
router.get('/', (req, res) => {
  try {
    const userId = 1;
    const { clientId, projectId, type } = req.query;

    let query = `
      SELECT d.*, c.name as client_name, p.name as project_name
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.user_id = ?
    `;
    const params = [userId];

    if (clientId) {
      query += ' AND d.client_id = ?';
      params.push(clientId);
    }

    if (projectId) {
      query += ' AND d.project_id = ?';
      params.push(projectId);
    }

    if (type) {
      query += ' AND d.type = ?';
      params.push(type);
    }

    query += ' ORDER BY d.created_at DESC';

    const documents = db.prepare(query).all(...params);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document by ID
router.get('/:id', (req, res) => {
  try {
    const document = db.prepare(`
      SELECT d.*, c.name as client_name, p.name as project_name
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Update document
router.patch('/:id', (req, res) => {
  try {
    const { name, type, fileUrl, description, clientId, projectId } = req.body;

    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (name !== undefined) db.prepare('UPDATE documents SET name = ? WHERE id = ?').run(name, req.params.id);
    if (type !== undefined) db.prepare('UPDATE documents SET type = ? WHERE id = ?').run(type, req.params.id);
    if (fileUrl !== undefined) db.prepare('UPDATE documents SET file_url = ? WHERE id = ?').run(fileUrl, req.params.id);
    if (description !== undefined) db.prepare('UPDATE documents SET description = ? WHERE id = ?').run(description, req.params.id);
    if (clientId !== undefined) db.prepare('UPDATE documents SET client_id = ? WHERE id = ?').run(clientId, req.params.id);
    if (projectId !== undefined) db.prepare('UPDATE documents SET project_id = ? WHERE id = ?').run(projectId, req.params.id);

    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;


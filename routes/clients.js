import express from 'express';
import { calculateRiskScore } from '../services/riskScoring.js';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Create or update client with risk assessment
router.post('/', (req, res) => {
  try {
    let { name, email, notes, riskSignals } = req.body;

    // ---- Type Validation ----
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'Invalid name format' });
    }

    name = name.trim();
    email = typeof email === 'string' ? email.trim() : '';
    notes = typeof notes === 'string' ? notes.trim() : '';

    // ---- Name Validation ----
    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    if (!/[a-zA-Z]/.test(name)) {
      return res.status(400).json({ error: 'Name must contain letters' });
    }

    // ---- Email Validation ----
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // ---- Notes Validation ----
    if (notes && notes.length < 5) {
      return res.status(400).json({ error: 'Notes must be at least 5 characters' });
    }

    // ---- Risk Signals Validation ----
    if (riskSignals && !Array.isArray(riskSignals)) {
      return res.status(400).json({ error: 'Invalid risk signals format' });
    }

    if (riskSignals) {
      for (const signal of riskSignals) {
        if (!signal.type || typeof signal.type !== 'string') {
          return res.status(400).json({ error: 'Invalid risk signal structure' });
        }
      }
    }

    const userId = 1;

    // Calculate risk score
    const riskAssessment = calculateRiskScore(riskSignals || []);

    // Check existing client
    const existingClient = db
      .prepare('SELECT * FROM clients WHERE name = ? AND user_id = ?')
      .get(name, userId);

    let clientId;

    if (existingClient) {
      db.prepare(`
        UPDATE clients 
        SET risk_score = ?, risk_level = ?, notes = ?, email = ?
        WHERE id = ?
      `).run(
        riskAssessment.score,
        riskAssessment.level,
        notes,
        email,
        existingClient.id
      );

      clientId = existingClient.id;

      db.prepare('DELETE FROM risk_signals WHERE client_id = ?')
        .run(clientId);

    } else {
      const stmt = db.prepare(`
        INSERT INTO clients (user_id, name, email, risk_score, risk_level, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        userId,
        name,
        email,
        riskAssessment.score,
        riskAssessment.level,
        notes
      );

      clientId = result.lastInsertRowid;
    }

    // Insert risk signals
    if (riskSignals && riskSignals.length > 0) {
      const signalStmt = db.prepare(`
        INSERT INTO risk_signals (client_id, signal_type, description, weight)
        VALUES (?, ?, ?, ?)
      `);

      riskAssessment.explanations.forEach(explanation => {
        signalStmt.run(
          clientId,
          explanation.type,
          explanation.description,
          explanation.weight
        );
      });
    }

    const client = db.prepare('SELECT * FROM clients WHERE id = ?')
      .get(clientId);

    const signals = db.prepare('SELECT * FROM risk_signals WHERE client_id = ?')
      .all(clientId);

    res.json({
      ...client,
      riskAssessment,
      signals
    });

  } catch (error) {
    console.error('Error creating/updating client:', error);
    res.status(500).json({ error: 'Failed to save client' });
  }
});


// Get all clients
router.get('/', (req, res) => {
  try {
    const userId = 1; // MVP: default user
    const clients = db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    // Attach risk signals to each client
    const clientsWithSignals = clients.map(client => {
      const signals = db.prepare('SELECT * FROM risk_signals WHERE client_id = ?').all(client.id);
      return { ...client, signals };
    });

    res.json(clientsWithSignals);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client by ID
router.get('/:id', (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const signals = db.prepare('SELECT * FROM risk_signals WHERE client_id = ?').all(req.params.id);
    const riskAssessment = calculateRiskScore(signals.map(s => ({ type: s.signal_type, details: s.description })));

    res.json({
      ...client,
      signals,
      riskAssessment
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Delete client
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM risk_signals WHERE client_id = ?').run(req.params.id);
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;


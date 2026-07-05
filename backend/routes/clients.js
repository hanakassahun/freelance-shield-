import express from 'express';
import { calculateRiskScore } from '../services/riskScoring.js';
import { getDb, models, isOrmEnabled } from '../db/index.js';

const router = express.Router();
const db = getDb();
const { Client, RiskSignal } = models;

// Create or update client with risk assessment
router.post('/', async (req, res) => {
  try {
    const { name, email, notes, riskSignals } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const userId = 1; // MVP: default user

    // Calculate risk score
    const riskAssessment = calculateRiskScore(riskSignals || [], {
      upfrontDepositPaid: req.body.upfrontDepositPaid,
      depositPercent: req.body.depositPercent,
      communicationRiskLevel: req.body.communicationRiskLevel
    });

    let clientId;
    let clientRecord;

    if (isOrmEnabled()) {
      const existingClient = await Client.findOne({ where: { name, userId } });

      if (existingClient) {
        await Client.update(
          {
            riskScore: riskAssessment.score,
            riskLevel: riskAssessment.level,
            notes: notes || '',
            email: email || ''
          },
          { where: { id: existingClient.id } }
        );
        clientId = existingClient.id;
        await RiskSignal.destroy({ where: { clientId } });
      } else {
        const created = await Client.create({
          userId,
          name,
          email: email || '',
          riskScore: riskAssessment.score,
          riskLevel: riskAssessment.level,
          notes: notes || ''
        });
        clientId = created.id;
      }

      if (riskSignals && riskSignals.length > 0) {
        await RiskSignal.bulkCreate(
          riskAssessment.explanations.map(explanation => ({
            clientId,
            signalType: explanation.type,
            description: explanation.description,
            weight: explanation.weight
          }))
        );
      }

      clientRecord = await Client.findByPk(clientId, { include: RiskSignal });
      const signals = clientRecord.RiskSignals || [];

      res.json({
        ...clientRecord.toJSON(),
        riskAssessment,
        signals
      });
    } else {
      const existingClient = db.prepare('SELECT * FROM clients WHERE name = ? AND user_id = ?').get(name, userId);

      if (existingClient) {
        db.prepare(`
          UPDATE clients 
          SET risk_score = ?, risk_level = ?, notes = ?, email = ?
          WHERE id = ?
        `).run(riskAssessment.score, riskAssessment.level, notes || '', email || '', existingClient.id);
        clientId = existingClient.id;

        db.prepare('DELETE FROM risk_signals WHERE client_id = ?').run(clientId);
      } else {
        const stmt = db.prepare(`
          INSERT INTO clients (user_id, name, email, risk_score, risk_level, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(userId, name, email || '', riskAssessment.score, riskAssessment.level, notes || '');
        clientId = result.lastInsertRowid;
      }

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

      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
      const signals = db.prepare('SELECT * FROM risk_signals WHERE client_id = ?').all(clientId);

      res.json({
        ...client,
        riskAssessment,
        signals
      });
    }
  } catch (error) {
    console.error('Error creating/updating client:', error);
    res.status(500).json({ error: 'Failed to save client' });
  }
});

// Get all clients
router.get('/', async (req, res) => {
  try {
    const userId = 1; // MVP: default user

    if (isOrmEnabled()) {
      const clients = await Client.findAll({
        where: { userId },
        include: RiskSignal,
        order: [['createdAt', 'DESC']]
      });

      return res.json(clients.map(client => ({
        ...client.toJSON(),
        signals: client.RiskSignals || []
      })));
    }

    const clients = db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    
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
router.get('/:id', async (req, res) => {
  try {
    if (isOrmEnabled()) {
      const client = await Client.findByPk(req.params.id, { include: RiskSignal });
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const signals = client.RiskSignals || [];
      const riskAssessment = calculateRiskScore(
        signals.map(signal => ({ type: signal.signalType, details: signal.description }))
      );

      return res.json({
        ...client.toJSON(),
        signals,
        riskAssessment
      });
    }

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
router.delete('/:id', async (req, res) => {
  try {
    if (isOrmEnabled()) {
      await RiskSignal.destroy({ where: { clientId: req.params.id } });
      await Client.destroy({ where: { id: req.params.id } });
      return res.json({ success: true });
    }

    db.prepare('DELETE FROM risk_signals WHERE client_id = ?').run(req.params.id);
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;


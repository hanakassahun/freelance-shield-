import express from 'express';
import { generateContract } from '../services/contractGenerator.js';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Generate contract
router.post('/generate', (req, res) => {
  try {
    let {
      projectType,
      pricingModel,
      paymentSchedule,
      revisionLimit,
      clientName,
      projectDescription
    } = req.body;

    // ---- Basic Required Validation ----
    if (!projectType || !pricingModel || !paymentSchedule) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ---- Type & Format Validation ----
    if (typeof projectType !== 'string' ||
      typeof pricingModel !== 'string' ||
      typeof paymentSchedule !== 'string') {
      return res.status(400).json({ error: 'Invalid field types' });
    }

    // ---- Sanitize Strings ----
    clientName = typeof clientName === 'string' ? clientName.trim() : '';
    projectDescription = typeof projectDescription === 'string'
      ? projectDescription.trim()
      : '';

    // ---- Business Validation ----
    if (!clientName || clientName.length < 2 || !/[a-zA-Z]/.test(clientName)) {
      return res.status(400).json({
        error: 'Client name must be at least 2 characters and contain letters'
      });
    }

    if (!projectDescription ||
      projectDescription.length < 10 ||
      !/[a-zA-Z]/.test(projectDescription)) {
      return res.status(400).json({
        error: 'Project description must be meaningful (min 10 characters)'
      });
    }

    // ---- Revision Limit Validation ----
    revisionLimit = parseInt(revisionLimit);

    if (isNaN(revisionLimit) || revisionLimit < 0 || revisionLimit > 20) {
      return res.status(400).json({
        error: 'Revision limit must be between 0 and 20'
      });
    }

    // ---- Generate Contract ----
    const contract = generateContract({
      projectType,
      pricingModel,
      paymentSchedule,
      revisionLimit,
      clientName,
      projectDescription
    });

    // ---- Save to DB (Optional) ----
    const userId = 1;
    const clientId = req.body.clientId || null;

    if (clientId) {
      const stmt = db.prepare(`
        INSERT INTO contracts 
        (user_id, client_id, project_type, pricing_model, payment_schedule, revision_limit, content)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        userId,
        clientId,
        projectType,
        pricingModel,
        paymentSchedule,
        revisionLimit,
        contract
      );

      contract.id = result.lastInsertRowid;
    }

    res.json({ contract, success: true });

  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({ error: 'Failed to generate contract' });
  }
});


// Get all contracts
router.get('/', (req, res) => {
  try {
    const contracts = db.prepare('SELECT * FROM contracts ORDER BY created_at DESC').all();
    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Get contract by ID
router.get('/:id', (req, res) => {
  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

export default router;


import express from 'express';
import { generateContract, createContractPdfBuffer } from '../services/contractGenerator.js';
import { getDb, models, isOrmEnabled } from '../db/index.js';

const router = express.Router();
const db = getDb();
const { Contract } = models;

// Generate contract
router.post('/generate', async (req, res) => {
  try {
    const {
      projectType,
      pricingModel,
      paymentSchedule,
      revisionLimit,
      clientName,
      projectDescription
    } = req.body;

    // Validate inputs
    if (!projectType || !pricingModel || !paymentSchedule) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contract = generateContract({
      projectType,
      pricingModel,
      paymentSchedule,
      revisionLimit: revisionLimit || 2,
      clientName: clientName || 'Client',
      projectDescription: projectDescription || 'Project work'
    });

    // Optionally save to database
    const userId = 1; // For MVP, use default user
    const clientId = req.body.clientId || null;

    if (clientId) {
      if (isOrmEnabled()) {
        const created = await Contract.create({
          userId,
          clientId,
          projectType,
          pricingModel,
          paymentSchedule,
          revisionLimit: revisionLimit || 2,
          content: contract
        });
        contract.id = created.id;
      } else {
        const stmt = db.prepare(`
          INSERT INTO contracts (user_id, client_id, project_type, pricing_model, payment_schedule, revision_limit, content)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(userId, clientId, projectType, pricingModel, paymentSchedule, revisionLimit || 2, contract);
        contract.id = result.lastInsertRowid;
      }
    }

    res.json({ contract, success: true });
  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({ error: 'Failed to generate contract' });
  }
});

// Generate contract PDF
router.post('/generate-pdf', async (req, res) => {
  try {
    const {
      contract: existingContract,
      projectType,
      pricingModel,
      paymentSchedule,
      revisionLimit,
      clientName,
      projectDescription
    } = req.body;

    let contract = existingContract;

    if (!contract) {
      if (!projectType || !pricingModel || !paymentSchedule) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      contract = generateContract({
        projectType,
        pricingModel,
        paymentSchedule,
        revisionLimit: revisionLimit || 2,
        clientName: clientName || 'Client',
        projectDescription: projectDescription || 'Project work'
      });
    }

    const pdfBuffer = await createContractPdfBuffer(contract);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contract.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Contract PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate contract PDF' });
  }
});

// Get all contracts
router.get('/', async (req, res) => {
  try {
    if (isOrmEnabled()) {
      const contracts = await Contract.findAll({ order: [['createdAt', 'DESC']] });
      return res.json(contracts);
    }

    const contracts = db.prepare('SELECT * FROM contracts ORDER BY created_at DESC').all();
    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Get contract by ID
router.get('/:id', async (req, res) => {
  try {
    if (isOrmEnabled()) {
      const contract = await Contract.findByPk(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      return res.json(contract);
    }

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


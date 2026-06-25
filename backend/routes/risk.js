import express from 'express';
import { getRiskSignals } from '../services/riskScoring.js';
import { detectRedFlags } from '../services/redFlagDetector.js';

const router = express.Router();

// Get available risk signals
router.get('/signals', (req, res) => {
  try {
    const signals = getRiskSignals();
    res.json(signals);
  } catch (error) {
    console.error('Error fetching risk signals:', error);
    res.status(500).json({ error: 'Failed to fetch risk signals' });
  }
});

// Detect red flags in text
router.post('/detect', (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const redFlags = detectRedFlags(text);
    res.json({ redFlags, count: redFlags.length });
  } catch (error) {
    console.error('Error detecting red flags:', error);
    res.status(500).json({ error: 'Failed to detect red flags' });
  }
});

export default router;

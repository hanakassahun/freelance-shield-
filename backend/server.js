import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import contractRoutes from './routes/contracts.js';
import clientRoutes from './routes/clients.js';
import invoiceRoutes from './routes/invoices.js';
import riskRoutes from './routes/risk.js';
import projectRoutes from './routes/projects.js';
import timeTrackingRoutes from './routes/timeTracking.js';
import expenseRoutes from './routes/expenses.js';
import documentRoutes from './routes/documents.js';
import communicationRoutes from './routes/communications.js';
import recurringInvoiceRoutes from './routes/recurringInvoices.js';
import scopeChangeRoutes from './routes/scopeChanges.js';
import onboardingRoutes from './routes/onboarding.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database (async for sql.js, sync for JSON)
initDatabase();

// Routes
app.use('/api/contracts', contractRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/recurring-invoices', recurringInvoiceRoutes);
app.use('/api/scope-changes', scopeChangeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Freelance Shield API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


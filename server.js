import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import contractRoutes from './routes/contracts.js';
import clientRoutes from './routes/clients.js';
import invoiceRoutes from './routes/invoices.js';
import riskRoutes from './routes/risk.js';

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Freelance Shield API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


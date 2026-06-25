import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();
const db = getDb();

// Get payment analytics
router.get('/payments', (req, res) => {
  try {
    const userId = 1;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT i.*, c.name as client_name, c.id as client_id
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = ?
    `;
    const params = [userId];

    if (startDate) {
      query += ' AND i.due_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND i.due_date <= ?';
      params.push(endDate);
    }

    const invoices = db.prepare(query).all(...params);

    // Calculate payment statistics
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    const overdueInvoices = invoices.filter(inv => {
      const dueDate = new Date(inv.due_date);
      const today = new Date();
      return dueDate < today && inv.status === 'pending';
    });

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    // Payment patterns by client
    const clientPayments = {};
    paidInvoices.forEach(inv => {
      const clientId = inv.client_id;
      if (clientId) {
        if (!clientPayments[clientId]) {
          clientPayments[clientId] = {
            clientId,
            clientName: inv.client_name,
            totalPaid: 0,
            invoiceCount: 0,
            averageDaysToPay: 0,
            paymentDates: []
          };
        }
        clientPayments[clientId].totalPaid += parseFloat(inv.amount) || 0;
        clientPayments[clientId].invoiceCount += 1;
        if (inv.paid_date) {
          const dueDate = new Date(inv.due_date);
          const paidDate = new Date(inv.paid_date);
          const daysToPay = Math.floor((paidDate - dueDate) / (1000 * 60 * 60 * 24));
          clientPayments[clientId].paymentDates.push(daysToPay);
        }
      }
    });

    // Calculate average days to pay per client
    Object.keys(clientPayments).forEach(clientId => {
      const client = clientPayments[clientId];
      if (client.paymentDates.length > 0) {
        client.averageDaysToPay = Math.round(
          client.paymentDates.reduce((sum, days) => sum + days, 0) / client.paymentDates.length
        );
      }
    });

    // Monthly revenue trend
    const monthlyRevenue = {};
    paidInvoices.forEach(inv => {
      if (inv.paid_date) {
        const date = new Date(inv.paid_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyRevenue[monthKey]) {
          monthlyRevenue[monthKey] = { month: monthKey, revenue: 0, count: 0 };
        }
        monthlyRevenue[monthKey].revenue += parseFloat(inv.amount) || 0;
        monthlyRevenue[monthKey].count += 1;
      }
    });

    res.json({
      totalRevenue,
      pendingAmount,
      overdueAmount,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
      clientPayments: Object.values(clientPayments),
      monthlyRevenue: Object.values(monthlyRevenue).sort((a, b) => a.month.localeCompare(b.month))
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
});

// Get client relationship health scores
router.get('/client-health', (req, res) => {
  try {
    const userId = 1;
    const clients = db.prepare('SELECT * FROM clients WHERE user_id = ?').all(userId);

    const healthScores = clients.map(client => {
      // Get payment history
      const invoices = db.prepare('SELECT * FROM invoices WHERE client_id = ?').all(client.id);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const overdueInvoices = invoices.filter(inv => {
        const dueDate = new Date(inv.due_date);
        const today = new Date();
        return dueDate < today && inv.status === 'pending';
      });

      // Get communication count
      const communications = db.prepare('SELECT * FROM communications WHERE client_id = ?').all(client.id);
      const recentCommunications = communications.filter(comm => {
        const commDate = new Date(comm.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return commDate >= thirtyDaysAgo;
      });

      // Get projects
      const projects = db.prepare('SELECT * FROM projects WHERE client_id = ?').all(client.id);
      const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress');

      // Calculate health score (0-100)
      let healthScore = 50; // Base score

      // Payment factors
      if (paidInvoices.length > 0) {
        const onTimeRate = paidInvoices.filter(inv => {
          if (!inv.paid_date) return false;
          const paidDate = new Date(inv.paid_date);
          const dueDate = new Date(inv.due_date);
          return paidDate <= dueDate;
        }).length / paidInvoices.length;
        healthScore += onTimeRate * 20; // Up to +20 for good payment
      }

      if (overdueInvoices.length > 0) {
        healthScore -= overdueInvoices.length * 10; // -10 per overdue
      }

      // Communication factors
      if (recentCommunications.length > 0) {
        healthScore += Math.min(recentCommunications.length * 2, 15); // Up to +15 for active communication
      }

      // Project factors
      if (projects.length > 0) {
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        healthScore += (completedProjects / projects.length) * 10; // Up to +10 for completion rate
      }

      // Risk score factors
      if (client.risk_score) {
        healthScore -= client.risk_score * 0.3; // Subtract risk impact
      }

      // Cap between 0 and 100
      healthScore = Math.max(0, Math.min(100, healthScore));

      let healthLevel = 'good';
      if (healthScore < 40) healthLevel = 'poor';
      else if (healthScore < 70) healthLevel = 'fair';

      return {
        clientId: client.id,
        clientName: client.name,
        healthScore: Math.round(healthScore),
        healthLevel,
        paidInvoices: paidInvoices.length,
        overdueInvoices: overdueInvoices.length,
        activeProjects: activeProjects.length,
        recentCommunications: recentCommunications.length
      };
    });

    res.json(healthScores.sort((a, b) => b.healthScore - a.healthScore));
  } catch (error) {
    console.error('Error fetching client health scores:', error);
    res.status(500).json({ error: 'Failed to fetch client health scores' });
  }
});

// Get overall dashboard stats
router.get('/dashboard', (req, res) => {
  try {
    const userId = 1;

    const clients = db.prepare('SELECT * FROM clients WHERE user_id = ?').all(userId);
    const invoices = db.prepare('SELECT * FROM invoices WHERE user_id = ?').all(userId);
    const projects = db.prepare('SELECT * FROM projects WHERE user_id = ?').all(userId);
    const contracts = db.prepare('SELECT * FROM contracts WHERE user_id = ?').all(userId);

    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress');
    const overdueInvoices = invoices.filter(inv => {
      const dueDate = new Date(inv.due_date);
      const today = new Date();
      return dueDate < today && inv.status === 'pending';
    });

    const highRiskClients = clients.filter(c => c.risk_level === 'high' || (c.risk_score && c.risk_score >= 70));

    res.json({
      totalClients: clients.length,
      totalInvoices: invoices.length,
      totalProjects: projects.length,
      totalContracts: contracts.length,
      totalRevenue,
      activeProjects: activeProjects.length,
      overdueInvoices: overdueInvoices.length,
      highRiskClients: highRiskClients.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;


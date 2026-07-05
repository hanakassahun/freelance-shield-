import { initDatabase, models } from './db/index.js';
import sequelize from './db/orm.js';

async function seed() {
  await sequelize.sync({ force: true });
  console.log('✅ Database schema reset');

  const { User, Client, Invoice, RiskSignal } = models;

  const user = await User.create({ name: 'Demo User', email: 'demo@freelanceshield.com' });

  const clients = await Promise.all([
    Client.create({
      userId: user.id,
      name: 'Maple Creative',
      email: 'hello@maplecreative.com',
      riskScore: 78,
      riskLevel: 'high',
      notes: 'Pushes work without signed agreement and often asks for free samples.'
    }),
    Client.create({
      userId: user.id,
      name: 'Bright Beacon Media',
      email: 'accounts@brightbeacon.com',
      riskScore: 54,
      riskLevel: 'medium',
      notes: 'Delayed payment history and vague scope requirements.'
    }),
    Client.create({
      userId: user.id,
      name: 'North Star Ventures',
      email: 'info@northstarventures.com',
      riskScore: 32,
      riskLevel: 'low',
      notes: 'Paid deposits reliably and has professional communication.'
    })
  ]);

  const [maple, bright, northStar] = clients;

  const invoices = [
    { client: maple, daysPastDue: 15, amount: 4100, description: 'Website redesign retainer', status: 'overdue' },
    { client: maple, daysPastDue: 8, amount: 2200, description: 'UX audit and wireframes', status: 'overdue' },
    { client: bright, daysPastDue: 20, amount: 7800, description: 'Marketing landing page build', status: 'overdue' },
    { client: bright, daysPastDue: 10, amount: 1425, description: 'Brand refresh strategy session', status: 'overdue' },
    { client: northStar, daysPastDue: 12, amount: 3300, description: 'Platform integration work', status: 'overdue' }
  ];

  const invoicePromises = invoices.map(({ client, daysPastDue, amount, description, status }, index) => {
    const dueDate = new Date(Date.now() - daysPastDue * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    return Invoice.create({
      userId: user.id,
      clientId: client.id,
      invoiceNumber: `INV-100${index + 1}`,
      amount,
      currency: 'USD',
      dueDate,
      description,
      status
    });
  });

  await Promise.all(invoicePromises);

  const signals = [
    { client: maple, type: 'requests_unpaid_work', weight: 30, description: 'Asked for unpaid trial work.' },
    { client: maple, type: 'avoids_contract_discussion', weight: 25, description: 'Avoided contract discussion until last minute.' },
    { client: maple, type: 'communication_issues', weight: 10, description: 'Late replies and inconsistent expectations.' },
    { client: bright, type: 'delayed_replies', weight: 15, description: 'Responses regularly take multiple days.' },
    { client: bright, type: 'payment_avoidance', weight: 25, description: 'Avoids payment terms until after delivery.' },
    { client: bright, type: 'scope_creep_history', weight: 15, description: 'Requests keep expanding without budget updates.' },
    { client: northStar, type: 'vague_scope', weight: 20, description: 'Project goals are still broad and shifting.' }
  ];

  await Promise.all(signals.map(signal => {
    return RiskSignal.create({
      clientId: signal.client.id,
      signalType: signal.type,
      description: signal.description,
      weight: signal.weight
    });
  }));

  console.log('✅ Seeded 3 clients, 5 overdue invoices, and risk signals');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

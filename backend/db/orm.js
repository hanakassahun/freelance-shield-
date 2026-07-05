import dotenv from 'dotenv';
import { Sequelize, DataTypes } from 'sequelize';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'sqlite:./dev.db';
const sequelize = new Sequelize(databaseUrl, {
  logging: false,
});

export const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: false
});

export const Client = sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  riskScore: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  riskLevel: { type: DataTypes.STRING, allowNull: true, defaultValue: 'low' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'clients',
  underscored: true,
  timestamps: false
});

export const Contract = sequelize.define('Contract', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  clientId: { type: DataTypes.INTEGER, allowNull: true },
  projectType: { type: DataTypes.STRING, allowNull: false },
  pricingModel: { type: DataTypes.STRING, allowNull: false },
  paymentSchedule: { type: DataTypes.STRING, allowNull: false },
  revisionLimit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  content: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'contracts',
  underscored: true,
  timestamps: false
});

export const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  clientId: { type: DataTypes.INTEGER, allowNull: false },
  invoiceNumber: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  paidDate: { type: DataTypes.DATE, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  escalationStage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'invoices',
  underscored: true,
  timestamps: false
});

export const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  clientId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  startDate: { type: DataTypes.DATE, allowNull: true },
  endDate: { type: DataTypes.DATE, allowNull: true },
  budget: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'planning' },
  projectType: { type: DataTypes.STRING, allowNull: false, defaultValue: 'other' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'projects',
  underscored: true,
  timestamps: false
});

export const Milestone = sequelize.define('Milestone', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'milestones',
  underscored: true,
  timestamps: false
});

export const TimeEntry = sequelize.define('TimeEntry', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  hours: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  description: { type: DataTypes.TEXT, allowNull: true },
  billable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'time_entries',
  underscored: true,
  timestamps: false
});

export const ScopeChange = sequelize.define('ScopeChange', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  additionalCost: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
  status: { type: DataTypes.STRING, allowNull: true },
  approvedDate: { type: DataTypes.DATE, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'scope_changes',
  underscored: true,
  timestamps: false
});

export const RiskSignal = sequelize.define('RiskSignal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clientId: { type: DataTypes.INTEGER, allowNull: false },
  signalType: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true },
  weight: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'risk_signals',
  underscored: true,
  timestamps: false
});

Contract.belongsTo(Client, { foreignKey: 'clientId' });
Client.hasMany(Contract, { foreignKey: 'clientId' });

Invoice.belongsTo(Client, { foreignKey: 'clientId' });
Client.hasMany(Invoice, { foreignKey: 'clientId' });

RiskSignal.belongsTo(Client, { foreignKey: 'clientId' });
Client.hasMany(RiskSignal, { foreignKey: 'clientId' });

export default sequelize;

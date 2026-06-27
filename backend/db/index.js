import dotenv from 'dotenv';
import { initDatabase as initJsonDatabase, getDb as getJsonDb } from './database.js';
import sequelize, { Contract, Client, User, Invoice, RiskSignal, Project, Milestone, TimeEntry, ScopeChange } from './orm.js';

dotenv.config();

const useOrm = true;

export async function initDatabase() {
  if (useOrm) {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Sequelize ORM database initialized using', process.env.DATABASE_URL || 'sqlite:./dev.db');
    return sequelize;
  }

  return initJsonDatabase();
}

export function getDb() {
  if (useOrm) {
    return sequelize;
  }
  return getJsonDb();
}

export const models = {
  User,
  Client,
  Contract,
  Invoice,
  RiskSignal,
  Project,
  Milestone,
  TimeEntry,
  ScopeChange
};

export function isOrmEnabled() {
  return useOrm;
}

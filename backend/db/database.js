import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data.json');

let data = {
  users: [],
  clients: [],
  contracts: [],
  invoices: [],
  risk_signals: [],
  projects: [],
  milestones: [],
  time_entries: [],
  expenses: [],
  documents: [],
  communications: [],
  recurring_invoices: [],
  scope_changes: [],
  onboarding_checklists: [],
  checklist_items: []
};

// Load data from file
function loadData() {
  if (existsSync(dbPath)) {
    try {
      const fileData = readFileSync(dbPath, 'utf8');
      data = JSON.parse(fileData);
    } catch (error) {
      console.error('Error loading database:', error);
      data = { 
        users: [], 
        clients: [], 
        contracts: [], 
        invoices: [], 
        risk_signals: [],
        projects: [],
        milestones: [],
        time_entries: [],
        expenses: [],
        documents: [],
        communications: [],
        recurring_invoices: [],
        scope_changes: [],
        onboarding_checklists: [],
        checklist_items: []
      };
    }
  }
}

// Save data to file
function saveData() {
  try {
    writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Database wrapper that mimics better-sqlite3 API
class Database {
  constructor() {
    // Use a getter to always get fresh data
  }

  get data() {
    return data;
  }

  prepare(sql) {
    return new Statement(sql);
  }

  exec(sql) {
    // For compatibility, but we don't really need this
    return this;
  }
}

class Statement {
  constructor(sql) {
    this.sql = sql;
  }
  
  get data() {
    return data;
  }

  run(...params) {
    const sql = this.sql.trim().toUpperCase();
    
    if (sql.startsWith('INSERT INTO')) {
      return this._insert(sql, params);
    } else if (sql.startsWith('UPDATE')) {
      return this._update(sql, params);
    } else if (sql.startsWith('DELETE')) {
      return this._delete(sql, params);
    }
    
    return { lastInsertRowid: null, changes: 0 };
  }

  get(...params) {
    const results = this.all(...params);
    return results.length > 0 ? results[0] : null;
  }

  all(...params) {
    const sql = this.sql.trim().toUpperCase();
    
    if (sql.startsWith('SELECT')) {
      return this._select(sql, params);
    }
    
    return [];
  }

  _insert(sql, params) {
    const tableMatch = sql.match(/INSERT INTO\s+(\w+)/i);
    if (!tableMatch) return { lastInsertRowid: null, changes: 0 };
    
    const table = tableMatch[1];
    const columnsMatch = sql.match(/\(([^)]+)\)/);
    const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/);
    
    if (!columnsMatch || !valuesMatch) return { lastInsertRowid: null, changes: 0 };
    
    const columns = columnsMatch[1].split(',').map(c => c.trim());
    const record = {};
    
    columns.forEach((col, idx) => {
      if (params[idx] !== undefined) {
        record[col] = params[idx];
      }
    });
    
    // Generate ID
    const maxId = this.data[table]?.length > 0 
      ? Math.max(...this.data[table].map(r => r.id || 0))
      : 0;
    record.id = maxId + 1;
    
    // Add timestamp if column exists
    if (sql.includes('created_at')) {
      record.created_at = new Date().toISOString();
    }
    
    if (!this.data[table]) this.data[table] = [];
    this.data[table].push(record);
    saveData();
    
    return { lastInsertRowid: record.id, changes: 1 };
  }

  _update(sql, params) {
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
    const whereMatch = sql.match(/WHERE\s+(.+)/i);
    
    if (!tableMatch) return { changes: 0 };
    
    const table = tableMatch[1];
    if (!this.data[table]) return { changes: 0 };
    
    const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|$)/i);
    if (!setMatch) return { changes: 0 };
    
    const setClause = setMatch[1];
    const updates = {};
    const setParts = setClause.split(',').map(s => s.trim());
    
    let paramIdx = 0;
    setParts.forEach(part => {
      const [col] = part.split('=').map(s => s.trim());
      if (col && params[paramIdx] !== undefined) {
        updates[col] = params[paramIdx++];
      }
    });
    
    let changes = 0;
    this.data[table] = this.data[table].map(record => {
      if (this._matchesWhere(record, whereMatch ? whereMatch[1] : null, params.slice(paramIdx))) {
        changes++;
        return { ...record, ...updates };
      }
      return record;
    });
    
    saveData();
    return { changes };
  }

  _delete(sql, params) {
    const tableMatch = sql.match(/DELETE FROM\s+(\w+)/i);
    const whereMatch = sql.match(/WHERE\s+(.+)/i);
    
    if (!tableMatch) return { changes: 0 };
    
    const table = tableMatch[1];
    if (!this.data[table]) return { changes: 0 };
    
    const originalLength = this.data[table].length;
    this.data[table] = this.data[table].filter(record => 
      !this._matchesWhere(record, whereMatch ? whereMatch[1] : null, params)
    );
    
    const changes = originalLength - this.data[table].length;
    saveData();
    return { changes };
  }

  _select(sql, params) {
    // Extract main table (handle aliases like "p" or "i")
    const fromMatch = sql.match(/FROM\s+(\w+)(?:\s+(\w+))?/i);
    if (!fromMatch) return [];
    
    const table = fromMatch[1];
    const tableAlias = fromMatch[2] || table;
    
    if (!this.data[table]) return [];
    
    let results = [...this.data[table]];
    
    // Handle WHERE clause - improved to handle JOIN conditions
    // Extract WHERE clause, but exclude JOIN conditions
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|$)/i);
    if (whereMatch) {
      let whereClause = whereMatch[1];
      // Remove JOIN conditions (they're handled in JOIN section)
      // JOIN conditions typically have format like "i.client_id = c.id"
      whereClause = whereClause.replace(/\w+\.\w+\s*=\s*\w+\.\w+/gi, '');
      whereClause = whereClause.replace(/\s*AND\s*AND/gi, ' AND').trim();
      
      if (whereClause) {
        results = results.filter(record => 
          this._matchesWhere(record, whereClause, params)
        );
      }
    }
    
    // Handle JOIN (simple LEFT JOIN support)
    const joinMatch = sql.match(/LEFT JOIN\s+(\w+)\s+(\w+)\s+ON\s+([^\s=]+)\s*=\s*([^\s]+)/i);
    if (joinMatch) {
      const joinTable = joinMatch[1];
      const joinAlias = joinMatch[2];
      const leftCondition = joinMatch[3].trim();
      const rightCondition = joinMatch[4].trim();
      
      // Extract column names from conditions (handle table.column format)
      const leftParts = leftCondition.split('.');
      const rightParts = rightCondition.split('.');
      
      const leftCol = leftParts.length > 1 ? leftParts[1] : leftParts[0];
      const rightCol = rightParts.length > 1 ? rightParts[1] : rightParts[0];
      const leftTableAlias = leftParts.length > 1 ? leftParts[0] : null;
      const rightTableAlias = rightParts.length > 1 ? rightParts[0] : null;
      
      // Determine which side references the main table and which references the join table
      const mainTableRef = (leftTableAlias === tableAlias) ? leftCol : 
                          (rightTableAlias === tableAlias) ? rightCol : null;
      const joinTableRef = (leftTableAlias === joinAlias) ? leftCol :
                          (rightTableAlias === joinAlias) ? rightCol : 'id';
      
      results = results.map(record => {
        const joinKey = mainTableRef ? record[mainTableRef] : record[rightCol] || record[leftCol];
        const joinRecord = (this.data[joinTable] || []).find(r => {
          const matchKey = r[joinTableRef] || r.id;
          return matchKey === joinKey;
        });
        
        if (joinRecord) {
          // Add joined table data - use the name field directly
          return { 
            ...record, 
            [`${joinAlias}_name`]: joinRecord.name || joinRecord[joinAlias] || ''
          };
        }
        return record;
      });
    }
    
    // Handle ORDER BY - improved to handle table.column format
    const orderMatch = sql.match(/ORDER BY\s+(\w+(?:\.\w+)?)\s+(ASC|DESC)?/i);
    if (orderMatch) {
      const orderCol = orderMatch[1].split('.').pop();
      const orderDir = (orderMatch[2] || 'ASC').toUpperCase();
      
      results.sort((a, b) => {
        const aVal = a[orderCol];
        const bVal = b[orderCol];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (orderDir === 'DESC') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });
    }
    
    return results;
  }

  _matchesWhere(record, whereClause, params) {
    if (!whereClause) return true;
    
    // Simple WHERE support: column = ? AND column = ?
    const conditions = whereClause.split(/AND|OR/).map(c => c.trim()).filter(c => c);
    let paramIdx = 0;
    
    return conditions.every(condition => {
      // Handle column = ? pattern
      const match = condition.match(/(\w+(?:\.\w+)?)\s*=\s*\?/);
      if (match) {
        const col = match[1].split('.').pop();
        if (paramIdx < params.length) {
          const value = params[paramIdx++];
          return record[col] === value;
        }
      }
      
      // Handle column = value (without ?)
      const directMatch = condition.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
      if (directMatch) {
        const col = directMatch[1];
        const value = directMatch[2];
        return String(record[col]) === String(value);
      }
      
      return true;
    });
  }
}

let db = null;

export function initDatabase() {
  loadData();
  db = new Database();
  console.log('✅ Database initialized');
  return db;
}

export function getDb() {
  if (!db) {
    loadData();
    db = new Database();
  }
  return db;
}

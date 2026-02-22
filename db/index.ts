import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'app_v4.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize Tables
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT,
      category TEXT,
      unit TEXT,
      costPerUnit REAL DEFAULT 0,
      exitPrice REAL DEFAULT 0,
      stockQuantity REAL DEFAULT 0,
      minStock REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT,
      description TEXT,
      price REAL DEFAULT 0,
      category TEXT,
      ingredients TEXT, -- JSON
      complements TEXT, -- JSON
      addOns TEXT -- JSON
    );

    CREATE TABLE IF NOT EXISTS revenues (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT,
      amount REAL DEFAULT 0,
      description TEXT,
      category TEXT,
      paymentMethod TEXT,
      isRecurring INTEGER DEFAULT 0, -- Boolean
      status TEXT DEFAULT 'paid'
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT,
      amount REAL DEFAULT 0,
      description TEXT,
      category TEXT,
      paymentMethod TEXT,
      isRecurring INTEGER DEFAULT 0, -- Boolean
      status TEXT DEFAULT 'paid',
      employeeId TEXT,
      paidDate TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      ingredientId TEXT,
      type TEXT,
      quantity REAL DEFAULT 0,
      date TEXT,
      reason TEXT,
      cost REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT,
      role TEXT,
      salary REAL DEFAULT 0,
      admissionDate TEXT,
      active INTEGER DEFAULT 1, -- Boolean
      phone TEXT,
      address TEXT,
      pixKey TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      address TEXT,
      reference TEXT,
      lastOrderDate TEXT,
      totalOrders INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT,
      customerName TEXT,
      customerPhone TEXT,
      address TEXT,
      reference TEXT,
      items TEXT, -- JSON
      totalAmount REAL DEFAULT 0,
      paymentMethod TEXT,
      deliveryType TEXT,
      status TEXT,
      changeFor REAL
    );
  `);
  console.log('Database initialized');
}

export default db;

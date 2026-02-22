import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'app.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize Tables
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      costPerUnit REAL NOT NULL,
      exitPrice REAL NOT NULL,
      stockQuantity REAL NOT NULL,
      minStock REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      ingredients TEXT NOT NULL, -- JSON
      complements TEXT -- JSON
    );

    CREATE TABLE IF NOT EXISTS revenues (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      isRecurring INTEGER DEFAULT 0, -- Boolean
      status TEXT DEFAULT 'paid'
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      isRecurring INTEGER DEFAULT 0, -- Boolean
      status TEXT DEFAULT 'paid'
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      ingredientId TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      date TEXT NOT NULL,
      reason TEXT,
      cost REAL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      salary REAL NOT NULL,
      admissionDate TEXT NOT NULL,
      active INTEGER DEFAULT 1, -- Boolean
      phone TEXT,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      reference TEXT,
      lastOrderDate TEXT,
      totalOrders INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerPhone TEXT,
      address TEXT,
      reference TEXT,
      items TEXT NOT NULL, -- JSON
      totalAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      deliveryType TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);
  console.log('Database initialized');
}

export default db;

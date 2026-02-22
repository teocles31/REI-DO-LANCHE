import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer as createViteServer } from 'vite';
import db, { initDb } from './db/index';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for migration

// Initialize Database
initDb();

// --- API Routes ---

// Generic CRUD Helper
const createCrudRoutes = (tableName: string) => {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) return res.status(400).json({ error: 'User ID required' });

      const rows = db.prepare(`SELECT * FROM ${tableName} WHERE userId = ?`).all(userId);
      // Parse JSON fields if necessary
      const parsedRows = rows.map((row: any) => {
        if (tableName === 'products') {
          row.ingredients = JSON.parse(row.ingredients);
          row.complements = row.complements ? JSON.parse(row.complements) : undefined;
        }
        if (tableName === 'orders') {
          row.items = JSON.parse(row.items);
        }
        // Convert boolean integers back to boolean
        if (row.isRecurring !== undefined) row.isRecurring = !!row.isRecurring;
        if (row.active !== undefined) row.active = !!row.active;
        return row;
      });
      res.json(parsedRows);
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.post('/', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) return res.status(400).json({ error: 'User ID required' });

      const data = { ...req.body, userId };
      const keys = Object.keys(data);
      const values = Object.values(data).map(val => {
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        if (typeof val === 'boolean') return val ? 1 : 0;
        return val;
      });
      
      const placeholders = keys.map(() => '?').join(',');
      const stmt = db.prepare(`INSERT OR REPLACE INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`);
      stmt.run(...values);
      res.json({ success: true });
    } catch (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.put('/:id', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) return res.status(400).json({ error: 'User ID required' });

      const { id } = req.params;
      const data = req.body;
      const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'userId');
      const values = keys.map(k => {
        const val = data[k];
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        if (typeof val === 'boolean') return val ? 1 : 0;
        return val;
      });

      const setClause = keys.map(k => `${k} = ?`).join(',');
      const stmt = db.prepare(`UPDATE ${tableName} SET ${setClause} WHERE id = ? AND userId = ?`);
      stmt.run(...values, id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) return res.status(400).json({ error: 'User ID required' });

      const { id } = req.params;
      const stmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ? AND userId = ?`);
      stmt.run(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
};

app.use('/api/ingredients', createCrudRoutes('ingredients'));
app.use('/api/products', createCrudRoutes('products'));
app.use('/api/revenues', createCrudRoutes('revenues'));
app.use('/api/expenses', createCrudRoutes('expenses'));
app.use('/api/stock_movements', createCrudRoutes('stock_movements'));
app.use('/api/employees', createCrudRoutes('employees'));
app.use('/api/customers', createCrudRoutes('customers'));
app.use('/api/orders', createCrudRoutes('orders'));

// --- Migration Endpoint ---
app.post('/api/migrate', (req, res) => {
  const { 
    userId,
    ingredients, 
    products, 
    revenues, 
    expenses, 
    stockMovements, 
    employees, 
    customers, 
    orders 
  } = req.body;

  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const insertBatch = (table: string, items: any[]) => {
    if (!items || items.length === 0) return;
    // Add userId to each item
    const itemsWithUser = items.map(item => ({ ...item, userId }));
    
    const keys = Object.keys(itemsWithUser[0]);
    const placeholders = keys.map(() => '?').join(',');
    const stmt = db.prepare(`INSERT OR IGNORE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
    
    const transaction = db.transaction((rows) => {
      for (const row of rows) {
        const values = keys.map(k => {
            const val = row[k];
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            if (typeof val === 'boolean') return val ? 1 : 0;
            return val;
        });
        stmt.run(...values);
      }
    });
    transaction(itemsWithUser);
  };

  try {
    insertBatch('ingredients', ingredients);
    insertBatch('products', products);
    insertBatch('revenues', revenues);
    insertBatch('expenses', expenses);
    insertBatch('stock_movements', stockMovements);
    insertBatch('employees', employees);
    insertBatch('customers', customers);
    insertBatch('orders', orders);
    res.json({ success: true, message: 'Migration complete' });
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});


// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

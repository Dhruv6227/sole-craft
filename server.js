const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'store.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

let db;

async function initDB() {
  const SQL = await initSqlJs();

  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, description TEXT, price REAL NOT NULL,
      original_price REAL, category TEXT, image TEXT,
      rating REAL DEFAULT 4.5, reviews INTEGER DEFAULT 0,
      sizes TEXT, colors TEXT, badge TEXT, featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL, customer_email TEXT NOT NULL,
      customer_phone TEXT, address TEXT, city TEXT, zip TEXT,
      items TEXT NOT NULL, total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS newsletter (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT, message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Seed
  const res = db.exec('SELECT COUNT(*) as count FROM products');
  const count = res[0]?.values[0][0] || 0;

  if (count === 0) {
    const products = [
      ['AeroStride Runner','Ultralight performance running shoe with responsive cushioning and breathable mesh upper. Engineered for speed and comfort on every run.',149.99,189.99,'running','/images/shoe-runner-white.png',4.8,342,'7,8,9,10,11,12','White,Black,Grey','Best Seller',1],
      ['UrbanEdge High-Top','Premium leather high-top sneaker with gold-accented detailing. Statement style meets all-day comfort.',199.99,249.99,'lifestyle','/images/shoe-hightop-black.png',4.7,218,'7,8,9,10,11,12,13','Black,White','New Arrival',1],
      ['CourtBlaze Pro','Dominate the court with explosive cushioning and lockdown fit. Built for intense moments.',179.99,219.99,'basketball','/images/shoe-basketball-red.png',4.9,507,'8,9,10,11,12,13,14','Red,Black,Blue','Top Rated',1],
      ['VelvetStep Loafer','Sophisticated navy loafer crafted from premium materials. Effortless elegance for any occasion.',129.99,159.99,'casual','/images/shoe-loafer-navy.png',4.6,156,'7,8,9,10,11,12','Navy,Brown,Black','',0],
      ['TrailForge X','Conquer any terrain with aggressive traction and waterproof construction. Adventure-ready.',189.99,229.99,'outdoor','/images/shoe-hiking-green.png',4.7,283,'7,8,9,10,11,12,13','Green,Grey,Brown','Limited Edition',1],
      ['BlossomLite Flex','Trend-setting fashion sneaker with pastel aesthetics and cloud-like cushioning.',139.99,169.99,'lifestyle','/images/shoe-fashion-pink.png',4.8,421,'5,6,7,8,9,10','Pink,White,Lavender','Trending',1]
    ];
    const stmt = db.prepare('INSERT INTO products (name,description,price,original_price,category,image,rating,reviews,sizes,colors,badge,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    products.forEach(p => { stmt.run(p); });
    stmt.free();
    saveDB();
    console.log('✅ Database seeded with products');
  }
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

// ============ API ROUTES ============
app.get('/api/products', (req, res) => {
  const { category, sort, search, featured } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
  if (search) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (featured === 'true') { sql += ' AND featured = 1'; }

  if (sort === 'price-asc') sql += ' ORDER BY price ASC';
  else if (sort === 'price-desc') sql += ' ORDER BY price DESC';
  else if (sort === 'rating') sql += ' ORDER BY rating DESC';
  else sql += ' ORDER BY featured DESC, rating DESC';

  res.json(queryAll(sql, params));
});

app.get('/api/products/:id', (req, res) => {
  const product = queryOne('SELECT * FROM products WHERE id = ?', [parseInt(req.params.id)]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/orders', (req, res) => {
  const { customer_name, customer_email, customer_phone, address, city, zip, items, total } = req.body;
  if (!customer_name || !customer_email || !items || !total) return res.status(400).json({ error: 'Missing required fields' });
  db.run('INSERT INTO orders (customer_name,customer_email,customer_phone,address,city,zip,items,total) VALUES (?,?,?,?,?,?,?,?)',
    [customer_name, customer_email, customer_phone||'', address||'', city||'', zip||'', JSON.stringify(items), total]);
  saveDB();
  res.status(201).json({ message: 'Order placed successfully!' });
});

app.get('/api/orders', (req, res) => { res.json(queryAll('SELECT * FROM orders ORDER BY created_at DESC')); });

app.get('/api/newsletter', (req, res) => { res.json(queryAll('SELECT * FROM newsletter ORDER BY subscribed_at DESC')); });

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    db.run('INSERT INTO newsletter (email) VALUES (?)', [email]);
    saveDB();
    res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) res.status(409).json({ message: 'Already subscribed!' });
    else res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required' });
  db.run('INSERT INTO contact_messages (name,email,subject,message) VALUES (?,?,?,?)', [name, email, subject||'', message]);
  saveDB();
  res.status(201).json({ message: 'Message sent successfully!' });
});

app.get('/api/messages', (req, res) => { res.json(queryAll('SELECT * FROM contact_messages ORDER BY created_at DESC')); });

app.get('/admin', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'admin.html')); });

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

// Start
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🔥 SoleCraft server running at http://localhost:${PORT}\n`);
  });
}).catch(err => { console.error('Failed to init DB:', err); process.exit(1); });

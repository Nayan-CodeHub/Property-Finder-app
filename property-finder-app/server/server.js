import express from 'express';
import cors from 'cors';
import tf from '@tensorflow/tfjs';
import initSqlJs from 'sql.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(cors());
app.use(express.json());

// ============ SAMPLE PROPERTIES ============
const seedProperties = [
  {
    id: 1,
    name: "Modern 2BHK Apartment",
    location: "Downtown",
    latitude: 28.6139,
    longitude: 77.2090,
    bhk: 2,
    size: 900,
    furnished: true,
    actualPrice: 450000,
    amenities: ["Pool", "Gym", "Parking", "Security"]
  },
  {
    id: 2,
    name: "Cozy 2BHK Flat",
    location: "Suburbs",
    latitude: 28.5244,
    longitude: 77.1855,
    bhk: 2,
    size: 750,
    furnished: false,
    actualPrice: 280000,
    amenities: ["Parking", "Security"]
  },
  {
    id: 3,
    name: "Spacious 2BHK Villa",
    location: "Downtown",
    latitude: 28.6300,
    longitude: 77.2200,
    bhk: 2,
    size: 1200,
    furnished: true,
    actualPrice: 550000,
    amenities: ["Pool", "Gym", "Parking", "Garden", "Security"]
  },
  {
    id: 4,
    name: "Budget 2BHK Apartment",
    location: "Suburbs",
    latitude: 28.5100,
    longitude: 77.1700,
    bhk: 2,
    size: 600,
    furnished: false,
    actualPrice: 200000,
    amenities: ["Parking"]
  },
  {
    id: 5,
    name: "Luxury 2BHK Penthouse",
    location: "Downtown",
    latitude: 28.6200,
    longitude: 77.2100,
    bhk: 2,
    size: 1500,
    furnished: true,
    actualPrice: 750000,
    amenities: ["Pool", "Gym", "Parking", "Garden", "Security", "Concierge"]
  },
  {
    id: 6,
    name: "Semi-Furnished 2BHK",
    location: "Suburbs",
    latitude: 28.5300,
    longitude: 77.1900,
    bhk: 2,
    size: 850,
    furnished: false,
    actualPrice: 320000,
    amenities: ["Parking", "Security", "Gym"]
  }
];

const propertyDetails = {
  1: {
    propertyType: 'Apartment',
    bathrooms: 2,
    yearBuilt: 2020,
    monthlyRent: 28000,
    description: 'A bright, modern apartment close to business districts and daily conveniences.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80'
  },
  2: {
    propertyType: 'Apartment',
    bathrooms: 2,
    yearBuilt: 2017,
    monthlyRent: 18000,
    description: 'A comfortable and practical home in a quiet neighborhood with essential amenities nearby.',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80'
  },
  3: {
    propertyType: 'Villa',
    bathrooms: 3,
    yearBuilt: 2021,
    monthlyRent: 36000,
    description: 'A spacious family villa with generous living areas, a garden, and premium amenities.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80'
  },
  4: {
    propertyType: 'Apartment',
    bathrooms: 1,
    yearBuilt: 2015,
    monthlyRent: 14000,
    description: 'An affordable starter home with practical access to local services and transport.',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'
  },
  5: {
    propertyType: 'Penthouse',
    bathrooms: 3,
    yearBuilt: 2023,
    monthlyRent: 50000,
    description: 'A high-end penthouse with expansive views, concierge service, and resort-style facilities.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80'
  },
  6: {
    propertyType: 'Apartment',
    bathrooms: 2,
    yearBuilt: 2018,
    monthlyRent: 21000,
    description: 'A flexible semi-furnished apartment suited to professionals and small families.',
    imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817?auto=format&fit=crop&w=900&q=80'
  }
};

const initialProperties = seedProperties.map(property => ({
  ...property,
  ...propertyDetails[property.id]
}));

const databaseDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
fs.mkdirSync(databaseDirectory, { recursive: true });
const databasePath = path.join(databaseDirectory, 'properties.db');
const insertPropertySql = `
  INSERT INTO properties (
    name, location, latitude, longitude, bhk, size, furnished, actualPrice,
    amenities, propertyType, bathrooms, yearBuilt, monthlyRent, description, imageUrl
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
let db;
const sessions = new Map();

function queryRows(sql, values = []) {
  const statement = db.prepare(sql);
  try {
    statement.bind(values);
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    return rows;
  } finally {
    statement.free();
  }
}

function saveDatabase() {
  fs.writeFileSync(databasePath, Buffer.from(db.export()));
}

function insertProperty(property) {
  db.run(insertPropertySql, [
    property.name, property.location, property.latitude, property.longitude, property.bhk,
    property.size, Number(property.furnished), property.actualPrice, JSON.stringify(property.amenities),
    property.propertyType, property.bathrooms, property.yearBuilt, property.monthlyRent,
    property.description, property.imageUrl
  ]);
}

async function initializeDatabase() {
  const SQL = await initSqlJs();
  db = fs.existsSync(databasePath)
    ? new SQL.Database(fs.readFileSync(databasePath))
    : new SQL.Database();
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      bhk INTEGER NOT NULL,
      size REAL NOT NULL,
      furnished INTEGER NOT NULL,
      actualPrice REAL NOT NULL,
      amenities TEXT NOT NULL,
      propertyType TEXT NOT NULL,
      bathrooms INTEGER NOT NULL,
      yearBuilt INTEGER,
      monthlyRent REAL,
      description TEXT NOT NULL,
      imageUrl TEXT NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  if (queryRows('SELECT COUNT(*) AS count FROM properties')[0].count === 0) {
    initialProperties.forEach(insertProperty);
    saveDatabase();
  }
}

function propertyFromRow(row) {
  return { ...row, furnished: Boolean(row.furnished), amenities: JSON.parse(row.amenities) };
}

function getProperties() {
  return queryRows('SELECT * FROM properties').map(propertyFromRow);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = storedHash.split(':');
  const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, user);
  return token;
}

function authenticatedUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token ? sessions.get(token) : null;
}

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!String(name || '').trim() || !normalizedEmail || String(password || '').length < 6) {
    return res.status(400).json({ error: 'Name, valid email, and a password of at least 6 characters are required' });
  }
  if (queryRows('SELECT id FROM users WHERE email = ?', [normalizedEmail]).length) {
    return res.status(409).json({ error: 'An account already exists with this email' });
  }
  db.run('INSERT INTO users (name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)', [
    String(name).trim(), normalizedEmail, hashPassword(password), new Date().toISOString()
  ]);
  saveDatabase();
  const user = publicUser(queryRows('SELECT id, name, email FROM users WHERE email = ?', [normalizedEmail])[0]);
  res.status(201).json({ user, token: createSession(user) });
});

app.post('/api/auth/login', (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  const row = queryRows('SELECT * FROM users WHERE email = ?', [normalizedEmail])[0];
  if (!row || !String(req.body.password || '') || !verifyPassword(req.body.password, row.passwordHash)) {
    return res.status(401).json({ error: 'Email or password is incorrect' });
  }
  const user = publicUser(row);
  res.json({ user, token: createSession(user) });
});

app.get('/api/auth/me', (req, res) => {
  const user = authenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Session expired' });
  res.json({ user });
});

// Location multipliers (for price prediction)
const locationMultipliers = {
  "Downtown": 1.5,
  "Suburbs": 1.0,
  "Outskirts": 0.7
};

// ============ PRICE PREDICTION MODEL ============
let mlModel = null;

// Simple formula-based price prediction
function formulaBasedPrice(bhk, size, location, furnished) {
  const basePrice = 200; // Price per sq ft (base)
  const locationMult = locationMultipliers[location] || 1.0;
  const furnishedBonus = furnished ? 1.2 : 1.0;
  
  const predictedPrice = size * basePrice * locationMult * furnishedBonus;
  return Math.round(predictedPrice);
}

// Train ML model
async function trainModel(trainingData) {
  const xs = tf.tensor2d(
    trainingData.map(d => [
      d.bhk,
      d.size,
      locationMultipliers[d.location] || 1.0,
      d.furnished ? 1 : 0
    ])
  );
  
  const ys = tf.tensor2d(
    trainingData.map(d => [d.actualPrice]),
    [trainingData.length, 1]
  );

  mlModel = tf.sequential({
    layers: [
      tf.layers.dense({ units: 64, activation: 'relu', inputShape: [4] }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'linear' })
    ]
  });

  mlModel.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });

  await mlModel.fit(xs, ys, {
    epochs: 100,
    batchSize: 2,
    verbose: 0
  });

  xs.dispose();
  ys.dispose();

  return true;
}

// ML-based price prediction
function mlBasedPrice(bhk, size, location, furnished) {
  if (!mlModel) return null;

  const input = tf.tensor2d([[
    bhk,
    size,
    locationMultipliers[location] || 1.0,
    furnished ? 1 : 0
  ]]);

  const prediction = mlModel.predict(input);
  const price = Math.round(prediction.dataSync()[0]);
  
  input.dispose();
  prediction.dispose();

  return price;
}

// ============ API ENDPOINTS ============

// Get all properties with filters
app.get('/api/properties', (req, res) => {
  const { bhk, minPrice, maxPrice, minSize, location, furnished, propertyType, amenity, sort } = req.query;
  
  let filtered = getProperties();

  if (bhk) filtered = filtered.filter(p => p.bhk === parseInt(bhk));
  if (minPrice) filtered = filtered.filter(p => p.actualPrice >= parseInt(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.actualPrice <= parseInt(maxPrice));
  if (minSize) filtered = filtered.filter(p => p.size >= parseInt(minSize));
  if (location && location !== 'all') filtered = filtered.filter(p => p.location === location);
  if (furnished !== undefined) filtered = filtered.filter(p => p.furnished === (furnished === 'true'));
  if (propertyType && propertyType !== 'all') filtered = filtered.filter(p => p.propertyType === propertyType);
  if (amenity && amenity !== 'all') filtered = filtered.filter(p => p.amenities.includes(amenity));

  if (sort === 'price-low') filtered = [...filtered].sort((a, b) => a.actualPrice - b.actualPrice);
  if (sort === 'price-high') filtered = [...filtered].sort((a, b) => b.actualPrice - a.actualPrice);
  if (sort === 'size-high') filtered = [...filtered].sort((a, b) => b.size - a.size);

  res.json(filtered);
});

// Get single property
app.get('/api/properties/:id', (req, res) => {
  const [row] = queryRows('SELECT * FROM properties WHERE id = ?', [Number(req.params.id)]);
  const property = row && propertyFromRow(row);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json(property);
});

// Predict price
app.post('/api/predict-price', (req, res) => {
  const { bhk, size, location, furnished } = req.body;

  if (!bhk || !size || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const formulaPrice = formulaBasedPrice(bhk, size, location, furnished);
  const mlPrice = mlBasedPrice(bhk, size, location, furnished);

  res.json({
    formulaPrice,
    mlPrice,
    averagePrice: mlPrice ? Math.round((formulaPrice + mlPrice) / 2) : formulaPrice,
    confidence: mlPrice ? 'high' : 'medium'
  });
});

// Train model with current data
app.post('/api/train-model', async (req, res) => {
  try {
    await trainModel(getProperties());
    res.json({ success: true, message: 'Model trained successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new property
app.post('/api/properties', (req, res) => {
  const {
    name, location, latitude, longitude, bhk, size, furnished, actualPrice,
    amenities, propertyType = 'Apartment', bathrooms = 1, yearBuilt = null,
    monthlyRent = null, description = '', imageUrl = ''
  } = req.body;

  if (!name || !location || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) ||
      !Number.isInteger(Number(bhk)) || Number(bhk) < 1 || !Number.isFinite(Number(size)) || Number(size) <= 0 ||
      typeof furnished !== 'boolean' || !Number.isFinite(Number(actualPrice)) || Number(actualPrice) <= 0 ||
      !Array.isArray(amenities)) {
    return res.status(400).json({ error: 'Invalid property data' });
  }

  const newProperty = {
    name, location, latitude: Number(latitude), longitude: Number(longitude), bhk: Number(bhk),
    size: Number(size), furnished, actualPrice: Number(actualPrice), amenities,
    propertyType, bathrooms: Number(bathrooms), yearBuilt: yearBuilt === null ? null : Number(yearBuilt),
    monthlyRent: monthlyRent === null ? null : Number(monthlyRent), description, imageUrl
  };
  insertProperty(newProperty);
  newProperty.id = queryRows('SELECT last_insert_rowid() AS id')[0].id;
  saveDatabase();
  res.status(201).json(newProperty);
});

// Get locations
app.get('/api/locations', (req, res) => {
  const locations = queryRows('SELECT DISTINCT location FROM properties ORDER BY location').map(row => row.location);
  res.json(locations);
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await initializeDatabase();
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Server is already running on port ${PORT}; using the existing instance.`);
      return;
    }
    console.error('Server failed to listen:', error);
    process.exitCode = 1;
  });
  trainModel(getProperties()).then(() => {
    console.log('ML Model trained on startup');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exitCode = 1;
});

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tf from '@tensorflow/tfjs';
import initSqlJs from 'sql.js';
import { GridFSBucket, MongoClient } from 'mongodb';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

// ============ SAMPLE PROPERTIES ============
const repairedSeedImageUrl = 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80';
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
    imageUrl: repairedSeedImageUrl
  }
};

const initialProperties = seedProperties.map(property => ({
  ...property,
  ...propertyDetails[property.id]
}));

const databaseDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const databasePath = process.env.PROPERTY_DATABASE_PATH
  ? path.resolve(process.env.PROPERTY_DATABASE_PATH)
  : path.join(databaseDirectory, 'properties.db');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const insertPropertySql = `
  INSERT INTO properties (
    name, location, latitude, longitude, bhk, size, furnished, actualPrice,
    amenities, propertyType, bathrooms, yearBuilt, monthlyRent, description, imageUrl, photos, ownerId
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
let db;
let SqlDatabase;
let mongoClient;
let mongoDatabase;
let mongoUsers;
let mongoCounters;
let mongoSessions;
let mongoSnapshotBucket;
let mongoSnapshotState;
let mongoSnapshotQueue = Promise.resolve();
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
  const snapshot = Buffer.from(db.export());
  fs.writeFileSync(databasePath, snapshot);
  if (!mongoSnapshotBucket || !mongoSnapshotState) return Promise.resolve();

  const savePromise = mongoSnapshotQueue.then(async () => {
    const previousSnapshotId = mongoSnapshotState.fileId;
    const uploadStream = mongoSnapshotBucket.openUploadStream('sqlite-state', {
      metadata: { updatedAt: new Date() }
    });
    const fileId = await new Promise((resolve, reject) => {
      uploadStream.once('error', reject);
      uploadStream.once('finish', () => resolve(uploadStream.id));
      uploadStream.end(snapshot);
    });
    await mongoSnapshotState.updateOne(
      { _id: 'sqlite' },
      { $set: { fileId, updatedAt: new Date() } },
      { upsert: true }
    );
    mongoSnapshotState.fileId = fileId;
    if (previousSnapshotId) {
      try {
        await mongoSnapshotBucket.delete(previousSnapshotId);
      } catch (error) {
        console.error('Unable to remove the previous SQLite snapshot from MongoDB:', error);
      }
    }
  });
  mongoSnapshotQueue = savePromise.catch(error => {
    console.error('Unable to persist SQLite data to MongoDB:', error);
  });
  return savePromise;
}

function insertProperty(property) {
  const photos = Array.isArray(property.photos) && property.photos.length
    ? property.photos
    : [property.imageUrl];
  db.run(insertPropertySql, [
    property.name, property.location, property.latitude, property.longitude, property.bhk,
    property.size, Number(property.furnished), property.actualPrice, JSON.stringify(property.amenities),
    property.propertyType, property.bathrooms, property.yearBuilt, property.monthlyRent,
    property.description, property.imageUrl, JSON.stringify(photos), property.ownerId ?? null
  ]);
}

async function initializeDatabase() {
  const SQL = await initSqlJs();
  SqlDatabase = SQL.Database;
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
      imageUrl TEXT NOT NULL,
      photos TEXT
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      userId INTEGER NOT NULL,
      propertyId INTEGER NOT NULL,
      PRIMARY KEY (userId, propertyId)
    )
  `);
  const propertyColumns = queryRows('PRAGMA table_info(properties)').map(column => column.name);
  if (!propertyColumns.includes('ownerId')) {
    db.run('ALTER TABLE properties ADD COLUMN ownerId INTEGER REFERENCES users(id)');
  }
  if (!propertyColumns.includes('photos')) {
    db.run('ALTER TABLE properties ADD COLUMN photos TEXT');
  }

  if (queryRows('SELECT COUNT(*) AS count FROM properties')[0].count === 0) {
    initialProperties.forEach(insertProperty);
    await saveDatabase();
  }

  const staleSeedImageUrl = 'https://images.unsplash.com/photo-1493809842364-78817?auto=format&fit=crop&w=900&q=80';
  if (queryRows('SELECT COUNT(*) AS count FROM properties WHERE imageUrl = ?', [staleSeedImageUrl])[0].count > 0) {
    db.run('UPDATE properties SET imageUrl = ? WHERE imageUrl = ?', [repairedSeedImageUrl, staleSeedImageUrl]);
    await saveDatabase();
  }
}

async function initializeMongoDatabase() {
  if (!process.env.MONGODB_URI) return;
  let mongoUri = process.env.MONGODB_URI.trim();
  if (mongoUri.startsWith('MONGODB_URI=')) {
    mongoUri = mongoUri.slice('MONGODB_URI='.length).trim();
  }
  if (/^(['"]).*\1$/.test(mongoUri)) {
    mongoUri = mongoUri.slice(1, -1).trim();
  }
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://. Remove any surrounding quotes.');
  }
  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  mongoDatabase = mongoClient.db(process.env.MONGODB_DATABASE || 'property_finder');
  mongoUsers = mongoDatabase.collection('users');
  mongoCounters = mongoDatabase.collection('counters');
  mongoSessions = mongoDatabase.collection('sessions');
  mongoSnapshotBucket = new GridFSBucket(mongoDatabase, { bucketName: 'sqlite_snapshots' });
  mongoSnapshotState = mongoDatabase.collection('app_state');
  await mongoUsers.createIndex({ email: 1 }, { unique: true });
  await mongoSessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  const currentSnapshot = await mongoSnapshotState.findOne({ _id: 'sqlite' });
  mongoSnapshotState.fileId = currentSnapshot?.fileId;
  if (currentSnapshot?.fileId) {
    const chunks = [];
    for await (const chunk of mongoSnapshotBucket.openDownloadStream(currentSnapshot.fileId)) {
      chunks.push(Buffer.from(chunk));
    }
    db.close();
    db = new SqlDatabase(Buffer.concat(chunks));
    console.log('Loaded persistent application data from MongoDB');
  }

  const localUsers = queryRows('SELECT * FROM users');
  for (const row of localUsers) {
    const favorites = queryRows(
      'SELECT propertyId FROM favorites WHERE userId = ? ORDER BY propertyId',
      [row.id]
    ).map(favorite => Number(favorite.propertyId));
    await mongoUsers.updateOne(
      { _id: Number(row.id) },
      {
        $setOnInsert: {
          name: row.name,
          email: row.email,
          passwordHash: row.passwordHash,
          createdAt: row.createdAt,
          favorites
        }
      },
      { upsert: true }
    );
  }

  const latestMongoUser = await mongoUsers.findOne({}, { sort: { _id: -1 }, projection: { _id: 1 } });
  const latestLocalUser = localUsers.reduce((latest, row) => Math.max(latest, Number(row.id)), 0);
  await mongoCounters.updateOne(
    { _id: 'userId' },
    { $max: { seq: Math.max(Number(latestMongoUser?._id || 0), latestLocalUser) } },
    { upsert: true }
  );

  for await (const account of mongoUsers.find({}, {
    projection: { _id: 1, name: 1, email: 1, passwordHash: 1, createdAt: 1, favorites: 1 }
  })) {
    db.run(
      'INSERT OR IGNORE INTO users (id, name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)',
      [Number(account._id), account.name, account.email, account.passwordHash, account.createdAt]
    );
    for (const propertyId of account.favorites || []) {
      db.run('INSERT OR IGNORE INTO favorites (userId, propertyId) VALUES (?, ?)', [
        Number(account._id), Number(propertyId)
      ]);
    }
  }
  await saveDatabase();
  console.log(`Account data connected to MongoDB database "${mongoDatabase.databaseName}"`);
}

function propertyFromRow(row) {
  const photos = row.photos ? JSON.parse(row.photos) : [row.imageUrl];
  return {
    ...row,
    ownerId: row.ownerId === null || row.ownerId === undefined ? null : Number(row.ownerId),
    furnished: Boolean(row.furnished),
    amenities: JSON.parse(row.amenities),
    photos: photos.length ? photos : [row.imageUrl]
  };
}

function getProperties() {
  return queryRows(`
    SELECT properties.*, users.name AS sellerName, users.email AS sellerEmail
    FROM properties
    LEFT JOIN users ON properties.ownerId = users.id
  `).map(propertyFromRow);
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

async function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, user);
  if (mongoSessions) {
    await mongoSessions.insertOne({
      _id: token,
      user,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  }
  return token;
}

async function authenticatedUser(req) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  if (mongoSessions && token) {
    const session = await mongoSessions.findOne({ _id: token, expiresAt: { $gt: new Date() } });
    if (session) return session.user;
  }
  return token ? sessions.get(token) : null;
}

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!String(name || '').trim() || !normalizedEmail || String(password || '').length < 6) {
    return res.status(400).json({ error: 'Name, valid email, and a password of at least 6 characters are required' });
  }
  try {
    if (mongoUsers) {
      if (await mongoUsers.findOne({ email: normalizedEmail }, { projection: { _id: 1 } })) {
        return res.status(409).json({ error: 'An account already exists with this email' });
      }
      const counter = await mongoCounters.findOneAndUpdate(
        { _id: 'userId' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
      const userRecord = {
        _id: Number(counter.seq),
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
        favorites: []
      };
      await mongoUsers.insertOne(userRecord);
      db.run('INSERT INTO users (id, name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)', [
        userRecord._id, userRecord.name, userRecord.email, userRecord.passwordHash, userRecord.createdAt
      ]);
      await saveDatabase();
      const user = publicUser({ ...userRecord, id: userRecord._id });
      return res.status(201).json({ user, token: await createSession(user) });
    }

    if (queryRows('SELECT id FROM users WHERE email = ?', [normalizedEmail]).length) {
      return res.status(409).json({ error: 'An account already exists with this email' });
    }
    db.run('INSERT INTO users (name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)', [
      String(name).trim(), normalizedEmail, hashPassword(password), new Date().toISOString()
    ]);
    await saveDatabase();
    const user = publicUser(queryRows('SELECT id, name, email FROM users WHERE email = ?', [normalizedEmail])[0]);
    return res.status(201).json({ user, token: await createSession(user) });
  } catch (error) {
    console.error('Error registering account:', error);
    return res.status(500).json({ error: 'Unable to create your account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
  try {
    const row = mongoUsers
      ? await mongoUsers.findOne({ email: normalizedEmail })
      : queryRows('SELECT * FROM users WHERE email = ?', [normalizedEmail])[0];
    if (!row || !String(req.body.password || '') || !verifyPassword(req.body.password, row.passwordHash)) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    const user = publicUser(mongoUsers ? { ...row, id: row._id } : row);
    return res.json({ user, token: await createSession(user) });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ error: 'Unable to sign in right now' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Session expired' });
  res.json({ user });
});

app.get('/api/account', async (req, res) => {
  const sessionUser = await authenticatedUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Session expired' });
  try {
    if (mongoUsers) {
      const account = await mongoUsers.findOne({ _id: sessionUser.id });
      if (!account) return res.status(401).json({ error: 'Account not found' });
      const user = publicUser({ ...account, id: account._id });
      sessions.set(req.headers.authorization.slice(7), user);
      await mongoSessions.updateOne(
        { _id: req.headers.authorization.slice(7) },
        { $set: { user } }
      );
      return res.json({ user, favorites: account.favorites || [] });
    }
    const [userRow] = queryRows('SELECT id, name, email FROM users WHERE id = ?', [sessionUser.id]);
    if (!userRow) return res.status(401).json({ error: 'Account not found' });
    const user = publicUser(userRow);
    sessions.set(req.headers.authorization.slice(7), user);
    const favorites = queryRows('SELECT propertyId FROM favorites WHERE userId = ? ORDER BY propertyId', [user.id])
      .map(row => Number(row.propertyId));
    return res.json({ user, favorites });
  } catch (error) {
    console.error('Error loading account data:', error);
    return res.status(500).json({ error: 'Unable to load your account data' });
  }
});

app.put('/api/account/profile', async (req, res) => {
  const sessionUser = await authenticatedUser(req);
  if (!sessionUser) return res.status(401).json({ error: 'Session expired' });
  const name = String(req.body.name || '').trim();
  if (!name || name.length > 80) {
    return res.status(400).json({ error: 'Name must be between 1 and 80 characters' });
  }
  try {
    if (mongoUsers) {
      const result = await mongoUsers.updateOne({ _id: sessionUser.id }, { $set: { name } });
      if (!result.matchedCount) return res.status(404).json({ error: 'Account not found' });
    }
    db.run('UPDATE users SET name = ? WHERE id = ?', [name, sessionUser.id]);
    if (!mongoUsers && db.getRowsModified() !== 1) return res.status(404).json({ error: 'Account not found' });
    await saveDatabase();
    const user = { ...sessionUser, name };
    const token = req.headers.authorization.slice(7);
    sessions.set(token, user);
    if (mongoSessions) await mongoSessions.updateOne({ _id: token }, { $set: { user } });
    res.json({ user });
  } catch (error) {
    console.error('Error updating account profile:', error);
    res.status(500).json({ error: 'Unable to save profile changes' });
  }
});

app.put('/api/account/favorites', async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Session expired' });
  const { propertyIds } = req.body;
  if (!Array.isArray(propertyIds) || propertyIds.length > 500 ||
      propertyIds.some(id => !Number.isSafeInteger(id) || id < 1)) {
    return res.status(400).json({ error: 'Favorites must be a list of valid property IDs' });
  }
  const uniqueIds = [...new Set(propertyIds)];
  if (uniqueIds.length) {
    const placeholders = uniqueIds.map(() => '?').join(', ');
    const existingIds = queryRows(
      `SELECT id FROM properties WHERE id IN (${placeholders})`,
      uniqueIds
    ).map(row => Number(row.id));
    if (existingIds.length !== uniqueIds.length) {
      return res.status(400).json({ error: 'One or more saved properties do not exist' });
    }
  }

  if (mongoUsers) {
    try {
      const result = await mongoUsers.updateOne(
        { _id: user.id },
        { $set: { favorites: uniqueIds } }
      );
      if (!result.matchedCount) return res.status(404).json({ error: 'Account not found' });
      return res.json({ favorites: uniqueIds });
    } catch (error) {
      console.error('Error saving account favorites to MongoDB:', error);
      return res.status(500).json({ error: 'Unable to save your favorites' });
    }
  }

  let transactionOpen = false;
  try {
    db.run('BEGIN TRANSACTION');
    transactionOpen = true;
    db.run('DELETE FROM favorites WHERE userId = ?', [user.id]);
    uniqueIds.forEach(propertyId => {
      db.run('INSERT INTO favorites (userId, propertyId) VALUES (?, ?)', [user.id, propertyId]);
    });
    db.run('COMMIT');
    transactionOpen = false;
    await saveDatabase();
    res.json({ favorites: uniqueIds });
  } catch (error) {
    if (transactionOpen) db.run('ROLLBACK');
    console.error('Error saving account favorites:', error);
    res.status(500).json({ error: 'Unable to save your favorites' });
  }
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

function parseMoneyAmount(amountText, unitText = '') {
  const amount = Number(String(amountText).replace(/,/g, ''));
  const unit = unitText.toLowerCase();
  if (!Number.isFinite(amount)) return null;
  if (/crore|^cr$/.test(unit)) return amount * 10000000;
  if (/lakh|lac/.test(unit)) return amount * 100000;
  if (/million|^mn$/.test(unit)) return amount * 1000000;
  if (/thousand|^k$/.test(unit)) return amount * 1000;
  return amount;
}

function interpretPropertyQuery(query, availableLocations) {
  const normalized = query.toLowerCase().replace(/,/g, '');
  const criteria = {};
  const betweenRange = normalized.match(
    /\bbetween\s+(?:₹\s*)?(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|million|mn|thousand|k)?\s+(?:and|to|-)\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|million|mn|thousand|k)?\b/
  );
  const possibleRange = betweenRange || normalized.match(
    /(?:between\s+)?(?:₹\s*)?(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|lakh|lac|million|mn|thousand|k)?\s*(?:-|to|and)\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|lakh|lac|million|mn|thousand|k)?\b/
  );
  const rangePrefix = possibleRange
    ? normalized.slice(Math.max(0, possibleRange.index - 20), possibleRange.index)
    : '';
  const range = possibleRange &&
    (possibleRange[2] || possibleRange[4] || possibleRange[0].includes('₹') ||
      /\b(?:between|budget|price)\b/.test(rangePrefix))
    ? possibleRange
    : null;

  if (range) {
    if (betweenRange) {
      const minUnit = betweenRange[2] || betweenRange[4] || '';
      const maxUnit = betweenRange[4] || betweenRange[2] || '';
      criteria.minPrice = parseMoneyAmount(betweenRange[1], minUnit);
      criteria.maxPrice = parseMoneyAmount(betweenRange[3], maxUnit);
    } else {
      const unit = range[4] || range[2] || '';
      criteria.minPrice = parseMoneyAmount(range[1], unit);
      criteria.maxPrice = parseMoneyAmount(range[3], unit);
    }
  } else {
    const amounts = [...normalized.matchAll(
      /(?:₹\s*)?(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|lakh|lac|million|mn|thousand|k)?\b/g
    )];
    const moneyAmount = amounts.find(match =>
      match[2] || normalized.slice(Math.max(0, match.index - 2), match.index).includes('₹')
    ) || amounts.find(match => {
      const beforeAmount = normalized.slice(Math.max(0, match.index - 32), match.index);
      const afterAmount = normalized.slice(match.index + match[0].length);
      return !/^\s*(?:bhk|bed(?:room)?s?)\b/.test(afterAmount) &&
        /\b(?:budget|price|under|below|above|over|less than|up to|between|within|maximum|minimum)\b/.test(beforeAmount);
    });
    if (moneyAmount) {
      const amount = parseMoneyAmount(moneyAmount[1], moneyAmount[2] || '');
      const beforeAmount = normalized.slice(Math.max(0, moneyAmount.index - 32), moneyAmount.index);
      const afterAmount = normalized.slice(moneyAmount.index + moneyAmount[0].length);
      if (/\b(?:above|over|minimum|at least|more than)\b/.test(beforeAmount)) {
        criteria.minPrice = amount;
      } else if (/\b(?:between|from)\b/.test(beforeAmount) && !criteria.maxPrice) {
        criteria.minPrice = amount;
      } else if (/\b(?:to|and)\b/.test(afterAmount) && !criteria.maxPrice) {
        criteria.minPrice = amount;
      } else {
        criteria.maxPrice = amount;
      }
    }
  }

  const bhk = normalized.match(/\b(\d+)\s*(?:bhk|bed(?:room)?s?)\b/);
  if (bhk) criteria.bhk = Number(bhk[1]);

  if (/\bunfurnished\b|\bnot furnished\b/.test(normalized)) {
    criteria.furnished = false;
  } else if (/\bfurnished\b/.test(normalized)) {
    criteria.furnished = true;
  }

  if (/\b(?:apartment|flat)\b/.test(normalized)) criteria.propertyType = 'Apartment';
  else if (/\bvilla\b/.test(normalized)) criteria.propertyType = 'Villa';
  else if (/\bpenthouse\b/.test(normalized)) criteria.propertyType = 'Penthouse';

  const matchedLocation = [...availableLocations]
    .sort((a, b) => b.length - a.length)
    .find(location => normalized.includes(location.toLowerCase()));
  if (matchedLocation) criteria.location = matchedLocation;

  const amenities = ['Parking', 'Gym', 'Pool', 'Security', 'Garden', 'Concierge'];
  criteria.amenities = amenities.filter(amenity => normalized.includes(amenity.toLowerCase()));
  criteria.keywords = normalized
    .replace(/\b\d+\s*(?:bhk|bed(?:room)?s?)\b/g, ' ')
    .replace(/\b(?:show|find|search|recommend|me|a|an|the|for|with|near|in|at|to|please|home|homes|house|houses|property|properties|i|want|need|mujhe|chahiye|dikhao|mein|aur|ke|liye)\b/g, ' ')
    .replace(/\b(?:under|below|above|over|maximum|minimum|budget|price|up|upto|less|than|more|between|from|within|around|nearby|bhk|bed|beds|bedroom|bedrooms|furnished|unfurnished|apartment|flat|villa|penthouse|lakh|lakhs|lac|lacs|crore|crores|cr|million|mn|thousand|k|rupee|rupees)\b/g, ' ')
    .replace(/₹|[0-9.]+/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !availableLocations.some(location => location.toLowerCase() === word));

  return criteria;
}

function recommendProperties(query, availableProperties) {
  const criteria = interpretPropertyQuery(query, availableProperties.map(property => property.location));
  const ranked = availableProperties.map(property => {
    const dimensions = [];
    const reasons = [];
    const addDimension = (weight, matched, reason, miss) => {
      dimensions.push({ weight, score: matched });
      if (matched >= 0.8) reasons.push(reason);
      else if (miss) reasons.push(miss);
    };

    if (criteria.bhk) {
      addDimension(25, property.bhk === criteria.bhk ? 1 : 0.25, `${criteria.bhk} BHK`, `${property.bhk} BHK`);
    }
    if (criteria.minPrice || criteria.maxPrice) {
      const inRange = (!criteria.minPrice || property.actualPrice >= criteria.minPrice) &&
        (!criteria.maxPrice || property.actualPrice <= criteria.maxPrice);
      let score = inRange ? 1 : 0.25;
      if (!inRange && criteria.maxPrice && property.actualPrice > criteria.maxPrice) {
        score = Math.max(0.1, criteria.maxPrice / property.actualPrice);
      } else if (!inRange && criteria.minPrice && property.actualPrice < criteria.minPrice) {
        score = Math.max(0.1, property.actualPrice / criteria.minPrice);
      }
      const budgetLabel = criteria.minPrice && criteria.maxPrice
        ? `₹${(criteria.minPrice / 100000).toLocaleString()}–${(criteria.maxPrice / 100000).toLocaleString()} lakh`
        : `${criteria.minPrice ? 'At least' : 'Up to'} ₹${((criteria.minPrice || criteria.maxPrice) / 100000).toLocaleString()} lakh`;
      addDimension(30, score, `Within budget (${budgetLabel})`, `Price outside budget (${budgetLabel})`);
    }
    if (criteria.furnished !== undefined) {
      addDimension(10, property.furnished === criteria.furnished ? 1 : 0, criteria.furnished ? 'Furnished' : 'Unfurnished', 'Furnishing preference differs');
    }
    if (criteria.location) {
      addDimension(15, property.location === criteria.location ? 1 : 0, `In ${criteria.location}`, `Different location (${property.location})`);
    }
    if (criteria.propertyType) {
      addDimension(10, property.propertyType === criteria.propertyType ? 1 : 0, criteria.propertyType, `Different type (${property.propertyType})`);
    }
    for (const amenity of criteria.amenities) {
      const matched = property.amenities.some(item => item.toLowerCase() === amenity.toLowerCase());
      addDimension(5, matched ? 1 : 0, amenity, `No ${amenity.toLowerCase()} listed`);
    }
    if (criteria.keywords.length) {
      const searchable = `${property.name} ${property.location} ${property.description} ${property.amenities.join(' ')}`.toLowerCase();
      const matchingKeywords = criteria.keywords.filter(keyword => searchable.includes(keyword));
      const score = matchingKeywords.length / criteria.keywords.length;
      addDimension(10, score, `${matchingKeywords.length}/${criteria.keywords.length} search terms`, `${matchingKeywords.length}/${criteria.keywords.length} search terms`);
    }

    const totalWeight = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);
    const matchScore = totalWeight
      ? Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0) / totalWeight * 100)
      : 100;
    return { ...property, matchScore, matchReasons: reasons };
  });

  return {
    criteria: {
      ...criteria,
      hasPreferences: Boolean(
        criteria.bhk || criteria.minPrice || criteria.maxPrice || criteria.furnished !== undefined ||
        criteria.location || criteria.propertyType || criteria.amenities.length || criteria.keywords.length
      )
    },
    results: ranked.sort((a, b) => b.matchScore - a.matchScore || a.actualPrice - b.actualPrice)
  };
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

app.post('/api/recommendations', (req, res) => {
  const query = String(req.body.query || '').trim();
  if (!query || query.length > 500) {
    return res.status(400).json({ error: 'Enter a search request up to 500 characters long' });
  }
  const availableProperties = getProperties();
  res.json({ query, ...recommendProperties(query, availableProperties) });
});

// Get single property
app.get('/api/properties/:id', (req, res) => {
  const [row] = queryRows(`
    SELECT properties.*, users.name AS sellerName, users.email AS sellerEmail
    FROM properties
    LEFT JOIN users ON properties.ownerId = users.id
    WHERE properties.id = ?
  `, [Number(req.params.id)]);
  const property = row && propertyFromRow(row);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json(property);
});

app.get('/api/my-properties', async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in to view your listings' });
  res.json(getProperties().filter(property => property.ownerId === user.id));
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

function normalizePropertyInput(body) {
  const photos = Array.isArray(body.photos) ? body.photos : [body.imageUrl];
  const validPhotos = photos.length > 0 && photos.length <= 5 &&
    photos.every(photo => {
      if (typeof photo !== 'string') return false;
      const match = photo.match(/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/);
      return match && Buffer.from(match[1], 'base64').length > 0;
    });
  const totalPhotoBytes = validPhotos
    ? photos.reduce((total, photo) => total + Buffer.from(photo.split(',')[1], 'base64').length, 0)
    : 0;
  const {
    name, location, bhk, size, furnished, actualPrice,
    amenities, propertyType = 'Apartment', bathrooms = 1, yearBuilt = null,
    monthlyRent = null, description = ''
  } = body;
  const nameValue = String(name || '').trim();
  const locationValue = String(location || '').trim();

  if (!validPhotos || totalPhotoBytes > 5 * 1024 * 1024 ||
      !nameValue || nameValue.length > 120 || !locationValue || locationValue.length > 120 ||
      !Number.isInteger(Number(bhk)) || Number(bhk) < 1 || Number(bhk) > 20 ||
      !Number.isFinite(Number(size)) || Number(size) <= 0 ||
      typeof furnished !== 'boolean' || !Number.isFinite(Number(actualPrice)) || Number(actualPrice) <= 0 ||
      !Array.isArray(amenities) || amenities.length > 20 ||
      !amenities.every(amenity => typeof amenity === 'string' && amenity.length <= 80) ||
      !['Apartment', 'Villa', 'Penthouse'].includes(propertyType) ||
      !Number.isInteger(Number(bathrooms)) || Number(bathrooms) < 1 || Number(bathrooms) > 30 ||
      (yearBuilt !== null && (!Number.isInteger(Number(yearBuilt)) || Number(yearBuilt) < 1800 || Number(yearBuilt) > new Date().getFullYear() + 2)) ||
      (monthlyRent !== null && (!Number.isFinite(Number(monthlyRent)) || Number(monthlyRent) <= 0)) ||
      (description && String(description).length > 3000)) {
    return null;
  }

  return {
    name: nameValue,
    location: locationValue,
    bhk: Number(bhk),
    size: Number(size),
    furnished,
    actualPrice: Number(actualPrice),
    amenities,
    propertyType,
    bathrooms: Number(bathrooms),
    yearBuilt: yearBuilt === null ? null : Number(yearBuilt),
    monthlyRent: monthlyRent === null ? null : Number(monthlyRent),
    description: String(description).trim(),
    imageUrl: photos[0],
    photos
  };
}

// Add a property listing.
app.post('/api/properties', async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in to list a property' });
  const propertyInput = normalizePropertyInput(req.body);
  if (!propertyInput) return res.status(400).json({ error: 'Invalid property data' });

  const newProperty = {
    ...propertyInput, latitude: 0, longitude: 0, ownerId: user.id
  };
  try {
    insertProperty(newProperty);
    newProperty.id = queryRows('SELECT last_insert_rowid() AS id')[0].id;
    newProperty.sellerName = user.name;
    newProperty.sellerEmail = user.email;
    await saveDatabase();
    res.status(201).json(newProperty);
  } catch (error) {
    console.error('Error saving property listing:', error);
    res.status(500).json({ error: 'Unable to save this property listing' });
  }
});

app.put('/api/properties/:id', async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in to edit a property listing' });

  const propertyId = Number(req.params.id);
  if (!Number.isSafeInteger(propertyId) || propertyId < 1) {
    return res.status(400).json({ error: 'Invalid property ID' });
  }
  const propertyInput = normalizePropertyInput(req.body);
  if (!propertyInput) return res.status(400).json({ error: 'Invalid property data' });

  try {
    const [existingProperty] = queryRows('SELECT ownerId FROM properties WHERE id = ?', [propertyId]);
    if (!existingProperty) return res.status(404).json({ error: 'Property not found' });
    if (Number(existingProperty.ownerId) !== Number(user.id)) {
      return res.status(403).json({ error: 'You can only edit your own property listings' });
    }

    db.run(`
      UPDATE properties SET
        name = ?, location = ?, bhk = ?, size = ?, furnished = ?, actualPrice = ?,
        amenities = ?, propertyType = ?, bathrooms = ?, yearBuilt = ?, monthlyRent = ?,
        description = ?, imageUrl = ?, photos = ?
      WHERE id = ?
    `, [
      propertyInput.name, propertyInput.location, propertyInput.bhk, propertyInput.size,
      Number(propertyInput.furnished), propertyInput.actualPrice, JSON.stringify(propertyInput.amenities),
      propertyInput.propertyType, propertyInput.bathrooms, propertyInput.yearBuilt, propertyInput.monthlyRent,
      propertyInput.description, propertyInput.imageUrl, JSON.stringify(propertyInput.photos), propertyId
    ]);
    await saveDatabase();
    const [updatedRow] = queryRows(`
      SELECT properties.*, users.name AS sellerName, users.email AS sellerEmail
      FROM properties
      LEFT JOIN users ON properties.ownerId = users.id
      WHERE properties.id = ?
    `, [propertyId]);
    res.json(propertyFromRow(updatedRow));
  } catch (error) {
    console.error('Error updating property listing:', error);
    res.status(500).json({ error: 'Unable to update this property listing' });
  }
});

// Get locations
app.get('/api/locations', (req, res) => {
  const locations = queryRows('SELECT DISTINCT location FROM properties ORDER BY location').map(row => row.location);
  res.json(locations);
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production so listings persist across service restarts.');
  }
  await initializeDatabase();
  await initializeMongoDatabase();
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

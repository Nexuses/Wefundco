const { MongoClient } = require('mongodb');

let clientPromise;

async function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000
    });
    clientPromise = client.connect().catch((err) => {
      clientPromise = undefined;
      throw err;
    });
  }

  return clientPromise;
}

async function getDb() {
  const client = await getClient();
  const db = client.db(process.env.MONGODB_DB || 'wefundco');
  await ensureIndexes(db);
  return db;
}

let indexesReady = false;

async function ensureIndexes(db) {
  if (indexesReady) return;
  await Promise.all([
    db.collection('waitlist').createIndex({ email: 1 }, { unique: true }),
    db.collection('waitlist').createIndex({ createdAt: -1 }),
    db.collection('waitlist').createIndex({ role: 1 }),
    db.collection('admins').createIndex({ email: 1 }, { unique: true })
  ]);
  indexesReady = true;
}

module.exports = { getDb };

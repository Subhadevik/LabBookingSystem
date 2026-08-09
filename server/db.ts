import { MongoClient, Db } from 'mongodb';
// Load .env if present
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch (e) {
  // ignore if dotenv isn't installed or .env is missing
}

// Candidate URIs: environment override, local, then Atlas default
const ENV_MONGODB_URI = process.env.MONGODB_URI;
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017';
const ATLAS_MONGODB_URI = 'mongodb+srv://lab:Santheesh2006@lab.vuljlg2.mongodb.net/?retryWrites=true&w=majority&appName=Lab';
const DB_NAME = process.env.DB_NAME || 'lab_booking_system';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  const candidates = [] as string[];
  if (ENV_MONGODB_URI) candidates.push(ENV_MONGODB_URI);
  // prefer local when no explicit env override (or also try local as fallback)
  candidates.push(LOCAL_MONGODB_URI);
  candidates.push(ATLAS_MONGODB_URI);

  let lastError: any = null;

  for (const uri of candidates) {
    try {
      const testClient = new MongoClient(uri);
      await testClient.connect();
      // keep this client as the main client
      client = testClient;
      db = client.db(DB_NAME);
      console.log(`Connected to MongoDB (${uri.startsWith('mongodb://localhost') ? 'local' : uri.includes('mongodb+srv') ? 'atlas' : 'env'})`);
      return db;
    } catch (err) {
      lastError = err;
      console.warn(`Could not connect using ${uri}:`, err.message || err);
      // try next candidate
    }
  }

  console.error('Failed to connect to any MongoDB URI');
  throw lastError || new Error('No MongoDB URI available');
}

export async function getDatabase(): Promise<Db> {
  if (!db) {
    return await connectToDatabase();
  }
  return db;
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

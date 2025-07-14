import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_CONNECTION = process.env.MONGODB_CONNECTION;
const dbName = process.env.DB_NAME || 'sample_mflix';

if (!MONGODB_CONNECTION) {
  console.error('Відсутній MONGODB_CONNECTION у .env файлі!');
  process.exit(1);
}

export let db;

export async function connectToMongo() {
  try {
   const client = new MongoClient(MONGODB_CONNECTION);
    await client.connect();
    db = client.db(dbName);
    console.log(`Підключено до MongoDB Atlas, база: ${dbName}`);
  } catch (err) {
    console.error('Помилка підключення до MongoDB:', err);
    process.exit(1);
  }
}



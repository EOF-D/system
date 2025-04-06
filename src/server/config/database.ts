import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure SQLite database.
const dbConfig = {
  filename:
    process.env.DB_PATH || path.resolve(__dirname, "../data/database.sqlite"),
  driver: sqlite3.Database,
};

/**
 * Create a SQLite database connection factory.
 * @returns {Promise<sqlite3.Database>} A promise that resolves to the SQLite database connection.
 */
export async function getDb() {
  return open(dbConfig);
}

/**
 * Initialize the database by creating necessary tables.
 */
export async function initializeDatabase() {
  const db = await getDb();

  // Create users table if it doesn't exist.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database initialized successfully");
  await db.close();
}

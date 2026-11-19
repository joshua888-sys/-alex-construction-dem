
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("alex_construction.db");

// CREATE BOOKINGS TABLE
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    project TEXT NOT NULL,
    location TEXT,
    details TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// CREATE MESSAGES TABLE
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'New',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// CREATE ADMINISTRATORS TABLE
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'owner',
    email_notifications INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ADD EMAIL NOTIFICATIONS COLUMN TO EXISTING DATABASES
const adminColumns = db.prepare(
  "PRAGMA table_info(admins)"
).all();

const notificationsColumnExists = adminColumns.some(
  column => column.name === "email_notifications"
);

if (!notificationsColumnExists) {
  db.exec(`
    ALTER TABLE admins
    ADD COLUMN email_notifications INTEGER NOT NULL DEFAULT 1
  `);
}

console.log("Database connected successfully!");

export default db;

import { drizzle } from "drizzle-orm/sql-js";
import { drizzle as tursoDrizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema/index.js";

const SCHEMA_STMTS = [
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, image_url TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    description TEXT NOT NULL, price REAL NOT NULL, image_url TEXT,
    images TEXT DEFAULT '[]', category_id INTEGER,
    sizes TEXT DEFAULT '[]', colors TEXT DEFAULT '[]',
    in_stock INTEGER DEFAULT 1, is_featured INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
  )`,
  `CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL,
    product_id INTEGER NOT NULL, quantity INTEGER DEFAULT 1,
    size TEXT, color TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL, customer_email TEXT,
    customer_phone TEXT NOT NULL, address TEXT NOT NULL,
    city TEXT NOT NULL, governorate TEXT NOT NULL,
    total REAL NOT NULL, status TEXT DEFAULT 'pending', notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL, product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL, price REAL NOT NULL,
    size TEXT, color TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE
  )`,
];

const getEnv = (key: string): string | undefined =>
  (globalThis as Record<string, any>).process?.env?.[key];

const tursoUrl = getEnv("TURSO_DB_URL");
const tursoToken = getEnv("TURSO_DB_AUTH_TOKEN");

let _db: any;

if (tursoUrl) {
  const client = createClient({ url: tursoUrl, authToken: tursoToken });
  for (const stmt of SCHEMA_STMTS) {
    await client.execute(stmt);
  }
  _db = tursoDrizzle(client, { schema });
} else {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();
  const sqlite = new SQL.Database();
  for (const stmt of SCHEMA_STMTS) {
    sqlite.run(stmt);
  }
  _db = drizzle(sqlite, { schema });
}

export const db = _db;

export * from "./schema/index.js";

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { pgTable, serial, text, timestamp } = require('drizzle-orm/pg-core');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');
const { signJWT } = require('./_jwt');

const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let step = 'start';
  try {
    step = 'read-body';
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    step = 'connect-db';
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: { rejectUnauthorized: false } });
    const db = drizzle(pool);
    step = 'check-existing';
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) return res.status(409).json({ error: 'An account with that email already exists.' });
    step = 'hash-password';
    const passwordHash = await bcrypt.hash(password, 12);
    step = 'insert-user';
    const rows = await db.insert(usersTable).values({ name: name.trim(), email: email.toLowerCase(), passwordHash }).returning();
    const user = rows[0];
    step = 'sign-token';
    const token = signJWT({ userId: user.id, name: user.name, email: user.email });
    res.setHeader('Set-Cookie', `planora_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24*30}; Secure`);
    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('[register] step=' + step, err);
    return res.status(500).json({ error: err.message, step });
  }
};

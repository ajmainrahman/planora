module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let step = 'start';
  try {
    step = 'require-pg';
    const { Pool } = require('pg');
    step = 'require-drizzle';
    const { drizzle } = require('drizzle-orm/node-postgres');
    const { pgTable, serial, text, timestamp } = require('drizzle-orm/pg-core');
    const { eq } = require('drizzle-orm');
    step = 'require-bcrypt';
    const bcrypt = require('bcryptjs');
    step = 'require-jose';
    const { SignJWT } = require('jose');

    step = 'read-body';
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    step = 'check-db-url';
    if (!process.env.DATABASE_URL)
      return res.status(500).json({ error: 'DATABASE_URL not set' });

    step = 'connect-db';
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: { rejectUnauthorized: false } });
    const db = drizzle(pool);

    step = 'define-table';
    const usersTable = pgTable('users', {
      id: serial('id').primaryKey(),
      name: text('name').notNull(),
      email: text('email').notNull(),
      passwordHash: text('password_hash').notNull(),
      createdAt: timestamp('created_at').defaultNow().notNull(),
    });

    step = 'find-user';
    const rows = await db.select().from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase())).limit(1);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    step = 'check-password';
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    step = 'create-token';
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || 'planora-dev-secret-change-in-production'
    );
    const token = await new SignJWT({ userId: user.id, name: user.name, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    res.setHeader('Set-Cookie',
      `planora_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}; Secure`
    );
    return res.status(200).json({ id: user.id, name: user.name, email: user.email });

  } catch (err) {
    console.error(`[login] failed at step "${step}":`, err);
    return res.status(500).json({ error: err.message || 'Internal server error', step, code: err.code });
  }
};

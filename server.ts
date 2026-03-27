import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import type { ChatPreferences, Profile } from './types';
import { appendProfileToGoogleSheet } from './googleSheets';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// Initialize SQLite DB
const db = new Database('app.db');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 8505);

  app.use(express.json());
  app.use(cookieParser());

  // --- API Routes ---

  // Register
  app.post('/api/auth/register', async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (phone, password) VALUES (?, ?)');
      const info = stmt.run(phone, hashedPassword);
      
      const token = jwt.sign({ userId: info.lastInsertRowid, phone }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      res.json({ success: true, user: { id: info.lastInsertRowid, phone } });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    try {
      const stmt = db.prepare('SELECT * FROM users WHERE phone = ?');
      const user = stmt.get(phone) as any;

      if (!user) {
        return res.status(401).json({ error: 'Invalid phone number or password' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid phone number or password' });
      }

      const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      res.json({ success: true, user: { id: user.id, phone: user.phone } });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  // Append full profile (+ chat prefs) to Google Sheet as one dataframe row
  app.post('/api/profile/sheets', async (req, res) => {
    const body = req.body as { profile?: Profile; chatPreferences?: ChatPreferences };
    const profile = body.profile;
    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({ error: 'profile is required' });
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
    const hasCredentials = Boolean(
      process.env.GOOGLE_SHEETS_CREDENTIALS_PATH?.trim() ||
        process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON?.trim() ||
        process.env.GOOGLE_SHEET_API_KEY?.trim() ||
        process.env.GOOGLE_SHEETS_API_KEY?.trim()
    );

    if (!spreadsheetId || !hasCredentials) {
      const missing: string[] = [];
      if (!spreadsheetId) missing.push('GOOGLE_SHEETS_SPREADSHEET_ID');
      if (!hasCredentials) missing.push('GOOGLE_SHEETS_CREDENTIALS_PATH or GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON (service account JSON)');

      console.warn(`[sheets] Missing env: ${missing.join(', ')}; skipping Google Sheet append (local dev).`);
      return res.json({ ok: true, sheetsSkipped: true, missing });
    }

    try {
      await appendProfileToGoogleSheet(profile, body.chatPreferences);
      return res.json({ ok: true, sheetsSkipped: false });
    } catch (err) {
      console.error('[sheets]', err);
      const message = err instanceof Error ? err.message : 'Failed to write to Google Sheet';
      return res.status(500).json({ error: message });
    }
  });

  // Get current user
  app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      res.json({ user: { id: decoded.userId, phone: decoded.phone } });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, '..', 'dist'); // When bundled, it's in dist/server.cjs
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

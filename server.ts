import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import type { ChatPreferences, Profile } from './types';
import type { NextFunction, Request, Response } from 'express';
import { appendProfileToGoogleSheet } from './googleSheets';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

/**
 * When true, HTTP requests from non-private IPs get 403.
 * - PRIVATE_NETWORK_ONLY=true / 1 / yes → always on
 * - PRIVATE_NETWORK_ONLY=false / 0 / no → always off
 * - unset → on when NODE_ENV !== 'production' (local dev / LAN only)
 */
function privateNetworkOnlyEnabled(): boolean {
  const raw = process.env.PRIVATE_NETWORK_ONLY?.trim().toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  return process.env.NODE_ENV === 'production' ? false : true;
}

function normalizeClientIp(raw: string | undefined): string | null {
  if (!raw) return null;
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw;
}

/** RFC1918, loopback, IPv4 link-local, CGNAT (e.g. Tailscale), IPv6 ULA / link-local */
function isPrivateNetworkIp(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase().split('%')[0];
    if (lower === '::1') return true;
    const firstSeg = lower.split(':').filter((s) => s.length > 0)[0];
    if (!firstSeg) return false;
    const word = parseInt(firstSeg, 16);
    if (!Number.isFinite(word)) return false;
    if ((word & 0xffc0) === 0xfe80) return true;
    if ((word & 0xfe00) === 0xfc00) return true;
    return false;
  }
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function privateNetworkGuard(req: Request, res: Response, next: NextFunction) {
  const raw = req.socket.remoteAddress;
  const ip = normalizeClientIp(raw ?? undefined);
  if (!ip || !isPrivateNetworkIp(ip)) {
    console.warn('[server] Blocked non-private client:', raw ?? '(unknown)');
    res.status(403).type('text/plain').send('Forbidden: only private network clients are allowed');
    return;
  }
  next();
}

function openUsersDatabase(): InstanceType<typeof Database> {
  const dbPath =
    process.env.SQLITE_DB_PATH?.trim() || path.join(__dirname, 'app.db');

  try {
    const database = new Database(dbPath);
    database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return database;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sqlite] Failed to open database:', dbPath);
    console.error('[sqlite]', message);
    if (/Cannot find module|NODE_MODULE_VERSION|better_sqlite3/.test(message)) {
      console.error(
        '[sqlite] Native module issue — run: npm install && npm rebuild better-sqlite3'
      );
    }
    if (/locked|SQLITE_BUSY|EBUSY/i.test(message)) {
      console.error(
        '[sqlite] File may be locked (another server instance, sync folder like OneDrive). Set SQLITE_DB_PATH to a path outside cloud sync, e.g. C:\\Temp\\curie-app.db'
      );
    }
    throw err;
  }
}

const db = openUsersDatabase();

/** Where Vite wrote index.html: project dist/ or same folder as bundled dist/server.mjs */
function resolveClientDistDir(): string | null {
  const nested = path.join(__dirname, 'dist');
  if (fs.existsSync(path.join(nested, 'index.html'))) {
    return nested;
  }
  if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    return __dirname;
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 8505);

  if (privateNetworkOnlyEnabled()) {
    app.use(privateNetworkGuard);
    console.log(
      '[server] Private-network-only mode: allowing loopback, RFC1918 LAN, link-local, IPv6 ULA'
    );
  }

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

  // --- Vite dev vs static prod (NODE_ENV=production with no dist → dev middleware so localhost works)
  const clientDist = resolveClientDistDir();
  const serveStaticProd =
    process.env.NODE_ENV === 'production' && clientDist !== null;

  if (!serveStaticProd) {
    if (process.env.NODE_ENV === 'production' && !clientDist) {
      console.warn(
        '[server] NODE_ENV=production but no client build (dist/index.html). Using Vite dev middleware.'
      );
    }
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(clientDist));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

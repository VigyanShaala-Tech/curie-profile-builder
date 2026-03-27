import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import type { ChatPreferences, Profile } from './types';
import { SHEET_COLUMN_HEADERS, profileToDataframeRow } from './profileSheetExport.ts';

function loadServiceAccountJsonRaw(): string {
  const filePath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH?.trim();
  if (filePath) {
    const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    return fs.readFileSync(absolute, 'utf8');
  }
  return (
    process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SHEET_API_KEY ||
    process.env.GOOGLE_SHEETS_API_KEY ||
    ''
  );
}

function getSheetsClient() {
  const rawJson = loadServiceAccountJsonRaw();

  if (!rawJson?.trim()) {
    throw new Error(
      'Missing credentials: set GOOGLE_SHEETS_CREDENTIALS_PATH (path to service account .json) or GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON'
    );
  }

  const trimmed = rawJson.trim();
  if (!trimmed.startsWith('{')) {
    throw new Error(
      'Sheets append requires a service account JSON in GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON (or legacy alias vars). A Google Cloud "API key" (AIza...) cannot be used to write rows—create a service account, download its JSON key, and share your spreadsheet with the service account email.'
    );
  }

  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(trimmed) as { client_email?: string; private_key?: string };
  } catch {
    throw new Error(
      'GOOGLE_SHEETS credentials must be valid JSON (service account key). A simple API key string cannot append rows to Sheets.'
    );
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Service account JSON must include client_email and private_key');
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

function columnNumberToLetter(colNum: number): string {
  let num = colNum;
  let col = '';
  while (num > 0) {
    const rem = (num - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}

/**
 * Upserts one profile row to the configured spreadsheet.
 * - If WhatsApp number already exists, updates that row.
 * - Otherwise inserts a new row.
 * Writes header row on an empty tab.
 */
export async function appendProfileToGoogleSheet(
  profile: Profile,
  chatPreferences: ChatPreferences | undefined
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_SPREADSHEET_ID');
  }

  const tabName = (process.env.GOOGLE_SHEETS_TAB_NAME || 'Sheet1').trim() || 'Sheet1';
  const exportedAt = new Date().toISOString();
  const row = profileToDataframeRow(profile, chatPreferences, exportedAt);
  const headers = [...SHEET_COLUMN_HEADERS];

  const sheets = getSheetsClient();
  const headerRange = `${tabName}!1:1`;

  let firstRowEmpty = true;
  let existingHeaders: string[] = [];
  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });
    const first = existing.data.values?.[0];
    existingHeaders = (first ?? []).map((v) => String(v ?? ''));
    firstRowEmpty = !first || first.every((c) => c === '' || c === undefined || c === null);
  } catch {
    firstRowEmpty = true;
  }

  if (firstRowEmpty) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
    existingHeaders = headers;
  }

  const whatsappIndex = existingHeaders.indexOf('whatsappNumber');
  if (whatsappIndex === -1) {
    throw new Error("Could not find 'whatsappNumber' column in header row.");
  }

  const normalizedPhone = (profile.whatsappNumber || '').trim();
  if (!normalizedPhone) {
    throw new Error('whatsappNumber is required for upsert.');
  }

  const dataRange = `${tabName}!A2:${columnNumberToLetter(existingHeaders.length)}10000`;
  const dataResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: dataRange,
  });
  const dataRows = dataResp.data.values ?? [];

  const existingRowIndex = dataRows.findIndex((r) => String(r[whatsappIndex] ?? '').trim() === normalizedPhone);

  if (existingRowIndex >= 0) {
    const rowNumber = existingRowIndex + 2;
    const updateRange = `${tabName}!A${rowNumber}:${columnNumberToLetter(existingHeaders.length)}${rowNumber}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

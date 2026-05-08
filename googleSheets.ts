import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { INITIAL_CHAT_PREFERENCES, INITIAL_PROFILE } from './types';
import type { ChatPreferences, Profile } from './types';
import {
  SHEET_COLUMN_HEADERS,
  profileToSheetsRowObject,
  type SheetUserType,
} from './profileSheetExport.ts';
import {
  CERTIFICATION_STATUS_OPTIONS,
  EXAM_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  normalizeMilestoneStatus,
} from './constants';

/** Same TTL as Apps Script `CacheService` example (6 hours). */
const CACHE_TTL_MS = 21600 * 1000;

type SheetsApi = ReturnType<typeof getSheetsClient>;

interface PhoneIndexPayload {
  phones: Record<string, true>;
  /** First sheet row (1-based) where each normalized phone appears under `key`. */
  rowByPhone: Record<string, number>;
}

let phoneIndexCache:
  | {
      spreadsheetId: string;
      tabName: string;
      payload: PhoneIndexPayload;
      expiresAt: number;
    }
  | null = null;

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

function normalizeHeaderKey(h: string): string {
  return String(h ?? '').trim().toLowerCase();
}

/** Header-based column index (trim + case-insensitive), same contract as Apps Script sample. */
function getColumnIndexByName(headers: string[], columnName: string): number {
  const target = normalizeHeaderKey(columnName);
  return headers.findIndex((cell) => normalizeHeaderKey(String(cell)) === target);
}

function normalizePhoneDigits(value: string): string {
  return String(value ?? '').replace(/\D/g, '');
}

function parseJsonObject(raw: string | undefined): Record<string, unknown> {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function asString(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item ?? '')).filter(Boolean) : [];
}

function parseMilestoneArray(value: unknown): Array<{ name: string; status: string; details: string; customName: string }> {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const obj = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
    return {
      name: asString(obj.name),
      status: asString(obj.status),
      details: asString(obj.details),
      customName: asString(obj.customName),
    };
  });
}

function parseAcademicStatus(value: unknown): 'studying' | 'graduated' | '' {
  if (value === 'studying' || value === 'graduated') return value;
  return '';
}

function buildHydratedDataFromSheetRow(rowMap: Record<string, string>): {
  profile: Profile;
  chatPreferences: ChatPreferences;
} {
  const profileJson = parseJsonObject(rowMap.profile);
  const chatJson = parseJsonObject(rowMap.chat_settings);
  const identityJson = parseJsonObject(rowMap.identity);
  const academicsJson = parseJsonObject(rowMap.academics);
  const reflectionsJson = parseJsonObject(rowMap.reflections);

  const currentLocation =
    typeof profileJson.current_location === 'object' && profileJson.current_location !== null
      ? (profileJson.current_location as Record<string, unknown>)
      : {};
  const location = [currentLocation.city, currentLocation.state, currentLocation.country]
    .map((part) => asString(part).trim())
    .filter(Boolean)
    .join(', ');

  const profile: Profile = {
    ...INITIAL_PROFILE,
    fullName: `${asString(profileJson.first_name)} ${asString(profileJson.last_name)}`.trim(),
    gender: asString(profileJson.gender),
    email: asString(profileJson.email || identityJson.email),
    whatsappNumber: asString(rowMap.key),
    location,
    academicStatus: parseAcademicStatus(profileJson.academic_status || academicsJson.academic_status),
    degreeType: asString(profileJson.degree || academicsJson.degree),
    yearOfStudy: asString(profileJson.year_of_study || academicsJson['year of study']),
    graduationYear: asString(profileJson.graduation_year || academicsJson['graduation year']),
    topLevelCategory: asString(profileJson.stream || academicsJson.stream),
    specializationCategory: asString(profileJson.subject_area || academicsJson.subject_area),
    customCategory: '',
    specialization: asString(profileJson.subject_specialization || academicsJson.subject_specialization),
    customSpecialization: '',
    collegeName: asString(profileJson.institution || academicsJson.institution),
    cgpa: asString(profileJson.cgpa_or_percent || academicsJson.cgpa_or_percent),
    subjectSkills: asStringArray(profileJson.subject_knowledge),
    toolSkills: asStringArray(profileJson.tech_tools_and_it_skills),
    aiSkills: asStringArray(profileJson.ai_and_data_skills),
    professionalSkills: asStringArray(profileJson.professional_skills),
    interests: asStringArray(profileJson.academic_interests),
    projects: parseMilestoneArray(profileJson.projects).map((p) => ({
      ...p,
      status: normalizeMilestoneStatus(p.status, PROJECT_STATUS_OPTIONS),
    })),
    exams: parseMilestoneArray(profileJson.exams).map((e) => ({
      ...e,
      status: normalizeMilestoneStatus(e.status, EXAM_STATUS_OPTIONS),
    })),
    certifications: parseMilestoneArray(profileJson.certifications).map((c) => ({
      ...c,
      status: normalizeMilestoneStatus(c.status, CERTIFICATION_STATUS_OPTIONS),
    })),
    reflections: {
      impactPurpose: asString(profileJson.purpose || reflectionsJson.purpose),
      strengths: asString(profileJson.strengths || reflectionsJson.strengths),
      curiosity: asString(profileJson.curiosity),
      grittyGrowth: asString(profileJson.challenges || reflectionsJson.challenges),
      spark: asString(profileJson.actions || reflectionsJson.actions),
      opportunities: asString(profileJson.opportunities || reflectionsJson.opportunities),
      threats: asString(profileJson.barriers || reflectionsJson.barriers),
    },
    lastSyncedAt: undefined,
  };

  const responseLength = asString((chatJson.response_length ?? profileJson.response_length) as unknown);
  const responseFormat = asString((chatJson.response_format ?? profileJson.response_format) as unknown);
  const chatPreferences: ChatPreferences = {
    ...INITIAL_CHAT_PREFERENCES,
    responseLength:
      responseLength === 'short' || responseLength === 'short-examples' || responseLength === 'detailed'
        ? responseLength
        : '',
    responseFormat: responseFormat === 'bullets' || responseFormat === 'paragraphs' || responseFormat === 'mix'
      ? responseFormat
      : '',
  };

  return { profile, chatPreferences };
}

function getPhoneCache(spreadsheetId: string, tabName: string): PhoneIndexPayload | null {
  const now = Date.now();
  if (
    !phoneIndexCache ||
    phoneIndexCache.spreadsheetId !== spreadsheetId ||
    phoneIndexCache.tabName !== tabName ||
    now > phoneIndexCache.expiresAt
  ) {
    return null;
  }
  return phoneIndexCache.payload;
}

function putPhoneCache(spreadsheetId: string, tabName: string, payload: PhoneIndexPayload): void {
  phoneIndexCache = {
    spreadsheetId,
    tabName,
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}

function buildPhoneCacheFromKeyColumn(values: string[][]): PhoneIndexPayload {
  const phones: Record<string, true> = {};
  const rowByPhone: Record<string, number> = {};
  for (let i = 0; i < values.length; i++) {
    const phone = normalizePhoneDigits(String(values[i]?.[0] ?? ''));
    if (!phone) continue;
    phones[phone] = true;
    if (rowByPhone[phone] === undefined) {
      rowByPhone[phone] = i + 2;
    }
  }
  return { phones, rowByPhone };
}

async function fetchKeyColumnValues(
  sheets: SheetsApi,
  spreadsheetId: string,
  tabName: string,
  keyColLetter: string
): Promise<string[][]> {
  const range = `${tabName}!${keyColLetter}2:${keyColLetter}`;
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return resp.data.values ?? [];
}

async function fetchSheetHeaders(
  sheets: SheetsApi,
  spreadsheetId: string,
  tabName: string
): Promise<string[]> {
  const headerRange = `${tabName}!1:1`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });
  return (existing.data.values?.[0] ?? []).map((v) => String(v ?? ''));
}

function sheetHeadersInclude(headers: string[], name: string): boolean {
  return getColumnIndexByName(headers, name) !== -1;
}

const BASE_REQUIRED_HEADERS = SHEET_COLUMN_HEADERS.filter((h) => h !== 'user_type');

function rowValuesAlignedToSheetHeaders(sheetHeaders: string[], rowMap: Record<string, string>): string[] {
  return sheetHeaders.map((headerCell) => {
    const canon = SHEET_COLUMN_HEADERS.find(
      (sh) => normalizeHeaderKey(String(sh)) === normalizeHeaderKey(String(headerCell))
    );
    const raw = canon ? rowMap[canon] : '';
    return raw === undefined || raw === null ? '' : String(raw);
  });
}

function parseTopRowFromUpdatedRange(range: string | null | undefined): number | null {
  if (!range) return null;
  const m = range.match(/![A-Za-z]+(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Upserts one profile row to Sheet3.
 * - Phone column is resolved dynamically by header name `key`.
 * - Phone index cache (6h TTL) avoids extra sheet reads for returning users when warm.
 * - Adds / fills `user_type` as `new` | `returning` based on Sheet3 presence before write.
 */
export async function appendProfileToGoogleSheet(
  profile: Profile,
  chatPreferences: ChatPreferences | undefined
): Promise<{ userType: SheetUserType }> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_SPREADSHEET_ID');
  }

  const tabName = 'Sheet3';
  const exportedAt = new Date().toISOString();

  const whatsappRaw = (profile.whatsappNumber || '').trim();
  if (!whatsappRaw) throw new Error('whatsappNumber is required for upsert.');
  const normalizedPhoneKey = normalizePhoneDigits(whatsappRaw);

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
    const headers = [...SHEET_COLUMN_HEADERS];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
    existingHeaders = headers;
  } else {
    const missingBase = BASE_REQUIRED_HEADERS.filter((h) => !sheetHeadersInclude(existingHeaders, h));
    if (missingBase.length) {
      throw new Error(`[sheets] Sheet3 header missing required columns: ${missingBase.join(', ')}`);
    }
    if (!sheetHeadersInclude(existingHeaders, 'user_type')) {
      const nextCol = existingHeaders.length + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!${columnNumberToLetter(nextCol)}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['user_type']] },
      });
      existingHeaders = [...existingHeaders, 'user_type'];
    }
  }

  const phoneColumnIndex = getColumnIndexByName(existingHeaders, 'key');
  if (phoneColumnIndex === -1) {
    throw new Error('[sheets] Column "key" not found in Sheet3');
  }

  const keyColLetter = columnNumberToLetter(phoneColumnIndex + 1);

  let payload = getPhoneCache(spreadsheetId, tabName);
  let loadedPhoneColumnFresh = false;
  if (!payload) {
    const vals = await fetchKeyColumnValues(sheets, spreadsheetId, tabName, keyColLetter);
    payload = buildPhoneCacheFromKeyColumn(vals);
    putPhoneCache(spreadsheetId, tabName, payload);
    loadedPhoneColumnFresh = true;
  }

  let isReturning = !!payload.phones[normalizedPhoneKey];
  let sheetRowForPhone = payload.rowByPhone[normalizedPhoneKey];

  if (isReturning && sheetRowForPhone === undefined) {
    const vals = await fetchKeyColumnValues(sheets, spreadsheetId, tabName, keyColLetter);
    payload = buildPhoneCacheFromKeyColumn(vals);
    putPhoneCache(spreadsheetId, tabName, payload);
    isReturning = !!payload.phones[normalizedPhoneKey];
    sheetRowForPhone = payload.rowByPhone[normalizedPhoneKey];
  } else if (!isReturning && !loadedPhoneColumnFresh) {
    const vals = await fetchKeyColumnValues(sheets, spreadsheetId, tabName, keyColLetter);
    payload = buildPhoneCacheFromKeyColumn(vals);
    putPhoneCache(spreadsheetId, tabName, payload);
    isReturning = !!payload.phones[normalizedPhoneKey];
    sheetRowForPhone = payload.rowByPhone[normalizedPhoneKey];
  }

  if (isReturning && sheetRowForPhone === undefined) {
    throw new Error('[sheets] Could not resolve Sheet3 row for existing key; refusing ambiguous write.');
  }

  const userType: SheetUserType = isReturning ? 'returning' : 'new';
  const rowMap = profileToSheetsRowObject(profile, chatPreferences, exportedAt, userType);
  const row = rowValuesAlignedToSheetHeaders(existingHeaders, rowMap);

  function normalizeRowValue(v: string): string {
    return v === undefined || v === null ? '' : String(v);
  }

  const formattedData: Record<string, string> = {
    key: rowMap.key ?? '',
    first_name: rowMap.first_name ?? '',
    last_name: rowMap.last_name ?? '',
    identity: rowMap.identity ?? '',
    academics: rowMap.academics ?? '',
    skills_interests: rowMap.skills_interests ?? '',
    milestones: rowMap.milestones ?? '',
    reflections: rowMap.reflections ?? '',
    chat_settings: rowMap.chat_settings ?? '',
    profile: rowMap.profile ?? '',
    user_type: rowMap.user_type ?? '',
  };

  const jsonFields = [
    'identity',
    'academics',
    'skills_interests',
    'milestones',
    'reflections',
    'chat_settings',
    'profile',
  ] as const;

  function validateJsonFields(payload: Record<string, string>) {
    for (const field of jsonFields) {
      const value = payload[field];
      if (typeof value !== 'string') {
        throw new Error(`[sheets] ${field} must be a stringified JSON value`);
      }
      if (value.includes('[object Object]')) {
        throw new Error(`[sheets] ${field} contains "[object Object]"`);
      }
      JSON.parse(value);
    }
    for (const [k, v] of Object.entries(payload)) {
      if (typeof v === 'string' && v.includes('[object Object]')) {
        throw new Error(`[sheets] ${k} contains "[object Object]"`);
      }
    }
  }

  if (isReturning && sheetRowForPhone !== undefined) {
    const updateRange = `${tabName}!A${sheetRowForPhone}:${columnNumberToLetter(existingHeaders.length)}${sheetRowForPhone}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'RAW',
      requestBody: { values: [row.map(normalizeRowValue)] },
    });
    payload.phones[normalizedPhoneKey] = true;
    payload.rowByPhone[normalizedPhoneKey] = sheetRowForPhone;
    putPhoneCache(spreadsheetId, tabName, payload);
    console.log('Final Payload:', formattedData);
    validateJsonFields(formattedData);
    return { userType };
  }

  const appendResp = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A:A`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row.map(normalizeRowValue)] },
  });

  const appendedRow =
    parseTopRowFromUpdatedRange(appendResp.data.updates?.updatedRange ?? undefined) ??
    parseTopRowFromUpdatedRange(appendResp.data.tableRange ?? undefined);

  payload.phones[normalizedPhoneKey] = true;
  if (appendedRow !== null) {
    payload.rowByPhone[normalizedPhoneKey] = appendedRow;
  }
  putPhoneCache(spreadsheetId, tabName, payload);

  console.log('Final Payload:', formattedData);
  validateJsonFields(formattedData);
  return { userType };
}

export interface ExistingUserLookupResult {
  rowNumber: number;
  profile: Profile;
  chatPreferences: ChatPreferences;
}

export async function findUserByPhone(phone: string): Promise<ExistingUserLookupResult | null> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  if (!spreadsheetId) return null;

  const hasCredentials = Boolean(
    process.env.GOOGLE_SHEETS_CREDENTIALS_PATH?.trim() ||
      process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_SHEET_API_KEY?.trim() ||
      process.env.GOOGLE_SHEETS_API_KEY?.trim()
  );
  if (!hasCredentials) return null;

  const normalizedPhoneKey = normalizePhoneDigits(phone);
  if (!normalizedPhoneKey) return null;

  const tabName = 'Sheet3';
  const sheets = getSheetsClient();
  const headers = await fetchSheetHeaders(sheets, spreadsheetId, tabName);
  if (!headers.length) return null;

  const phoneColumnIndex = getColumnIndexByName(headers, 'key');
  if (phoneColumnIndex === -1) return null;
  const keyColLetter = columnNumberToLetter(phoneColumnIndex + 1);

  let payload = getPhoneCache(spreadsheetId, tabName);
  if (!payload) {
    const vals = await fetchKeyColumnValues(sheets, spreadsheetId, tabName, keyColLetter);
    payload = buildPhoneCacheFromKeyColumn(vals);
    putPhoneCache(spreadsheetId, tabName, payload);
  }

  let rowNumber = payload.rowByPhone[normalizedPhoneKey];
  if (!rowNumber) {
    const vals = await fetchKeyColumnValues(sheets, spreadsheetId, tabName, keyColLetter);
    payload = buildPhoneCacheFromKeyColumn(vals);
    putPhoneCache(spreadsheetId, tabName, payload);
    rowNumber = payload.rowByPhone[normalizedPhoneKey];
  }
  if (!rowNumber) return null;

  const rowRange = `${tabName}!A${rowNumber}:${columnNumberToLetter(headers.length)}${rowNumber}`;
  const rowResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: rowRange,
  });
  const rowValues = rowResp.data.values?.[0] ?? [];
  const rowMap = headers.reduce<Record<string, string>>((acc, header, idx) => {
    acc[header] = String(rowValues[idx] ?? '');
    return acc;
  }, {});

  const { profile, chatPreferences } = buildHydratedDataFromSheetRow(rowMap);
  return { rowNumber, profile, chatPreferences };
}

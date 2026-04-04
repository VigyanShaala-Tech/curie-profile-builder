import type { ChatPreferences, Profile } from './types';

/**
 * Required/analytics-ready schema for Google Sheets rows.
 * Note: when the sheet already has headers, we always align row values to those existing headers.
 */
export const SHEET_COLUMN_HEADERS = [
  'key',
  'first_name',
  'last_name',
  'identity',
  'academics',
  'skills_interests',
  'milestones',
  'reflections',
  'chat_settings',
] as const;

function normalizeString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function safeJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

function splitFirstLast(fullName: string): { first: string; last: string } {
  const cleaned = (fullName || '').trim();
  if (!cleaned) return { first: '', last: '' };
  const parts = cleaned.split(/\s+/);
  const first = parts[0] || '';
  const last = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return { first, last };
}

function parseLocation(location: string): { city: string; state: string; country: string } {
  const raw = (location || '').trim();
  if (!raw) return { city: '', state: '', country: '' };
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const city = parts[0] || '';
  const state = parts[1] || '';
  const country = parts[2] || '';
  return { city, state, country };
}

function profileToSheetsRowObject(
  profile: Profile,
  chatPreferences: ChatPreferences | undefined,
  _exportedAt: string
): Record<string, string> {
  const { first, last } = splitFirstLast(profile.fullName);
  const key = normalizeString(profile.whatsappNumber).trim();
  const current_location = parseLocation(profile.location);

  const subjectArea =
    profile.specializationCategory === 'Other' ? profile.customCategory : profile.specializationCategory;
  const subjectSpecialization =
    profile.specialization === 'Other' ? profile.customSpecialization : profile.specialization;

  const academics = {
    academic_status: normalizeString(profile.academicStatus),
    degree: normalizeString(profile.degreeType),
    // Requirement explicitly asks for these exact key spellings inside the JSON.
    'year of study': profile.academicStatus === 'studying' ? normalizeString(profile.yearOfStudy) : '',
    'graduation year': profile.academicStatus === 'graduated' ? normalizeString(profile.graduationYear) : '',
    stream: normalizeString(profile.topLevelCategory),
    subject_area: normalizeString(subjectArea),
    subject_specialization: normalizeString(subjectSpecialization),
    institution: normalizeString(profile.collegeName),
    cgpa_or_percent: normalizeString(profile.cgpa),
  };

  const skills_interests = {
    subject_knowledge: profile.subjectSkills ?? [],
    tech_tools_and_it_skills: profile.toolSkills ?? [],
    ai_and_data_skills: profile.aiSkills ?? [],
    professional_skills: profile.professionalSkills ?? [],
    academic_interests: profile.interests ?? [],
  };

  const milestones = {
    projects: (profile.projects ?? []).map((p) => ({
      name: normalizeString(p.name),
      status: normalizeString(p.status ?? ''),
      details: normalizeString(p.details ?? ''),
    })),
    exams: (profile.exams ?? []).map((e) => ({
      name: normalizeString(e.name),
      status: normalizeString(e.status ?? ''),
      details: normalizeString(e.details ?? ''),
    })),
    certifications: (profile.certifications ?? []).map((c) => ({
      name: normalizeString(c.name),
      status: normalizeString(c.status ?? ''),
      details: normalizeString(c.details ?? ''),
    })),
  };

  const r = profile.reflections;
  const reflections = {
    purpose: normalizeString(r.impactPurpose),
    strengths: normalizeString(r.strengths),
    challenges: normalizeString(r.grittyGrowth),
    actions: normalizeString(r.spark),
    opportunities: normalizeString(r.opportunities),
    barriers: normalizeString(r.threats),
  };

  const chat_settings = {
    response_length: normalizeString(chatPreferences?.responseLength ?? ''),
    response_format: normalizeString(chatPreferences?.responseFormat ?? ''),
  };

  const row: Record<string, string> = {
    key,
    first_name: first,
    last_name: last,
    identity: safeJson({
      gender: normalizeString(profile.gender),
      email: normalizeString(profile.email),
      current_location,
    }),
    academics: safeJson(academics),
    skills_interests: safeJson(skills_interests),
    milestones: safeJson(milestones),
    reflections: safeJson(reflections),
    chat_settings: safeJson(chat_settings),
  };

  return row;
}

export function profileToDataframeRow(
  profile: Profile,
  chatPreferences: ChatPreferences | undefined,
  exportedAt: string
): string[] {
  // Backward-compatible helper: old googleSheets.ts expects a string[].
  // New googleSheets.ts aligns by headers; this function can remain for compatibility.
  const map = profileToSheetsRowObject(profile, chatPreferences, exportedAt);
  return Object.values(map);
}

export { profileToSheetsRowObject };

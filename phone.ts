export function normalizePhone(phone: string): string {
  return String(phone ?? '')
    .replace(/[^\d]/g, '')
    .trim();
}

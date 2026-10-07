// Returns E.164 (`+79991234567`) or null. Russian local forms (8…, 7…,
// 10 digits starting with 9) are mapped to +7; the server still runs full
// IsPhoneNumber validation, this only catches obvious typos before a request.
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (hasPlus) {
    return /^\d{11,15}$/.test(digits) ? `+${digits}` : null;
  }
  if (/^[78]\d{10}$/.test(digits)) {
    return `+7${digits.slice(1)}`;
  }
  if (/^9\d{9}$/.test(digits)) {
    return `+7${digits}`;
  }
  return null;
}

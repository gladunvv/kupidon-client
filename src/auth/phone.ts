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

export function formatPhoneInput(input: string): string {
  let digits = input.replace(/\D/g, '').slice(0, 15);
  if (!digits) return input.includes('+') ? '+' : '';
  if (!input.trim().startsWith('+') && digits.startsWith('9'))
    digits = `7${digits}`;
  if (!input.trim().startsWith('+') && digits.startsWith('8'))
    digits = `7${digits.slice(1)}`;
  if (!digits.startsWith('7') || digits.length > 11) return `+${digits}`;
  return [
    '+7',
    digits.slice(1, 4),
    digits.slice(4, 7),
    digits.slice(7, 9),
    digits.slice(9, 11),
  ]
    .filter(Boolean)
    .join(' ');
}

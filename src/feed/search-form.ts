import type { Gender, SearchPreferences } from '@/types/user';

export interface SearchFormValues {
  minAge: string;
  maxAge: string;
  maxDistance: string;
  genders: Gender[];
}

export type SearchFormErrors = Partial<
  Record<'minAge' | 'maxAge' | 'maxDistance', string>
>;

export type SearchPreferencesPayload = Omit<SearchPreferences, '_id'>;

export function toSearchForm(prefs: SearchPreferences): SearchFormValues {
  return {
    minAge: String(prefs.minAge),
    maxAge: String(prefs.maxAge),
    maxDistance: String(prefs.maxDistance),
    genders: prefs.genders,
  };
}

// The api replaces searchPreferences wholesale (fields left out fall back to
// defaults) and doesn't check minAge <= maxAge, so the payload always carries
// all four fields and the range is validated here.
export function buildSearchPreferences(values: SearchFormValues): {
  errors: SearchFormErrors;
  payload: SearchPreferencesPayload | null;
} {
  const errors: SearchFormErrors = {};
  const int = (
    field: keyof SearchFormErrors,
    min: number,
    max: number,
  ): number | null => {
    const raw = values[field].trim();
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || value < min || value > max) {
      errors[field] = `Целое число от ${min} до ${max}`;
      return null;
    }
    return value;
  };

  const minAge = int('minAge', 18, 100);
  const maxAge = int('maxAge', 18, 100);
  const maxDistance = int('maxDistance', 1, 500);
  if (minAge !== null && maxAge !== null && minAge > maxAge) {
    errors.maxAge = '«До» не может быть меньше «от»';
  }

  if (Object.keys(errors).length > 0) {
    return { errors, payload: null };
  }
  return {
    errors,
    payload: {
      minAge: minAge!,
      maxAge: maxAge!,
      maxDistance: maxDistance!,
      genders: values.genders,
    },
  };
}

// ~1.1 km precision. Other users receive `distance` in metres; with an exact
// position stored, repeated queries from spoofed points could trilaterate it.
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

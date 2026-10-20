import type { Profile, UpdateProfilePayload } from '@/types/user';

export interface ProfileFormValues {
  name: string;
  age: string;
  gender: string;
  about: string;
  occupation: string;
  education: string;
  height: string;
}

export type ProfileFormErrors = Partial<
  Record<keyof ProfileFormValues, string>
>;

export function toFormValues(profile: Profile): ProfileFormValues {
  return {
    name: profile.name ?? '',
    age: profile.age?.toString() ?? '',
    gender: profile.gender ?? '',
    about: profile.about ?? '',
    occupation: profile.occupation ?? '',
    education: profile.education ?? '',
    height: profile.height?.toString() ?? '',
  };
}

// Limits mirror api's UpdateProfileDto so obvious mistakes never cost a
// round-trip; the server still validates. Empty age/height are omitted —
// the api has no way to unset a number, so they keep their stored value.
export function buildProfilePayload(values: ProfileFormValues): {
  errors: ProfileFormErrors;
  payload: UpdateProfilePayload;
} {
  const errors: ProfileFormErrors = {};
  const payload: UpdateProfilePayload = {};

  const text = (
    field: 'name' | 'about' | 'occupation' | 'education',
    max: number,
  ) => {
    const value = values[field].trim();
    if (value.length > max) {
      errors[field] = `Не больше ${max} символов`;
    } else {
      payload[field] = value;
    }
  };
  text('name', 50);
  text('about', 500);
  text('occupation', 100);
  text('education', 100);

  const integer = (field: 'age' | 'height', min: number, max: number) => {
    const raw = values[field].trim();
    if (raw === '') return;
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || value < min || value > max) {
      errors[field] = `Целое число от ${min} до ${max}`;
    } else {
      payload[field] = value;
    }
  };
  integer('age', 18, 100);
  integer('height', 150, 220);

  if (values.gender === 'male' || values.gender === 'female') {
    payload.gender = values.gender;
  }

  return { errors, payload };
}

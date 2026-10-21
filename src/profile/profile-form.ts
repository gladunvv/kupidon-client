import type { City, LifestyleOption } from '@/types/reference';
import type { Profile, UpdateProfilePayload } from '@/types/user';

export interface ProfileFormValues {
  name: string;
  age: string;
  gender: string;
  about: string;
  occupation: string;
  education: string;
  height: string;
  city: City | null;
  interests: string[];
  goals: string[];
  lifestyleOptions: string[];
}

type TextField = Exclude<
  keyof ProfileFormValues,
  'city' | 'interests' | 'goals' | 'lifestyleOptions'
>;

export type ProfileFormErrors = Partial<Record<TextField, string>>;

export function toFormValues(profile: Profile): ProfileFormValues {
  return {
    name: profile.name ?? '',
    age: profile.age?.toString() ?? '',
    gender: profile.gender ?? '',
    about: profile.about ?? '',
    occupation: profile.occupation ?? '',
    education: profile.education ?? '',
    height: profile.height?.toString() ?? '',
    city: profile.city ?? null,
    interests: profile.interests.map((item) => item._id),
    goals: profile.goals.map((item) => item._id),
    lifestyleOptions: profile.lifestyleOptions.map((item) => item._id),
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

  // city is validated as a Mongo id by the api, so it can be changed but not
  // cleared; reference arrays can be sent empty to clear them.
  if (values.city) {
    payload.city = values.city._id;
  }
  payload.interests = values.interests;
  payload.goals = values.goals;
  payload.lifestyleOptions = values.lifestyleOptions;

  return { errors, payload };
}

export function toggleId(selected: string[], id: string): string[] {
  return selected.includes(id)
    ? selected.filter((item) => item !== id)
    : [...selected, id];
}

// One option per lifestyle category (e.g. a single answer for "Алкоголь"):
// picking an option replaces whatever was chosen in its category, picking the
// chosen one again clears the category.
export function selectLifestyleOption(
  selected: string[],
  option: LifestyleOption,
  allOptions: LifestyleOption[],
): string[] {
  const categoryId = option.category?._id;
  const sameCategory = new Set(
    allOptions
      .filter((item) => item.category?._id === categoryId)
      .map((item) => item._id),
  );
  const rest = selected.filter((id) => !sameCategory.has(id));
  return selected.includes(option._id) ? rest : [...rest, option._id];
}

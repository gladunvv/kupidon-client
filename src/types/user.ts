export type Gender = 'male' | 'female' | 'other';

export interface SearchPreferences {
  _id?: string;
  minAge: number;
  maxAge: number;
  maxDistance: number;
  genders: Gender[];
}

export interface User {
  _id: string;
  name?: string;
  age?: number;
  gender?: Gender;
  about?: string;
  phone: string;
  photos: string[];
  city?: string;
  interests: string[];
  goals: string[];
  lifestyleOptions: string[];
  occupation?: string;
  education?: string;
  height?: number;
  isActive: boolean;
  isVerified: boolean;
  lastActiveAt?: string;
  searchPreferences: SearchPreferences;
  // Mongoose schema quirk: a String-typed `locationType` prop whose own
  // options object uses the key `type` serializes as `{ type: 'Point' }`,
  // not the bare string the schema's TS annotation suggests. Confirmed
  // against a real verify-otp response, not assumed from the schema file.
  locationType?: { type: 'Point' };
  coordinates?: number[];
}

// Mirrors api's UpdateProfileDto (src/users/dto/update-profile.dto.ts).
// Photos are intentionally absent — written only by upload endpoints.
export interface UpdateProfilePayload {
  name?: string;
  age?: number;
  gender?: Exclude<Gender, 'other'>;
  about?: string;
  city?: string;
  interests?: string[];
  goals?: string[];
  lifestyleOptions?: string[];
  occupation?: string;
  education?: string;
  height?: number;
  coordinates?: number[];
}

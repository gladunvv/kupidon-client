import type { Gender } from '@/types/user';

// Shape of /users/list items: api's PUBLIC_USER_PROJECTION (users.service.ts).
// Unlike the own profile, references are not populated: `city`/`goals` are
// ids, while `interests` are already resolved to their labels.
export interface Candidate {
  _id: string;
  name?: string;
  age?: number;
  gender?: Gender;
  about?: string;
  photos: string[];
  city?: string;
  interests?: string[];
  goals?: string[];
  lifestyleOptions?: string[];
  occupation?: string;
  education?: string;
  height?: number;
  isVerified?: boolean;
  lastActiveAt?: string;
  // Metres; present only when the viewer has coordinates.
  distance?: number;
}

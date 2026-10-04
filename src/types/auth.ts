import type { User } from '@/types/user';

export interface RequestOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

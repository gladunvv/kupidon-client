import { apiRequest } from '@/api/client';
import type {
  AuthResponse,
  RequestOtpPayload,
  VerifyOtpPayload,
} from '@/types/auth';

export function requestOtp(payload: RequestOtpPayload): Promise<void> {
  return apiRequest<void>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function refreshToken(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/refresh-token', { method: 'POST' });
}

export function logout(): Promise<null> {
  return apiRequest<null>('/auth/logout', { method: 'POST' });
}

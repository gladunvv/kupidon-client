import { env } from '@/config/env';
import {
  getAccessToken,
  getSession,
  signIn,
  signOut,
} from '@/auth/session-store';
import type { ApiResponse } from '@/types/api';
import type { AuthResponse } from '@/types/auth';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string | undefined;
  readonly details: unknown;

  constructor(
    message: string,
    code: string,
    status: number,
    requestId: string | undefined,
    details: unknown = undefined,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}

async function send<T>(
  path: string,
  init: RequestInit,
  accessToken: string | null,
): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(
      body.message,
      body.error.code,
      response.status,
      body.meta?.requestId,
      body.error.details,
    );
  }

  return body.data;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = getAccessToken();
  try {
    return await send<T>(path, init, accessToken);
  } catch (error) {
    const expired =
      accessToken && error instanceof ApiError && error.status === 401;
    if (expired && (await refreshSession())) {
      return send<T>(path, init, getAccessToken());
    }
    throw error;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

// The api rotates the refresh token on every call and clears the cookie when
// it sees a stale one. Two overlapping refreshes (concurrent 401s, two tabs)
// would let the loser wipe the cookie the winner just set — so refreshes run
// one at a time: a shared promise within the tab, a Web Lock across tabs.
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= withRefreshLock(doRefresh).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function withRefreshLock(fn: () => Promise<boolean>): Promise<boolean> {
  return navigator.locks
    ? navigator.locks.request('kupidon-auth-refresh', fn)
    : fn();
}

async function doRefresh(): Promise<boolean> {
  try {
    signIn(
      await send<AuthResponse>('/auth/refresh-token', { method: 'POST' }, null),
    );
    return true;
  } catch (error) {
    const rejected = error instanceof ApiError && error.status === 401;
    if (rejected || getSession().status === 'loading') {
      signOut(
        error instanceof ApiError && error.code === 'SESSION_REPLACED'
          ? 'session-replaced'
          : undefined,
      );
    }
    return false;
  }
}

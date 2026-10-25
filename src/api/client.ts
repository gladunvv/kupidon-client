import { env } from '@/config/env';
import {
  getAccessToken,
  getSession,
  signIn,
  signOut,
} from '@/auth/session-store';
import type {
  ApiResponse,
  PaginationMeta,
  SuccessApiResponse,
} from '@/types/api';
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

function unwrap<T>(
  body: ApiResponse<T>,
  status: number,
): SuccessApiResponse<T> {
  if (!body.success) {
    throw new ApiError(
      body.message,
      body.error.code,
      status,
      body.meta?.requestId,
      body.error.details,
    );
  }
  return body;
}

async function send<T>(
  path: string,
  init: RequestInit,
  accessToken: string | null,
): Promise<SuccessApiResponse<T>> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  return unwrap((await response.json()) as ApiResponse<T>, response.status);
}

// XHR instead of fetch: fetch exposes no upload progress. Content-Type is
// left to the browser so the multipart boundary is set correctly.
function sendWithProgress<T>(
  path: string,
  body: FormData,
  accessToken: string | null,
  onProgress?: (fraction: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${env.apiUrl}${path}`);
    xhr.withCredentials = true;
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      try {
        resolve(
          unwrap(JSON.parse(xhr.responseText) as ApiResponse<T>, xhr.status)
            .data,
        );
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.send(body);
  });
}

async function withAuthRetry<T>(
  run: (accessToken: string | null) => Promise<T>,
): Promise<T> {
  const accessToken = getAccessToken();
  try {
    return await run(accessToken);
  } catch (error) {
    const expired =
      accessToken && error instanceof ApiError && error.status === 401;
    if (expired && (await refreshSession())) {
      return run(getAccessToken());
    }
    throw error;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return (await withAuthRetry((token) => send<T>(path, init, token))).data;
}

export interface Page<T> {
  items: T[];
  pagination: PaginationMeta;
}

export async function apiRequestPage<T>(path: string): Promise<Page<T>> {
  const body = await withAuthRetry((token) => send<T[]>(path, {}, token));
  if (!body.meta?.pagination) {
    throw new Error(`Expected meta.pagination in response for ${path}`);
  }
  return { items: body.data, pagination: body.meta.pagination };
}

export function apiUpload<T>(
  path: string,
  body: FormData,
  onProgress?: (fraction: number) => void,
): Promise<T> {
  return withAuthRetry((token) =>
    sendWithProgress<T>(path, body, token, onProgress),
  );
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
    const body = await send<AuthResponse>(
      '/auth/refresh-token',
      { method: 'POST' },
      null,
    );
    signIn(body.data);
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

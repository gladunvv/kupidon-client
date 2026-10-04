import { env } from '@/config/env';
import type { ApiResponse } from '@/types/api';

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

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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

import { ApiError } from './errors.ts';
import type { SuccessApiResponse } from '@/types/api';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Both fetch and XHR use the same envelope and HTTP status checks. A proxy
// may return HTML or an empty error body instead of the API's JSON envelope.
export function parseApiResponse<T>(
  text: string,
  status: number,
  headerRequestId?: string,
): SuccessApiResponse<T> {
  const invalid = (requestId = headerRequestId) =>
    new ApiError(
      'Invalid API response',
      status >= 400 ? 'HTTP_ERROR' : 'INVALID_RESPONSE',
      status,
      requestId,
    );
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw invalid();
  }
  if (!isRecord(body)) throw invalid();
  const requestId =
    isRecord(body.meta) && typeof body.meta.requestId === 'string'
      ? body.meta.requestId
      : headerRequestId;
  if (
    body.success === false &&
    isRecord(body.error) &&
    typeof body.error.code === 'string'
  ) {
    throw new ApiError(
      typeof body.message === 'string' ? body.message : 'API request failed',
      body.error.code,
      status,
      requestId,
      body.error.details,
    );
  }
  if (
    body.success !== true ||
    status < 200 ||
    status >= 300 ||
    typeof body.message !== 'string'
  )
    throw invalid(requestId);
  // A void endpoint can omit data: JSON serialization drops undefined.
  return body as unknown as SuccessApiResponse<T>;
}

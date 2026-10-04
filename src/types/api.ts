export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface SuccessApiResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: ResponseMeta;
}

export interface ErrorApiResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
  meta?: ResponseMeta;
}

export type ApiResponse<T> = SuccessApiResponse<T> | ErrorApiResponse;

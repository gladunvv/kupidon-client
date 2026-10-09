import { ApiError } from '@/api/client';

const MESSAGES: Record<string, string> = {
  TOO_MANY_OTP_REQUESTS: 'Слишком много запросов кода. Попробуйте позже',
  BAD_REQUEST: 'Проверьте введённые данные',
  VALIDATION_ERROR: 'Проверьте введённые данные',
  INTERNAL_SERVER_ERROR: 'Сервер временно недоступен. Попробуйте позже',
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code] ?? 'Что-то пошло не так. Попробуйте ещё раз';
  }
  return 'Нет соединения с сервером. Проверьте интернет';
}

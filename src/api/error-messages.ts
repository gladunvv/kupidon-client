import { ApiError } from '@/api/client';

const MESSAGES: Record<string, string> = {
  TOO_MANY_OTP_REQUESTS: 'Слишком много запросов кода. Попробуйте позже',
  INVALID_OTP: 'Неверный или устаревший код',
  MAX_PHOTOS_EXCEEDED: 'Можно загрузить не больше 5 фото',
  FILE_TOO_LARGE: 'Файл больше 5 МБ',
  TOO_MANY_FILES: 'Слишком много файлов за раз',
  INVALID_IMAGE: 'Файл повреждён или это не изображение',
  IMAGE_RESOLUTION_TOO_LOW:
    'Слишком маленькое изображение — нужно от 200×200 px',
  PHOTO_UPLOAD_FAILED: 'Не удалось сохранить фото. Попробуйте ещё раз',
  PHOTO_COUNT_MISMATCH: 'Фото изменились в другом окне — список обновлён',
  INVALID_PHOTOS: 'Фото изменились в другом окне — список обновлён',
  OTP_ATTEMPTS_EXCEEDED:
    'Слишком много неверных попыток. Запросите новый код позже',
  TOO_MANY_MESSAGES: 'Слишком часто — подождите несколько секунд',
  NOT_FOUND: 'Диалог недоступен',
  DIALOG_NOT_FOUND: 'Диалог недоступен',
  BAD_REQUEST: 'Проверьте введённые данные',
  VALIDATION_ERROR: 'Проверьте введённые данные',
  INTERNAL_SERVER_ERROR: 'Сервер временно недоступен. Попробуйте позже',
};

export function messageForCode(code: string): string {
  return MESSAGES[code] ?? 'Что-то пошло не так. Попробуйте ещё раз';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return messageForCode(error.code);
  }
  return 'Нет соединения с сервером. Проверьте интернет';
}

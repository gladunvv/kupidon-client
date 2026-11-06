import { ApiError, NetworkError } from './errors.ts';

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Не удалось войти. Проверьте введённые данные',
  UNAUTHORIZED: 'Для этого действия нужно войти в аккаунт',
  FORBIDDEN: 'Это действие недоступно',
  TOKEN_EXPIRED: 'Сессия истекла. Войдите снова',
  INVALID_TOKEN: 'Сессия завершена. Войдите снова',
  SESSION_REPLACED: 'В аккаунт вошли на другом устройстве. Войдите снова',
  TOO_MANY_OTP_REQUESTS: 'Слишком много запросов кода. Попробуйте позже',
  INVALID_OTP: 'Неверный или устаревший код',
  OTP_EXPIRED: 'Срок действия кода истёк. Запросите новый',
  OTP_ALREADY_USED: 'Этот код уже использован. Запросите новый',
  OTP_DELIVERY_FAILED: 'Не удалось отправить код. Попробуйте позже',
  INVALID_PHONE_FORMAT: 'Проверьте формат номера телефона',
  USER_ALREADY_EXISTS: 'Аккаунт с этим номером уже существует',
  MAX_PHOTOS_EXCEEDED: 'Можно загрузить не больше 5 фото',
  FILE_TOO_LARGE: 'Файл больше 5 МБ',
  TOO_MANY_FILES: 'Слишком много файлов за раз',
  UNEXPECTED_FILE: 'Этот файл нельзя загрузить',
  INVALID_IMAGE: 'Файл повреждён или это не изображение',
  IMAGE_RESOLUTION_TOO_LOW:
    'Слишком маленькое изображение — нужно от 200×200 px',
  PHOTO_UPLOAD_FAILED: 'Не удалось сохранить фото. Попробуйте ещё раз',
  PHOTO_COUNT_MISMATCH:
    'Фото изменились в другом окне. Обновите профиль и попробуйте снова',
  INVALID_PHOTOS:
    'Не удалось изменить фото. Обновите профиль и попробуйте снова',
  PHOTO_NOT_FOUND: 'Фото уже удалено или недоступно. Обновите профиль',
  PHOTO_DELETED: 'Фото уже удалено. Обновите профиль',
  PHOTO_REORDERED: 'Порядок фото изменился. Обновите профиль',
  PHOTO_GET_USER_PHOTOS: 'Не удалось получить фото. Обновите профиль',
  NO_PHOTOS_PROVIDED: 'Выберите фото для загрузки',
  OTP_ATTEMPTS_EXCEEDED:
    'Слишком много неверных попыток. Запросите новый код позже',
  TOO_MANY_MESSAGES: 'Слишком часто — подождите несколько секунд',
  NOT_FOUND: 'Запрошенные данные недоступны',
  DIALOG_NOT_FOUND: 'Диалог недоступен',
  MATCH_NOT_FOUND: 'Мэтч больше недоступен',
  MESSAGE_NOT_FOUND: 'Сообщение больше недоступно',
  NO_COORDINATES_AVAILABLE: 'Сначала укажите местоположение',
  USER_NOT_FOUND: 'Пользователь недоступен',
  CANNOT_TARGET_SELF: 'Это действие недоступно для собственной анкеты',
  BAD_REQUEST: 'Проверьте введённые данные',
  VALIDATION_ERROR: 'Проверьте введённые данные',
  INVALID_OBJECT_ID: 'Ссылка недействительна или устарела',
  INTERNAL_SERVER_ERROR: 'Сервер временно недоступен. Попробуйте позже',
  INVALID_RESPONSE: 'Не удалось получить данные от сервера. Попробуйте ещё раз',
};

type ErrorContext = 'phone' | 'chat';
const CONTEXT_MESSAGES: Record<ErrorContext, Record<string, string>> = {
  phone: { BAD_REQUEST: 'Сервер не принял номер. Проверьте его' },
  chat: { NOT_FOUND: 'Диалог недоступен' },
};
const FALLBACK = 'Что-то пошло не так. Попробуйте ещё раз';

function knownMessage(
  code: string,
  context?: ErrorContext,
): string | undefined {
  const overrides = context && CONTEXT_MESSAGES[context];
  if (overrides && Object.hasOwn(overrides, code)) return overrides[code];
  return Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : undefined;
}

export function messageForCode(code: string, context?: ErrorContext): string {
  return knownMessage(code, context) ?? FALLBACK;
}

function messageForStatus(status: number, context?: ErrorContext): string {
  if (status >= 500) return MESSAGES.INTERNAL_SERVER_ERROR;
  switch (status) {
    case 400:
      return messageForCode('BAD_REQUEST', context);
    case 422:
      return MESSAGES.VALIDATION_ERROR;
    case 401:
      return MESSAGES.UNAUTHORIZED;
    case 403:
      return MESSAGES.FORBIDDEN;
    case 404:
      return messageForCode('NOT_FOUND', context);
    case 409:
      return 'Данные уже изменились. Обновите страницу и попробуйте снова';
    case 413:
      return 'Слишком большой объём данных. Попробуйте отправить меньше';
    case 429:
      return 'Слишком много запросов. Подождите немного и попробуйте снова';
    default:
      return FALLBACK;
  }
}

export function getErrorMessage(
  error: unknown,
  context?: ErrorContext,
): string {
  if (error instanceof ApiError) {
    return (
      knownMessage(error.code, context) ??
      messageForStatus(error.status, context)
    );
  }
  if (error instanceof NetworkError)
    return 'Нет соединения с сервером. Проверьте интернет';
  return FALLBACK;
}

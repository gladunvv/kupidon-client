import { roundCoordinate } from '@/feed/search-form';

export class GeolocationFailure extends Error {}

// Returns [longitude, latitude] — the GeoJSON order the api's 2dsphere index
// expects — already rounded for privacy.
export function getRoundedPosition(): Promise<[number, number]> {
  if (!window.isSecureContext || !('geolocation' in navigator)) {
    return Promise.reject(
      new GeolocationFailure(
        'Браузер не даёт определить местоположение на этом сайте',
      ),
    );
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve([
          roundCoordinate(coords.longitude),
          roundCoordinate(coords.latitude),
        ]),
      (error) => {
        const messages: Record<number, string> = {
          [error.PERMISSION_DENIED]:
            'Доступ к местоположению запрещён — разрешите его в настройках браузера',
          [error.POSITION_UNAVAILABLE]: 'Не удалось определить местоположение',
          [error.TIMEOUT]:
            'Местоположение не определилось вовремя, попробуйте ещё раз',
        };
        reject(
          new GeolocationFailure(
            messages[error.code] ?? 'Не удалось определить местоположение',
          ),
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  });
}

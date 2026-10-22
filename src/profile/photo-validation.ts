// Mirrors api's upload rules (upload.module.ts / upload.service.ts) so a bad
// file is caught before a round-trip — one invalid file makes the api reject
// the whole batch, and a non-image type even comes back as a 500.
export const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const MIN_DIMENSION_PX = 200;
export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export function checkPhotoFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Формат не поддерживается — нужен JPEG, PNG, GIF или WebP';
  }
  if (file.size > MAX_BYTES) {
    return 'Файл больше 5 МБ';
  }
  return null;
}

export async function validatePhoto(file: File): Promise<string | null> {
  const basic = checkPhotoFile(file);
  if (basic) return basic;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return 'Файл повреждён или это не изображение';
  }
  const { width, height } = bitmap;
  bitmap.close();
  if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
    return `Слишком маленькое изображение — нужно от ${MIN_DIMENSION_PX}×${MIN_DIMENSION_PX} px`;
  }
  return null;
}

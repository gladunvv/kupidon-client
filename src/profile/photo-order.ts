export function movePhoto(
  photos: string[],
  url: string,
  delta: -1 | 1,
): string[] {
  const from = photos.indexOf(url);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= photos.length) return photos;
  const next = [...photos];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function makeMain(photos: string[], url: string): string[] {
  if (!photos.includes(url)) return photos;
  return [url, ...photos.filter((photo) => photo !== url)];
}

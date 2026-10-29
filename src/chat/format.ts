const timeFormat = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});
const dayMonthFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
});
const fullDateFormat = new Intl.DateTimeFormat('ru-RU');

export function formatMessageTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (date.toDateString() === now.toDateString()) {
    return timeFormat.format(date);
  }
  if (date.getFullYear() === now.getFullYear()) {
    return dayMonthFormat.format(date);
  }
  return fullDateFormat.format(date);
}

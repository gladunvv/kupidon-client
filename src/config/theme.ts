export function initializeTheme() {
  let dark = true;
  try {
    dark = localStorage.getItem('kupidon-theme') !== 'light';
  } catch {
    /* Storage may be unavailable in a private browser. */
  }
  document.documentElement.classList.toggle('dark', dark);
}

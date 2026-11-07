import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    setDark(next);
    try {
      localStorage.setItem('kupidon-theme', next ? 'dark' : 'light');
    } catch {
      /* Keep the theme for this visit. */
    }
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

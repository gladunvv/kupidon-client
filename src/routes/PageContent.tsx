import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';

const pageNames: Record<string, string> = {
  '/': 'Знакомства',
  '/login': 'Вход',
  '/profile': 'Профиль',
  '/matches': 'Мэтчи',
  '/chats': 'Сообщения',
  '/faq': 'Частые вопросы',
};

export function PageContent() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const content = useRef<HTMLDivElement>(null);
  const name = pathname.startsWith('/chat/')
    ? 'Переписка'
    : Object.hasOwn(pageNames, pathname)
      ? pageNames[pathname]
      : 'Страница не найдена';

  useEffect(() => {
    document.title = `${name} — Kupidon`;
    // Wait for the Suspense boundary to reveal the new page. Initial load
    // keeps autofocus in forms; query-string changes keep the current focus.
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      if (!document.querySelector('dialog[open]')) {
        content.current?.focus({ preventScroll: true });
      }
    }
  }, [pathname, name]);

  return (
    <div id="page-content" ref={content} tabIndex={-1} aria-label={name}>
      <Outlet />
    </div>
  );
}

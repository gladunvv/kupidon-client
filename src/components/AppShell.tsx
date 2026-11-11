import { Suspense } from 'react';
import { PageLoading } from '@/routes/RouteStatus';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Heart, LogOut } from 'lucide-react';
import { useAuth } from '@/auth/use-auth';
import { signOut } from '@/auth/session-store';
import { logout } from '@/api/auth';
import { getErrorMessage } from '@/api/error-messages';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

export const SUPPORT_URL = 'https://t.me/please_feed_back_bot';

export function AppShell() {
  const { status } = useAuth();
  const chat = useLocation().pathname.startsWith('/chat/');
  const exit = useMutation({ mutationFn: logout, onSuccess: () => signOut() });
  const authenticated = status === 'authenticated';
  const navigation = (
    <nav aria-label="Основная навигация" className="site-nav">
      {authenticated && (
        <>
          <NavLink to="/" end>
            Знакомства
          </NavLink>
          <NavLink to="/matches">Мэтчи</NavLink>
          <NavLink to="/chats">Сообщения</NavLink>
          <NavLink to="/profile">Профиль</NavLink>
        </>
      )}
      <NavLink to="/faq">FAQ</NavLink>
      <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        Обратная связь ↗
      </a>
    </nav>
  );
  return (
    <div className={chat ? 'chat-shell' : 'site-shell'}>
      <header className="site-header">
        <div className="site-header-inner">
          <Link
            to={authenticated ? '/' : '/login'}
            className="brand"
            aria-label="Kupidon — главная"
          >
            <Heart aria-hidden="true" /> Kupidon
            <span className="brand-dot">.</span>
          </Link>
          {navigation}
          <div className="site-header-actions">
            <ThemeToggle />
            {authenticated && (
              <Button
                variant="outline"
                onClick={() => exit.mutate()}
                disabled={exit.isPending}
              >
                <LogOut /> <span>{exit.isPending ? 'Выходим…' : 'Выйти'}</span>
              </Button>
            )}
          </div>
        </div>
        {exit.error && (
          <p
            role="alert"
            className="mx-auto max-w-6xl px-5 pb-3 text-sm text-destructive"
          >
            Не удалось выйти: {getErrorMessage(exit.error)}
          </p>
        )}
      </header>
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

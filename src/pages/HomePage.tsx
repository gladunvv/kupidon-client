import { useAuth } from '@/auth/auth-context';

export function HomePage() {
  const { user } = useAuth();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">Лента</h1>
      <p className="text-muted-foreground">Вы вошли как {user?.phone}</p>
      <p className="text-muted-foreground">
        Кандидаты появятся в задаче FEED-01
      </p>
    </main>
  );
}

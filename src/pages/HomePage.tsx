import { useMutation } from '@tanstack/react-query';
import { logout } from '@/api/auth';
import { getErrorMessage } from '@/api/error-messages';
import { signOut } from '@/auth/session-store';
import { useAuth } from '@/auth/use-auth';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const { user } = useAuth();
  // Local session is dropped only after the server confirms: if the request
  // fails, the refresh cookie is still valid and a reload would sign back in.
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => signOut(),
  });

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">Лента</h1>
      <p className="text-muted-foreground">Вы вошли как {user?.phone}</p>
      <p className="text-muted-foreground">
        Кандидаты появятся в задаче FEED-01
      </p>
      <Button
        variant="outline"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
      >
        {logoutMutation.isPending ? 'Выходим…' : 'Выйти'}
      </Button>
      {logoutMutation.error && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось выйти: {getErrorMessage(logoutMutation.error)}
        </p>
      )}
    </main>
  );
}

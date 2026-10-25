import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { logout } from '@/api/auth';
import { useCandidates } from '@/api/candidates';
import { getErrorMessage } from '@/api/error-messages';
import { useCityNames, useGoals } from '@/api/reference';
import { signOut } from '@/auth/session-store';
import { Button } from '@/components/ui/button';
import { CandidateCard } from '@/feed/CandidateCard';
import { FeedFilters } from '@/feed/FeedFilters';

export function HomePage() {
  // Local session is dropped only after the server confirms: if the request
  // fails, the refresh cookie is still valid and a reload would sign back in.
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => signOut(),
  });

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Лента</h1>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/profile" className="underline underline-offset-4">
            Профиль
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Выходим…' : 'Выйти'}
          </Button>
        </nav>
      </header>
      {logoutMutation.error && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось выйти: {getErrorMessage(logoutMutation.error)}
        </p>
      )}
      <FeedFilters />
      <Feed />
    </main>
  );
}

function Feed() {
  const candidates = useCandidates();
  const cityNames = useCityNames();
  const goals = useGoals();

  if (candidates.isPending) {
    return <p className="text-muted-foreground">Загружаем анкеты…</p>;
  }

  if (candidates.isError && !candidates.data) {
    return (
      <div className="flex flex-col gap-3">
        <p role="alert" className="text-sm text-destructive">
          Не удалось загрузить анкеты: {getErrorMessage(candidates.error)}
        </p>
        <Button variant="outline" onClick={() => candidates.refetch()}>
          Повторить
        </Button>
      </div>
    );
  }

  const items = candidates.data.pages.flatMap((page) => page.items);
  const total = candidates.data.pages[0]?.pagination.total ?? 0;
  // Cached pages are still shown when a background refetch fails, so the
  // failure has to be surfaced explicitly or stale results look current.
  const refetchFailed = candidates.isRefetchError && (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 px-3 py-2">
      <p role="alert" className="text-sm text-destructive">
        Не удалось обновить анкеты
      </p>
      <Button size="sm" variant="outline" onClick={() => candidates.refetch()}>
        Повторить
      </Button>
    </div>
  );

  if (items.length === 0) {
    return (
      <>
        {refetchFailed}
        <EmptyFeed />
      </>
    );
  }

  const goalNames = new Map(goals.data?.map((g) => [g._id, g.name]) ?? []);

  return (
    <section className="flex flex-col gap-4" aria-label="Анкеты">
      {refetchFailed}
      <p className="text-sm text-muted-foreground">
        Показано {items.length} из {total}
      </p>
      {items.map((candidate) => (
        <CandidateCard
          key={candidate._id}
          candidate={candidate}
          cityName={
            candidate.city ? cityNames.data?.get(candidate.city) : undefined
          }
          goalNames={(candidate.goals ?? [])
            .map((id) => goalNames.get(id))
            .filter((name): name is string => Boolean(name))}
        />
      ))}
      {candidates.isFetchNextPageError && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось загрузить ещё: {getErrorMessage(candidates.error)}
        </p>
      )}
      {candidates.hasNextPage && (
        <Button
          variant="outline"
          disabled={candidates.isFetchingNextPage}
          onClick={() => candidates.fetchNextPage()}
        >
          {candidates.isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}
        </Button>
      )}
    </section>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-6 text-center">
      <p className="font-medium">Подходящих анкет пока нет</p>
      <p className="text-sm text-muted-foreground">
        Загляните позже или расширьте возраст и расстояние в настройках поиска.
      </p>
    </div>
  );
}

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { logout } from '@/api/auth';
import { passCandidate, useCandidates, usePassedIds } from '@/api/candidates';
import { getErrorMessage } from '@/api/error-messages';
import { useLike } from '@/api/match';
import { useCityNames, useGoals } from '@/api/reference';
import { signOut } from '@/auth/session-store';
import { Button } from '@/components/ui/button';
import { CandidateCard } from '@/feed/CandidateCard';
import { FeedFilters } from '@/feed/FeedFilters';
import { MatchDialog } from '@/feed/MatchDialog';
import type { Candidate } from '@/types/candidate';

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
          <Link to="/matches" className="underline underline-offset-4">
            Мэтчи
          </Link>
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
  const queryClient = useQueryClient();
  const candidates = useCandidates();
  const cityNames = useCityNames();
  const goals = useGoals();
  const passed = usePassedIds();
  const like = useLike();
  const [match, setMatch] = useState<{
    candidate: Candidate;
    dialogId: string;
  } | null>(null);
  // A like removes the user from the server-side list, so offset pages after
  // it shift by one: the next "show more" would skip someone. Loaded pages
  // are refetched first whenever that happened.
  const shifted = useRef(false);

  function likeCandidate(candidate: Candidate) {
    like.mutate(candidate, {
      onSuccess: (result) => {
        shifted.current = true;
        if (result.matched) {
          setMatch({ candidate, dialogId: result.dialog._id });
        }
      },
    });
  }

  async function loadMore() {
    if (shifted.current) {
      shifted.current = false;
      await candidates.refetch();
    }
    void candidates.fetchNextPage();
  }

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

  const passedIds = new Set(passed.data);
  const items = candidates.data.pages
    .flatMap((page) => page.items)
    .filter((candidate) => !passedIds.has(candidate._id));
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

  if (items.length === 0 && !candidates.hasNextPage) {
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
      {match && (
        <MatchDialog
          candidate={match.candidate}
          dialogId={match.dialogId}
          onClose={() => setMatch(null)}
        />
      )}
      {like.error && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось поставить лайк: {getErrorMessage(like.error)}
        </p>
      )}
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
          actions={
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => passCandidate(queryClient, candidate._id)}
              >
                Пропустить
              </Button>
              <Button onClick={() => likeCandidate(candidate)}>
                ♥ Нравится
              </Button>
            </div>
          }
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
          disabled={candidates.isFetching}
          onClick={loadMore}
        >
          {candidates.isFetching ? 'Загружаем…' : 'Показать ещё'}
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

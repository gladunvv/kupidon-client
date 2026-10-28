import { Link } from 'react-router';
import { getErrorMessage } from '@/api/error-messages';
import { useMatches, type MatchItem } from '@/api/matches';
import { Button } from '@/components/ui/button';

export function MatchesPage() {
  const matches = useMatches();

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col gap-4 px-4 py-6">
      <Link to="/" className="text-sm text-muted-foreground">
        ← Лента
      </Link>
      <h1 className="text-2xl font-semibold">Мэтчи</h1>
      {matches.isPending && (
        <p className="text-muted-foreground">Загружаем мэтчи…</p>
      )}
      {matches.isError && !matches.data && (
        <div className="flex flex-col gap-3">
          <p role="alert" className="text-sm text-destructive">
            Не удалось загрузить мэтчи: {getErrorMessage(matches.error)}
          </p>
          <Button variant="outline" onClick={() => matches.refetch()}>
            Повторить
          </Button>
        </div>
      )}
      {matches.data && <MatchList query={matches} />}
    </main>
  );
}

function MatchList({ query }: { query: ReturnType<typeof useMatches> }) {
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-6 text-center">
        <p className="font-medium">Мэтчей пока нет</p>
        <p className="text-sm text-muted-foreground">
          Ставьте «Нравится» в ленте — когда симпатия взаимна, человек появится
          здесь.
        </p>
        <Link to="/" className="text-sm underline underline-offset-4">
          В ленту
        </Link>
      </div>
    );
  }

  return (
    <>
      {query.isRefetchError && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось обновить список
        </p>
      )}
      <ul className="flex flex-col divide-y divide-border">
        {items.map((match) => (
          <li key={match._id}>
            <MatchRow match={match} />
          </li>
        ))}
      </ul>
      {query.isFetchNextPageError && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось загрузить ещё: {getErrorMessage(query.error)}
        </p>
      )}
      {query.hasNextPage && (
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => query.fetchNextPage()}
        >
          {query.isFetching ? 'Загружаем…' : 'Показать ещё'}
        </Button>
      )}
    </>
  );
}

function MatchRow({ match }: { match: MatchItem }) {
  const { partner, dialog } = match;
  const photo = partner?.photos?.[0];
  const title = partner
    ? [partner.name ?? 'Без имени', partner.age].filter(Boolean).join(', ')
    : 'Пользователь удалил анкету';
  const status = dialog?.hasLastMessage
    ? 'Есть переписка'
    : 'Новый мэтч — напишите первым';

  const content = (
    <div className="flex items-center gap-3 py-3">
      {photo ? (
        <img
          src={photo}
          alt=""
          className="size-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="size-12 shrink-0 rounded-full bg-muted" />
      )}
      <div className="flex min-w-0 flex-col">
        <span className="font-medium">{title}</span>
        {partner && (
          <span className="truncate text-sm text-muted-foreground">
            {status}
          </span>
        )}
      </div>
    </div>
  );

  if (!partner || !dialog) {
    return <div className="opacity-60">{content}</div>;
  }
  return (
    <Link to={`/chat/${dialog._id}`} className="block hover:bg-muted/50">
      {content}
    </Link>
  );
}

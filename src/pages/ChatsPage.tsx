import { Link } from 'react-router';
import { type DialogItem, useDialogs } from '@/api/dialogs';
import { getErrorMessage } from '@/api/error-messages';
import { useAuth } from '@/auth/use-auth';
import { formatMessageTime } from '@/chat/format';
import { isUnread, readSeen } from '@/chat/seen-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ChatsPage() {
  const dialogs = useDialogs();

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col gap-4 px-4 py-6">
      <Link to="/" className="text-sm text-muted-foreground">
        ← Лента
      </Link>
      <h1 className="text-2xl font-semibold">Сообщения</h1>
      {dialogs.isPending && (
        <p className="text-muted-foreground">Загружаем диалоги…</p>
      )}
      {dialogs.isError && !dialogs.data && (
        <div className="flex flex-col gap-3">
          <p role="alert" className="text-sm text-destructive">
            Не удалось загрузить диалоги: {getErrorMessage(dialogs.error)}
          </p>
          <Button variant="outline" onClick={() => dialogs.refetch()}>
            Повторить
          </Button>
        </div>
      )}
      {dialogs.data && <DialogList query={dialogs} />}
    </main>
  );
}

function DialogList({ query }: { query: ReturnType<typeof useDialogs> }) {
  const { user } = useAuth();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const seen = user ? readSeen(user._id) : {};

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-6 text-center">
        <p className="font-medium">Диалогов пока нет</p>
        <p className="text-sm text-muted-foreground">
          Диалог появляется, когда симпатия взаимна.
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
        {items.map((dialog) => (
          <li key={dialog._id}>
            <DialogRow
              dialog={dialog}
              myId={user?._id ?? ''}
              unread={
                user
                  ? isUnread(dialog.lastMessage, dialog._id, user._id, seen)
                  : false
              }
            />
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

function DialogRow({
  dialog,
  myId,
  unread,
}: {
  dialog: DialogItem;
  myId: string;
  unread: boolean;
}) {
  const { partner, lastMessage } = dialog;
  const preview = lastMessage
    ? `${lastMessage.sender._id === myId ? 'Вы: ' : ''}${lastMessage.text}`
    : 'Нет сообщений — напишите первым';

  return (
    <Link
      to={`/chat/${dialog._id}`}
      className="flex items-center gap-3 py-3 hover:bg-muted/50"
    >
      {partner?.photos ? (
        <img
          src={partner.photos}
          alt=""
          className="size-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="size-12 shrink-0 rounded-full bg-muted" />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate', unread && 'font-semibold')}>
            {partner?.name ?? 'Пользователь'}
          </span>
          {lastMessage && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatMessageTime(lastMessage.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm',
              unread ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {preview}
          </span>
          {unread && (
            <span
              className="size-2 shrink-0 rounded-full bg-primary"
              role="img"
              aria-label="Новое сообщение"
            />
          )}
        </div>
      </div>
    </Link>
  );
}

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '@/api/error-messages';
import {
  useDialogDetails,
  useMessages,
  useOlderMessages,
  type ChatMessage,
} from '@/api/messages';
import { useAuth } from '@/auth/use-auth';
import { formatMessageTime } from '@/chat/format';
import type { PendingMessage } from '@/chat/pending';
import { markSeen } from '@/chat/seen-store';
import { retryChatSocket, type SocketStatus } from '@/chat/socket';
import { MAX_MESSAGE_LENGTH, useDialogRoom } from '@/chat/use-dialog-room';
import { useMessageScroll } from '@/chat/use-message-scroll';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { UserSafetyActions } from '@/safety/UserSafetyActions';

export function ChatPage() {
  const { dialogId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const myId = user?._id ?? '';
  const details = useDialogDetails(dialogId);
  const history = useMessages(dialogId);
  const older = useOlderMessages(dialogId);
  const room = useDialogRoom(dialogId, myId);
  const topRef = useRef<HTMLDivElement>(null);
  const { containerRef, rememberPosition, followBottom } = useMessageScroll(
    dialogId,
    Boolean(history.data),
  );

  const messages = history.data?.messages ?? [];
  const lastMessage = messages.at(-1);

  // Being on the screen while a partner's message arrives counts as reading it.
  useEffect(() => {
    if (myId && lastMessage && lastMessage.sender._id !== myId) {
      markSeen(myId, dialogId, lastMessage._id);
    }
  }, [myId, dialogId, lastMessage]);

  const cursor = history.data?.pagination.nextCursor;
  const hasMore = history.data?.pagination.hasMore;
  const {
    mutate: loadOlder,
    isPending: loadingOlder,
    isError: olderFailed,
  } = older;
  useEffect(() => {
    const container = containerRef.current;
    const top = topRef.current;
    if (
      !container ||
      !top ||
      !hasMore ||
      !cursor ||
      loadingOlder ||
      olderFailed
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadOlder(cursor);
      },
      { root: container, rootMargin: '80px 0px 0px 0px' },
    );
    observer.observe(top);
    return () => observer.disconnect();
  }, [containerRef, hasMore, cursor, loadingOlder, olderFailed, loadOlder]);

  const partner = details.data?.partner;

  return (
    <main className="mx-auto flex h-svh max-w-sm flex-col px-4">
      <header className="flex items-center gap-3 border-b border-border py-3">
        <Link to="/chats" className="text-sm text-muted-foreground">
          ←
        </Link>
        {partner?.photos?.[0] ? (
          <img
            src={partner.photos[0]}
            alt=""
            className="size-9 rounded-full object-cover"
          />
        ) : (
          <div className="size-9 rounded-full bg-muted" />
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">
            {partner?.name ?? (details.isPending ? '…' : 'Собеседник')}
          </span>
          <ConnectionStatus status={room.status} />
        </div>
        {partner && (
          <UserSafetyActions
            compact
            userId={partner._id}
            name={partner.name}
            dialogId={dialogId}
            onBlocked={() =>
              navigate('/chats', { replace: true, state: { blocked: true } })
            }
          />
        )}
      </header>

      <section
        ref={containerRef}
        onScroll={rememberPosition}
        aria-label="Сообщения"
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-3 [overflow-anchor:none]"
      >
        <div ref={topRef} className="h-px shrink-0" />
        {loadingOlder && (
          <p
            role="status"
            className="text-center text-sm text-muted-foreground"
          >
            Загружаем сообщения…
          </p>
        )}
        {olderFailed && (
          <div className="flex flex-col items-center gap-2">
            <p role="alert" className="text-sm text-destructive">
              Не удалось загрузить сообщения:{' '}
              {getErrorMessage(older.error, 'chat')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cursor && loadOlder(cursor)}
            >
              Повторить
            </Button>
          </div>
        )}
        {history.isPending && (
          <p className="text-sm text-muted-foreground">Загружаем переписку…</p>
        )}
        {history.isError && (
          <div className="flex flex-col gap-2">
            <p role="alert" className="text-sm text-destructive">
              Не удалось загрузить переписку:{' '}
              {getErrorMessage(history.error, 'chat')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => history.refetch()}
            >
              Повторить
            </Button>
          </div>
        )}
        {history.data && messages.length === 0 && room.pending.length === 0 && (
          <p className="m-auto text-center text-sm text-muted-foreground">
            Сообщений пока нет — напишите первым
          </p>
        )}
        {messages.map((message) => (
          <Bubble
            key={message._id}
            message={message}
            mine={message.sender._id === myId}
          />
        ))}
        {room.pending.map((item) => (
          <PendingBubble
            key={item.tempId}
            item={item}
            onRetry={() => room.retry(item.tempId)}
            onDiscard={() => room.discard(item.tempId)}
            retryDisabled={
              room.status !== 'connected' ||
              Boolean(room.roomError) ||
              room.cooldownSeconds > 0
            }
          />
        ))}
      </section>

      {room.roomError && (
        <p role="alert" className="pb-2 text-sm text-destructive">
          {room.roomError}
        </p>
      )}
      <Composer
        disabled={room.status !== 'connected' || Boolean(room.roomError)}
        cooldownSeconds={room.cooldownSeconds}
        remaining={room.remaining}
        onSend={(text) => {
          const sent = room.send(text);
          if (sent) followBottom();
          return sent;
        }}
      />
    </main>
  );
}

function Bubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div
      data-message-id={message._id}
      className={cn(
        'flex shrink-0 flex-col',
        mine ? 'items-end' : 'items-start',
      )}
    >
      <p
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap',
          mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {message.text}
      </p>
      <span className="px-1 text-[11px] text-muted-foreground">
        {formatMessageTime(message.created_at)}
      </span>
    </div>
  );
}

function PendingBubble({
  item,
  onRetry,
  onDiscard,
  retryDisabled,
}: {
  item: PendingMessage;
  onRetry: () => void;
  onDiscard: () => void;
  retryDisabled: boolean;
}) {
  return (
    <div className="flex shrink-0 flex-col items-end">
      <p
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap',
          item.status === 'sending'
            ? 'bg-primary/60 text-primary-foreground'
            : 'border border-destructive/50',
        )}
      >
        {item.text}
      </p>
      {item.status === 'sending' ? (
        <span className="px-1 text-[11px] text-muted-foreground">
          Отправляется…
        </span>
      ) : (
        <span
          role="alert"
          className="flex gap-2 px-1 text-[11px] text-destructive"
        >
          Не отправлено: {item.error}
          <button
            type="button"
            className="underline disabled:cursor-not-allowed disabled:opacity-50"
            disabled={retryDisabled}
            onClick={onRetry}
          >
            Повторить
          </button>
          <button type="button" className="underline" onClick={onDiscard}>
            Удалить
          </button>
        </span>
      )}
    </div>
  );
}

function Composer({
  disabled,
  cooldownSeconds,
  remaining,
  onSend,
}: {
  disabled: boolean;
  cooldownSeconds: number;
  remaining: number;
  onSend: (text: string) => boolean;
}) {
  const [text, setText] = useState('');
  const tooLong = text.trim().length > MAX_MESSAGE_LENGTH;
  const blocked = disabled || cooldownSeconds > 0;

  function submit() {
    if (blocked) return;
    if (onSend(text)) setText('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      className="flex flex-col gap-1 border-t border-border py-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex items-end gap-2">
        <Textarea
          aria-label="Сообщение"
          rows={1}
          placeholder={disabled ? 'Ждём соединения…' : 'Сообщение'}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={tooLong ? true : undefined}
          aria-describedby={
            cooldownSeconds > 0 || remaining <= 2 ? 'send-limit' : undefined
          }
          className="max-h-32 min-h-9 resize-none"
        />
        <Button type="submit" disabled={blocked || !text.trim() || tooLong}>
          Отправить
        </Button>
      </div>
      {cooldownSeconds > 0 ? (
        <p
          id="send-limit"
          role="status"
          className="text-xs text-muted-foreground"
        >
          Следующее сообщение можно отправить через {cooldownSeconds} с
        </p>
      ) : remaining <= 2 ? (
        <p
          id="send-limit"
          role="status"
          className="text-xs text-muted-foreground"
        >
          {remaining === 1 ? 'Ещё одно сообщение' : 'Ещё два сообщения'} — затем
          короткая пауза
        </p>
      ) : null}
      {text.length > MAX_MESSAGE_LENGTH - 100 && (
        <span
          className={cn(
            'text-xs',
            tooLong ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {text.trim().length}/{MAX_MESSAGE_LENGTH}
        </span>
      )}
    </form>
  );
}

function ConnectionStatus({ status }: { status: SocketStatus }) {
  if (status === 'connected') {
    return <span className="text-xs text-muted-foreground">онлайн</span>;
  }
  if (status === 'failed') {
    return (
      <span role="alert" className="text-xs text-destructive">
        нет соединения ·{' '}
        <button type="button" className="underline" onClick={retryChatSocket}>
          переподключить
        </button>
      </span>
    );
  }
  return (
    <span role="status" className="text-xs text-muted-foreground">
      подключаемся…
    </span>
  );
}

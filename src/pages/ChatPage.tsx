import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router';
import { getErrorMessage } from '@/api/error-messages';
import {
  useDialogDetails,
  useMessages,
  type ChatMessage,
} from '@/api/messages';
import { useAuth } from '@/auth/use-auth';
import { formatMessageTime } from '@/chat/format';
import type { PendingMessage } from '@/chat/pending';
import { markSeen } from '@/chat/seen-store';
import { retryChatSocket, type SocketStatus } from '@/chat/socket';
import { MAX_MESSAGE_LENGTH, useDialogRoom } from '@/chat/use-dialog-room';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function ChatPage() {
  const { dialogId = '' } = useParams();
  const { user } = useAuth();
  const myId = user?._id ?? '';
  const details = useDialogDetails(dialogId);
  const history = useMessages(dialogId);
  const room = useDialogRoom(dialogId, myId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = history.data?.messages ?? [];
  const lastMessage = messages.at(-1);

  // Being on the screen while a partner's message arrives counts as reading it.
  useEffect(() => {
    if (myId && lastMessage && lastMessage.sender._id !== myId) {
      markSeen(myId, dialogId, lastMessage._id);
    }
  }, [myId, dialogId, lastMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, room.pending.length]);

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
      </header>

      <section
        aria-label="Сообщения"
        className="flex flex-1 flex-col gap-2 overflow-y-auto py-3"
      >
        {history.isPending && (
          <p className="text-sm text-muted-foreground">Загружаем переписку…</p>
        )}
        {history.isError && (
          <div className="flex flex-col gap-2">
            <p role="alert" className="text-sm text-destructive">
              Не удалось загрузить переписку: {getErrorMessage(history.error)}
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
          />
        ))}
        <div ref={bottomRef} />
      </section>

      {room.roomError && (
        <p role="alert" className="pb-2 text-sm text-destructive">
          {room.roomError}
        </p>
      )}
      <Composer
        disabled={room.status !== 'connected' || Boolean(room.roomError)}
        onSend={room.send}
      />
    </main>
  );
}

function Bubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
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
}: {
  item: PendingMessage;
  onRetry: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-col items-end">
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
          <button type="button" className="underline" onClick={onRetry}>
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
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => boolean;
}) {
  const [text, setText] = useState('');
  const tooLong = text.trim().length > MAX_MESSAGE_LENGTH;

  function submit() {
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
          className="max-h-32 min-h-9 resize-none"
        />
        <Button type="submit" disabled={disabled || !text.trim() || tooLong}>
          Отправить
        </Button>
      </div>
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

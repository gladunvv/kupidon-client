import { useEffect } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import type { Page } from '@/api/client';
import { dialogsKey, type DialogItem } from '@/api/dialogs';
import { useAuth } from '@/auth/use-auth';
import { markSeen } from '@/chat/seen-store';
import { retryChatSocket, useChatSocket } from '@/chat/socket';
import { Button } from '@/components/ui/button';

export function ChatPage() {
  const { dialogId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { status } = useChatSocket();

  // Opening the dialog counts as reading its latest message on this device.
  useEffect(() => {
    if (!user || !dialogId) return;
    const dialog = queryClient
      .getQueryData<InfiniteData<Page<DialogItem>>>(dialogsKey)
      ?.pages.flatMap((page) => page.items)
      .find((item) => item._id === dialogId);
    if (dialog?.lastMessage) {
      markSeen(user._id, dialogId, dialog.lastMessage._id);
    }
  }, [dialogId, user, queryClient]);

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col gap-4 px-4 py-6">
      <Link to="/chats" className="text-sm text-muted-foreground">
        ← Сообщения
      </Link>
      <ConnectionStatus status={status} />
      <p className="text-muted-foreground">
        Переписка появится в задачах CHAT-03..06
      </p>
    </main>
  );
}

function ConnectionStatus({
  status,
}: {
  status: ReturnType<typeof useChatSocket>['status'];
}) {
  if (status === 'connected') {
    return <p className="text-xs text-muted-foreground">Онлайн</p>;
  }
  if (status === 'failed') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 px-3 py-2">
        <p role="alert" className="text-sm text-destructive">
          Не удалось подключиться к чату
        </p>
        <Button size="sm" variant="outline" onClick={retryChatSocket}>
          Повторить
        </Button>
      </div>
    );
  }
  return (
    <p role="status" className="text-xs text-muted-foreground">
      Подключаемся…
    </p>
  );
}

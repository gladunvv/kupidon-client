import { useParams } from 'react-router';

export function ChatPage() {
  const { dialogId } = useParams();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">Диалог {dialogId}</h1>
      <p className="text-muted-foreground">
        Чат появится в задачах CHAT-01..06
      </p>
    </main>
  );
}

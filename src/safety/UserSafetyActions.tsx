import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/api/error-messages';
import {
  blockUser,
  clearBlockedUser,
  reportUser,
  type ReportPayload,
  type ReportReason,
} from '@/api/safety';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Спам' },
  { value: 'inappropriate_content', label: 'Неприемлемый контент' },
  { value: 'harassment', label: 'Оскорбления или угрозы' },
  { value: 'fake_profile', label: 'Поддельная анкета' },
  { value: 'other', label: 'Другое' },
];
const MAX_DETAILS_LENGTH = 500;

interface SafetyProps {
  userId: string;
  name?: string;
  dialogId?: string;
  onBlocked?: () => void;
}

export function UserSafetyActions({
  compact = false,
  ...props
}: SafetyProps & { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={compact ? 'icon' : 'sm'}
        className={compact ? 'ml-auto' : 'w-full text-muted-foreground'}
        aria-label="Пожаловаться или заблокировать"
        onClick={() => setOpen(true)}
      >
        {compact ? (
          <span aria-hidden="true">⋯</span>
        ) : (
          'Пожаловаться или заблокировать'
        )}
      </Button>
      {open && <SafetyDialog {...props} onClose={() => setOpen(false)} />}
    </>
  );
}

function SafetyDialog({
  userId,
  name,
  dialogId,
  onBlocked,
  onClose,
}: SafetyProps & { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reasonId = useId();
  const detailsId = useId();
  const submitted = useRef(false);
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState<
    'menu' | 'block' | 'report' | 'reported'
  >('menu');
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const mutation = useMutation({
    mutationFn: (
      action: { type: 'block' } | { type: 'report'; payload: ReportPayload },
    ) =>
      action.type === 'block'
        ? blockUser(userId)
        : reportUser(userId, action.payload),
    onSuccess: async (_data, action) => {
      if (action.type === 'report') {
        setScreen('reported');
        return;
      }
      ref.current?.close();
      onClose();
      onBlocked?.();
      await clearBlockedUser(queryClient, userId, dialogId);
    },
    onSettled: () => {
      submitted.current = false;
    },
  });

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function changeScreen(next: typeof screen) {
    mutation.reset();
    setScreen(next);
  }

  const tooLong = details.length > MAX_DETAILS_LENGTH;
  const title =
    screen === 'block'
      ? 'Заблокировать пользователя?'
      : screen === 'report'
        ? 'Пожаловаться на пользователя'
        : screen === 'reported'
          ? 'Жалоба отправлена'
          : (name ?? 'Пользователь');

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        if (mutation.isPending) event.preventDefault();
      }}
      aria-labelledby={titleId}
      className="m-auto max-h-[85svh] w-[min(22rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-border bg-background p-6 text-foreground backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-4">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {screen === 'menu' && (
          <>
            <Button variant="outline" onClick={() => changeScreen('report')}>
              Пожаловаться
            </Button>
            <Button variant="destructive" onClick={() => changeScreen('block')}>
              Заблокировать
            </Button>
          </>
        )}
        {screen === 'block' && (
          <>
            <p className="text-sm text-muted-foreground">
              Анкета и переписка с этим человеком будут скрыты. Он не сможет
              писать вам.
            </p>
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => {
                if (submitted.current) return;
                submitted.current = true;
                mutation.mutate({ type: 'block' });
              }}
            >
              {mutation.isPending ? 'Блокируем…' : 'Да, заблокировать'}
            </Button>
          </>
        )}
        {screen === 'report' && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (submitted.current || !reason || tooLong) return;
              submitted.current = true;
              const comment = details.trim();
              mutation.mutate({
                type: 'report',
                payload: { reason, ...(comment ? { details: comment } : {}) },
              });
            }}
          >
            <label htmlFor={reasonId} className="text-sm font-medium">
              Причина
            </label>
            <select
              id={reasonId}
              required
              value={reason}
              disabled={mutation.isPending}
              onChange={(event) =>
                setReason(event.target.value as ReportReason | '')
              }
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Выберите причину
              </option>
              {REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <label htmlFor={detailsId} className="text-sm font-medium">
              Комментарий (необязательно)
            </label>
            <Textarea
              id={detailsId}
              value={details}
              disabled={mutation.isPending}
              maxLength={MAX_DETAILS_LENGTH}
              onChange={(event) => setDetails(event.target.value)}
              aria-invalid={tooLong || undefined}
              rows={4}
            />
            <span className="text-xs text-muted-foreground">
              {details.length}/{MAX_DETAILS_LENGTH}
            </span>
            <Button
              type="submit"
              disabled={mutation.isPending || !reason || tooLong}
            >
              {mutation.isPending ? 'Отправляем…' : 'Отправить жалобу'}
            </Button>
          </form>
        )}
        {screen === 'reported' && (
          <>
            <p role="status" className="text-sm text-muted-foreground">
              Вы также можете заблокировать этого пользователя.
            </p>
            <Button variant="destructive" onClick={() => changeScreen('block')}>
              Заблокировать
            </Button>
          </>
        )}
        {mutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            Не удалось выполнить действие: {getErrorMessage(mutation.error)}
          </p>
        )}
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => ref.current?.close()}
        >
          {screen === 'block' || screen === 'report' ? 'Отмена' : 'Закрыть'}
        </Button>
      </div>
    </dialog>
  );
}

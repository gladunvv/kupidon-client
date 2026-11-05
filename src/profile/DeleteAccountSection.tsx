import { useEffect, useId, useRef, useState } from 'react';
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getErrorMessage } from '@/api/error-messages';
import { deleteAccount } from '@/api/users';
import { signOut } from '@/auth/session-store';
import { Button } from '@/components/ui/button';

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const busy = useIsMutating() > 0;

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 className="font-medium">Аккаунт</h2>
      <Button
        type="button"
        variant="destructive"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Удалить аккаунт
      </Button>
      {busy && (
        <p className="text-sm text-muted-foreground">
          Дождитесь завершения текущего действия
        </p>
      )}
      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </section>
  );
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const submitted = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const queryClient = useQueryClient();
  const busy = useIsMutating() > 0;
  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      // The API has already removed the user and cleared the refresh cookie.
      // signOut also clears user queries through the root session subscription.
      signOut('account-deleted');
    },
    onSettled: () => {
      submitted.current = false;
    },
  });

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        if (mutation.isPending) event.preventDefault();
      }}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="m-auto max-h-[85svh] w-[min(22rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-border bg-background p-6 text-foreground backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-4">
        <h2 id={titleId} className="text-lg font-semibold">
          Удалить аккаунт?
        </h2>
        <p id={descriptionId} className="text-sm text-muted-foreground">
          Анкета, фотографии, мэтчи и переписки будут удалены без возможности
          восстановления. Переписки также исчезнут у собеседников.
        </p>
        {mutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            Не удалось удалить аккаунт: {getErrorMessage(mutation.error)}
          </p>
        )}
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => ref.current?.close()}
        >
          Оставить аккаунт
        </Button>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={() => {
            if (submitted.current || queryClient.isMutating() > 0) return;
            submitted.current = true;
            mutation.mutate();
          }}
        >
          {mutation.isPending ? 'Удаляем…' : 'Удалить навсегда'}
        </Button>
      </div>
    </dialog>
  );
}

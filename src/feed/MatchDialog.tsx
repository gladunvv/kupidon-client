import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useDialogViewport } from '@/lib/use-visual-viewport';
import type { Candidate } from '@/types/candidate';

// Native <dialog> with showModal(): the browser traps focus, closes on Esc
// and makes the page behind it inert — no custom focus management needed.
export function MatchDialog({
  candidate,
  dialogId,
  onClose,
}: {
  candidate: Candidate;
  dialogId: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const viewportStyle = useDialogViewport();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      style={viewportStyle}
      onClose={onClose}
      aria-labelledby="match-title"
      className="m-auto w-[min(22rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-border bg-background p-6 text-foreground backdrop:bg-black/50"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {candidate.photos[0] && (
          <img
            src={candidate.photos[0]}
            alt=""
            className="size-24 rounded-full object-cover"
          />
        )}
        <h2 id="match-title" className="text-2xl font-semibold">
          Это мэтч!
        </h2>
        <p className="text-muted-foreground">
          Вы и {candidate.name ?? 'этот человек'} понравились друг другу.
        </p>
        <div className="flex w-full flex-col gap-2">
          <Link
            to={`/chat/${dialogId}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Написать
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              ref.current?.close();
              onClose();
            }}
          >
            Продолжить
          </Button>
        </div>
      </div>
    </dialog>
  );
}

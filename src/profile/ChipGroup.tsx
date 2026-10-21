import { cn } from '@/lib/utils';

export function ChipGroup({
  items,
  selected,
  onToggle,
  label,
}: {
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(item.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input hover:bg-muted',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

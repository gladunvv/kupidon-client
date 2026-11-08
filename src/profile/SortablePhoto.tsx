import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function SortablePhoto({
  url,
  index,
  disabled,
  children,
}: {
  url: string;
  index: number;
  disabled: boolean;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : undefined,
      }}
      className={`sortable-photo ${isDragging ? 'is-dragging' : ''}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="photo-drag-handle"
        aria-label={`Переместить фото ${index + 1}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </button>
      {children}
    </li>
  );
}

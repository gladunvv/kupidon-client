import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { SortablePhoto } from '@/profile/SortablePhoto';
import { useRef, useState, type ChangeEvent } from 'react';
import { getErrorMessage } from '@/api/error-messages';
import {
  useDeletePhoto,
  useReorderPhotos,
  useUploadPhotos,
} from '@/api/photos';
import { Button } from '@/components/ui/button';
import { makeMain, movePhoto } from '@/profile/photo-order';
import {
  ACCEPTED_TYPES,
  MAX_PHOTOS,
  validatePhoto,
} from '@/profile/photo-validation';

export function PhotosSection({ photos }: { photos: string[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const upload = useUploadPhotos(setProgress);
  const remove = useDeletePhoto();
  const reorder = useReorderPhotos();
  const remaining = MAX_PHOTOS - photos.length;
  const busy = upload.isPending || remove.isPending;

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = [...(event.target.files ?? [])];
    event.target.value = '';
    void addFiles(picked);
  }

  async function addFiles(picked: File[]) {
    if (busy) return;
    if (picked.length === 0) return;
    upload.reset();

    // Validate everything first, then cap by free slots: invalid files must
    // not be the ones that push a valid file over the limit.
    const errors: string[] = [];
    const valid: File[] = [];
    for (const file of picked) {
      const error = await validatePhoto(file);
      if (error) errors.push(`${file.name}: ${error}`);
      else valid.push(file);
    }
    if (valid.length > remaining) {
      errors.push(
        `Можно добавить ещё ${remaining} — пропущено: ${valid
          .slice(remaining)
          .map((file) => file.name)
          .join(', ')}`,
      );
    }
    setFileErrors(errors);

    const toUpload = valid.slice(0, remaining);
    if (toUpload.length > 0) {
      setProgress(0);
      upload.mutate(toUpload, { onSettled: () => setProgress(null) });
    }
  }

  return (
    <section
      className={`surface-panel photos-section flex flex-col gap-3 ${dragOver ? 'drop-active' : ''}`}
      onDragOver={(event) => {
        if ([...event.dataTransfer.types].includes('Files')) {
          event.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setDragOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        if (!busy && remaining > 0)
          void addFiles([...event.dataTransfer.files]);
      }}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Фото</h2>
        <span className="text-xs text-muted-foreground">
          {photos.length} из {MAX_PHOTOS}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Перетащи фото сюда, чтобы добавить. За ручку — чтобы поменять порядок.
      </p>
      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id || busy) return;
            reorder.reorder((list) => {
              const from = list.indexOf(String(active.id)),
                to = list.indexOf(String(over.id));
              return from < 0 || to < 0 ? list : arrayMove(list, from, to);
            });
          }}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                'Нажмите пробел, чтобы поднять фото. Стрелки меняют положение, пробел сохраняет, Escape отменяет.',
            },
          }}
        >
          <SortableContext items={photos} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3">
              {photos.map((url, index) => (
                <SortablePhoto
                  key={url}
                  url={url}
                  index={index}
                  disabled={busy}
                >
                  <div className="relative">
                    <img
                      src={url}
                      alt={`Фото ${index + 1}`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute top-1.5 left-1.5 rounded-md bg-background/90 px-1.5 py-0.5 text-xs">
                        Главное
                      </span>
                    )}
                  </div>
                  {confirmDelete === url ? (
                    <div className="flex flex-col gap-1.5 text-sm">
                      <span>Удалить?</span>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() =>
                            remove.mutate(url, {
                              onSettled: () => setConfirmDelete(null),
                            })
                          }
                        >
                          {remove.isPending ? 'Удаляем…' : 'Да'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={remove.isPending}
                          onClick={() => setConfirmDelete(null)}
                        >
                          Нет
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      <div className="contents">
                        <Button
                          type="button"
                          size="icon-sm"
                          className="w-full"
                          variant="outline"
                          aria-label={`Сдвинуть фото ${index + 1} влево`}
                          disabled={busy || index === 0}
                          onClick={() =>
                            reorder.reorder((list) => movePhoto(list, url, -1))
                          }
                        >
                          ←
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          className="w-full"
                          variant="outline"
                          aria-label={`Сдвинуть фото ${index + 1} вправо`}
                          disabled={busy || index === photos.length - 1}
                          onClick={() =>
                            reorder.reorder((list) => movePhoto(list, url, 1))
                          }
                        >
                          →
                        </Button>
                        {index > 0 && (
                          <Button
                            type="button"
                            size="icon-sm"
                            className="w-full"
                            variant="outline"
                            aria-label={`Сделать фото ${index + 1} главным`}
                            disabled={busy}
                            onClick={() =>
                              reorder.reorder((list) => makeMain(list, url))
                            }
                          >
                            ★
                          </Button>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="icon-sm"
                        className="w-full"
                        variant="outline"
                        aria-label={`Удалить фото ${index + 1}`}
                        disabled={busy}
                        onClick={() => setConfirmDelete(url)}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </SortablePhoto>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        hidden
        onChange={handleFiles}
      />
      <Button
        type="button"
        variant="outline"
        disabled={remaining <= 0 || upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {remaining <= 0 ? 'Загружено максимум фото' : 'Добавить фото'}
      </Button>
      {progress !== null && (
        <div
          role="progressbar"
          aria-label="Загрузка фото"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
      {fileErrors.map((error) => (
        <p key={error} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ))}
      {remove.error && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось удалить: {getErrorMessage(remove.error)}
        </p>
      )}
      {reorder.error && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось изменить порядок: {getErrorMessage(reorder.error)}
        </p>
      )}
      {upload.error && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось загрузить: {getErrorMessage(upload.error)}
        </p>
      )}
    </section>
  );
}

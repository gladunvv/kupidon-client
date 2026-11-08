import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PhotoGallery({
  photos,
  name,
}: {
  photos: string[];
  name: string;
}) {
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, Math.max(0, photos.length - 1));
  const start = useRef<{ x: number; y: number } | null>(null);
  const multiple = photos.length > 1;
  function move(delta: number) {
    setSelected((index + delta + photos.length) % photos.length);
  }
  if (!photos.length)
    return <div className="photo-placeholder">Фото пока нет</div>;
  return (
    <div
      className="photo-gallery"
      role="group"
      aria-roledescription="карусель"
      aria-label={`Фотографии: ${name}`}
      tabIndex={multiple ? 0 : undefined}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || !multiple) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          move(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
      onPointerDown={(event) => {
        if (event.pointerType === 'touch')
          start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
      onPointerUp={(event) => {
        if (start.current && multiple) {
          const dx = event.clientX - start.current.x,
            dy = event.clientY - start.current.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy))
            move(dx > 0 ? -1 : 1);
        }
        start.current = null;
      }}
    >
      <img
        src={photos[index]}
        alt={`${name}, фото ${index + 1} из ${photos.length}`}
        draggable={false}
      />
      {multiple && (
        <>
          <div className="gallery-indicators">
            {photos.map((photo, position) => (
              <button
                key={photo}
                type="button"
                aria-label={`Показать фото ${position + 1}`}
                aria-current={position === index ? 'true' : undefined}
                onClick={() => setSelected(position)}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="gallery-arrow gallery-prev"
            aria-label="Предыдущее фото"
            onClick={() => move(-1)}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="gallery-arrow gallery-next"
            aria-label="Следующее фото"
            onClick={() => move(1)}
          >
            <ChevronRight />
          </button>
          <span className="gallery-count" aria-live="polite">
            {index + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}
